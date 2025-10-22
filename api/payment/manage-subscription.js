
// /api/payment/manage-subscription.js


import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
console.log("[ENV CHECK] SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);


export default async function handler(req, res) {
  // 🔎 액션 정규화 + 라우팅 로그 (가장 먼저!)
  const rawAction = (req.query?.action ?? '').toString();
  const action = rawAction.toLowerCase().replace(/-/g, '_').trim();
  console.log('[manage-subscription] method=%s raw=%s -> %s url=%s',
    req.method, rawAction, action, req.url);

      // (선택) 헬스체크
  if ((req.method === 'GET' || req.method === 'POST') && action === 'health') {
    return res.status(200).json({ ok: true, ts: new Date().toISOString() });
  }
  // ✅ 예약 집행 엔드포인트(크론/수동 호출)
  if ((req.method === "GET" || req.method === "POST") && action === "apply_scheduled_changes") {
    return await processScheduledChanges(req, res);
  }
      // 👇👇👇 추가: 선결제 → 정기 전환 "예약" (만료일 이후 적용)
  if (req.method === "POST" && action === "schedule_from_fixed") {
    return await scheduleFromFixed(req, res);
  }
  // 👆👆👆
  // 정기 → 선결제 전환 "예약"
if (req.method === "POST" && action === "schedule_to_fixed") {
  return await scheduleToFixed(req, res);
}

  if (req.method === "POST" && action === "register") {
    return await registerBilling(req, res);
  }
  if (req.method === "POST" && action === "cancel") {
    return await cancelSubscription(req, res);
  }



   // ✅ 재구독(정기결제만 해당: cancel_at_period_end 해제)
  if (req.method === "POST" && action === "resume") {
    return await resumeSubscription(req, res);
  }
  // 핸들러 상단 액션 분기 추가
if (req.method === "POST" && action === "change_plan") {
  return await changePlan(req, res);
}

  if (req.method === "GET" && action === "autoCancel") {
    return await autoCancelExpired(req, res);
  }
  if (req.method === "GET" && action === "charge") {
    return await chargeBilling(req, res);
  }


  return res.status(405).json({ error: "Invalid request" });
}

//
// ✅ 1️⃣ 결제 등록 및 프리미엄 등급 적용
//
async function registerBilling(req, res) {
  const { imp_uid, customer_uid, user_id } = req.body;
  if (!imp_uid || !customer_uid || !user_id)
    return res.status(400).json({ error: "Missing parameters" });

  try {
    // 1. 아임포트 인증
    const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imp_key: process.env.IAMPORT_API_KEY,
        imp_secret: process.env.IAMPORT_API_SECRET,
      }),
    });
    const tokenJson = await tokenRes.json();
    const access_token = tokenJson?.response?.access_token;
    if (!access_token) throw new Error("Failed to get access_token");

    // 2. 결제 확인
    const verifyRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: { Authorization: access_token },
    });
    const verifyJson = await verifyRes.json();
    const payment = verifyJson?.response;
    if (!payment || payment.status !== "paid")
      throw new Error("Payment not completed");

    // 3. memberships 등록 또는 갱신
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);

    const { data: existing } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    let data, error;
    if (existing) {
      ({ data, error } = await supabase
        .from("memberships")
        .update({
          plan: "premium",
          status: "active",
          provider: "kakao",
          metadata: { customer_uid },
          current_period_end: nextMonth.toISOString(),
          cancel_at_period_end: false,
          updated_at: now.toISOString(),
        })
        .eq("user_id", user_id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from("memberships")
        .insert({
          user_id,
          plan: "premium",
          status: "active",
          provider: "kakao",
          metadata: { customer_uid },
          current_period_end: nextMonth.toISOString(),
          cancel_at_period_end: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select()
        .single());
    }

    if (error) throw error;

// ✅ 4. profiles.grade 변경 (role 아님)
const { error: profileErr } = await supabase
  .from("profiles")
  .update({
    grade: "premium",                      // ✅ 프리미엄 등급
    premium_assigned_at: now.toISOString(),
    premium_first_assigned_at: now.toISOString(),
    has_ever_premium: true,
    updated_at: now.toISOString(),
  })
  .eq("user_id", user_id);

if (profileErr) {
  console.error("[registerBilling] profile update error:", profileErr);
  throw new Error("프로필 등급 변경 실패");
}
    return res.status(200).json({
      ok: true,
      message: "정기결제 등록 및 프리미엄 등급 전환 완료 ✅",
      membership: data,
    });
  } catch (err) {
    console.error("[registerBilling] error:", err);
    return res.status(500).json({ error: err.message });
  }
}

//
// ✅ 2️⃣ 사용자가 해지 신청 (결제일 기준 한 달 후 해지)
async function cancelSubscription(req, res) {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  try {
    const { data: membership, error: fetchErr } = await supabase
      .from("memberships")
      .select("current_period_end, status")
      .eq("user_id", user_id)
      .maybeSingle(); // ← 행 없으면 null, 에러 아님

    if (fetchErr) throw fetchErr;
    if (!membership) throw new Error("Membership not found");

    // current_period_end 없으면 오늘로 처리(안내용)
    const cancelDate = membership.current_period_end
      ? new Date(membership.current_period_end)
      : new Date();

    const nowIso = new Date().toISOString();

    // 🔑 핵심: status는 그대로 두고, cancel_at_period_end만 true로
    const { data, error } = await supabase
      .from("memberships")
      .update({
        cancel_at_period_end: true,
        updated_at: nowIso,
      })
      .eq("user_id", user_id)
      .in("status", ["active", "past_due"]) // 진행 중인 구독만
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("No active membership to cancel");

    return res.status(200).json({
      ok: true,
      message: `해지 신청 완료. 다음 결제 주기(${cancelDate.toISOString().slice(0, 10)}) 이후 자동 해지됩니다.`,
      membership: data,
    });
  } catch (err) {
    console.error("[cancelSubscription] error:", err);
    return res.status(500).json({ error: err.message });
  }
}


//
// ✅ 3️⃣ 자동 해지 (cron job)
// 만료 도달 시 처리:
// 1) memberships.metadata.scheduled_next 가 있으면 그 계획으로 전환
// 2) 없으면 기존 로직대로 inactive 처리 + profile 등급 basic 복귀
async function autoCancelExpired(req, res) {
  try {
    const now = new Date();
    const nowIso = now.toISOString();

    // 해지 신청(true) + 기간 종료 도달 + 진행 중인 구독만
    const { data: targets, error } = await supabase
      .from("memberships")
      .select("user_id, plan, status, current_period_end, metadata")
      .eq("cancel_at_period_end", true)
      .lte("current_period_end", nowIso)
      .in("status", ["active", "past_due"]);

    if (error) throw error;

    if (!targets?.length) {
      return res.status(200).json({ ok: true, message: "해지/전환 대상 없음", count: 0 });
    }

    let switched = 0; // 예약 전환 수
    let canceled = 0; // 비활성 처리 수

    // 안전 파서 (문자열 2중 직렬화 대비)
    const safeParse = (raw) => {
      if (!raw) return null;
      try {
        const a = typeof raw === "string" ? JSON.parse(raw) : raw;
        // 어떤 경우엔 문자열 안에 또 JSON이 들어있을 수 있음
        if (typeof a === "string") {
          try { return JSON.parse(a); } catch { return a; }
        }
        return a;
      } catch {
        return null;
      }
    };

    for (const t of targets) {
      const meta = safeParse(t.metadata) || {};
      const scheduled = meta?.scheduled_next;
      const end = t.current_period_end ? new Date(t.current_period_end) : null;

      // 방어: 정말로 만료를 지났는지 재확인
      if (!end || now < end) continue;

      // ① 예약 전환이 있는 경우 (예: 고정→정기 전환)
      if (scheduled?.kind === "recurring") {
        // next plan 결정
        const nextPlan = scheduled.plan === "premium_plus" ? "premium_plus" : "premium";

        // 다음 주기 종료일(간단히 +1개월)
        const nextEnd = new Date();
        nextEnd.setMonth(nextEnd.getMonth() + 1);

        // metadata에서 예약 정보 제거(원하면 history에 남겨도 좋음)
        try { delete meta.scheduled_next; } catch {}

        // 멤버십 전환
        const { error: upErr } = await supabase
          .from("memberships")
          .update({
            plan: nextPlan,
            status: "active",
            cancel_at_period_end: false,
            current_period_end: nextEnd.toISOString(),
            updated_at: nowIso,
            metadata: JSON.stringify(meta),
          })
          .eq("user_id", t.user_id);

        if (upErr) throw upErr;

        // 프로필 등급도 맞춰 반영
        const { error: profErr } = await supabase
          .from("profiles")
          .update({
            grade: nextPlan,            // 'premium' | 'premium_plus'
            updated_at: nowIso,
          })
          .eq("user_id", t.user_id);

        if (profErr) throw profErr;

        switched++;
        console.log(`[🔁 예약 전환 완료] user_id=${t.user_id}, plan=${nextPlan}`);
        continue;
      }

      // ② 예약 전환이 없으면 기존대로 비활성 처리
      const { error: upErr } = await supabase
        .from("memberships")
        .update({
          status: "inactive",
          cancel_at_period_end: false,
          updated_at: nowIso,
        })
        .eq("user_id", t.user_id);
      if (upErr) throw upErr;

      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          grade: "basic",
          updated_at: nowIso,
        })
        .eq("user_id", t.user_id);
      if (profErr) throw profErr;

      canceled++;
      console.log(`[✅ 해지 완료] user_id=${t.user_id}`);
    }

    return res.status(200).json({
      ok: true,
      message: `처리 완료: 예약 전환 ${switched}건, 해지 ${canceled}건`,
      switched,
      canceled,
      count: (switched + canceled),
    });
  } catch (err) {
    console.error("[autoCancelExpired] error:", err);
    return res.status(500).json({ error: err.message });
  }
}

//
// ✅ 4️⃣ 자동 과금 (charge-billing 기능 통합)
//
async function chargeBilling(req, res) {
  try {
    const safeParse = (raw) => {
      if (!raw) return null;
      try {
        const a = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (typeof a === "string") { try { return JSON.parse(a); } catch { return a; } }
        return a;
      } catch { return null; }
    };
    const now = new Date();
    now.setHours(now.getHours() + 9); // KST
    const today = now.toISOString();

    const { data: users, error } = await supabase
      .from("memberships")
      .select("id, user_id, plan, status, provider, current_period_end, metadata")
      .eq("status", "active")
      .eq("provider", "kakao");

    if (error) throw error;
    if (!users?.length)
      return res.status(200).json({ ok: true, message: "결제 대상 사용자가 없습니다." });

    const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imp_key: process.env.IAMPORT_API_KEY,
        imp_secret: process.env.IAMPORT_API_SECRET,
      }),
    });
    const tokenJson = await tokenRes.json();
    const access_token = tokenJson?.response?.access_token;
    if (!access_token) throw new Error("토큰 발급 실패");

    let chargedCount = 0, failedCount = 0;

    for (const u of users) {
      const end = new Date(u.current_period_end);
      if (now >= end) {
        const m = safeParse(u.metadata) || {};
        const customer_uid = m.customer_uid;
        if (!customer_uid) continue;

        const result = await attemptPayment(customer_uid, access_token);
        if (result.success) {
          chargedCount++;
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);

          await supabase.from("memberships").update({
            current_period_end: nextMonth.toISOString(),
            updated_at: now.toISOString(),
          }).eq("id", u.id);
        } else {
          failedCount++;
          await supabase.from("memberships").update({
            status: "inactive",
            cancel_at_period_end: true,
            updated_at: now.toISOString(),
          }).eq("id", u.id);
        }
      }
    }

    return res.status(200).json({ ok: true, chargedCount, failedCount });
  } catch (err) {
    console.error("[chargeBilling] error:", err);
    res.status(500).json({ error: err.message });
  }
}

// ✅ 아임포트 자동 결제 API
async function attemptPayment(customer_uid, token) {
  try {
    const payRes = await fetch("https://api.iamport.kr/subscribe/payments/again", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify({
        customer_uid,
        merchant_uid: "auto_" + Date.now(),
        amount: 11000,
        name: "월간 프리미엄 구독 결제 (카카오페이)",
      }),
    });
    const payJson = await payRes.json();
    return payJson.code === 0
      ? { success: true, response: payJson.response }
      : { success: false, message: payJson.message };
  } catch (e) {
    return { success: false, message: e.message };
  }
}



//
// ✅ 재구독: 정기결제 해지 예약 취소 (정기 플랜만 대상)
//  - cancel_at_period_end: false
//  - cancel_effective_at: null
//  - status: 'active' 로 복구
//
async function resumeSubscription(req, res) {
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  try {
    // 현재 멤버십 조회
    const { data: membership, error: fetchErr } = await supabase
      .from("memberships")
      .select("id, user_id, plan, status, cancel_at_period_end, current_period_end")
      .eq("user_id", user_id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!membership) return res.status(404).json({ error: "Membership not found" });

    // ⚠️ 선결제(premium3/premium6)는 '재구독' 개념이 아니라 '재구매'
    if (membership.plan === "premium3" || membership.plan === "premium6") {
      return res.status(400).json({ error: "FIXED_TERM_PLAN", message: "선결제 플랜은 재구독이 아닌 재구매가 필요합니다." });
    }

    const nowIso = new Date().toISOString();

    // 정기 플랜(예: premium / premium_plus) → 해지 예약만 해제
    const { data, error } = await supabase
      .from("memberships")
      .update({
        cancel_at_period_end: false,
        cancel_effective_at: null,
        status: "active",
        updated_at: nowIso,
      })
      .eq("user_id", user_id)
      .select()
      .maybeSingle();

    if (error) throw error;

    // (선택) 프로필 등급 복구: 현재 플랜명을 그대로 grade에 반영
    //   - 너희 정책상 grade 값이 'premium' 또는 'premium_plus' 라면 아래 그대로 사용
    const planGrade = (membership.plan === "premium_plus") ? "premium_plus" : "premium";
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        grade: planGrade,
        updated_at: nowIso,
      })
      .eq("user_id", user_id);

    if (profileErr) {
      console.warn("[resumeSubscription] profile update warn:", profileErr);
      // 프로필 실패는 치명적이지 않으니 200은 유지, 필요하면 400으로 바꿔도 됨
    }

    return res.status(200).json({
      ok: true,
      message: "재구독이 완료되었습니다.",
      membership: data,
    });
  } catch (err) {
    console.error("[resumeSubscription] error:", err);
    return res.status(500).json({ error: err.message });
  }
}


// 하단에 함수 추가 플랜변경
async function changePlan(req, res) {
  const { user_id, new_plan } = req.body || {};
  if (!user_id || !new_plan) {
    return res.status(400).json({ error: "MISSING_PARAMS" });
  }

  // 허용 플랜만
  const allowed = new Set(["premium", "premium_plus", "premium3", "premium6"]);
  if (!allowed.has(new_plan)) {
    return res.status(400).json({ error: "INVALID_PLAN" });
  }

  // 현재 멤버십 확인
  const { data: cur, error: fetchErr } = await supabase
    .from("memberships")
    .select("id, user_id, plan, status, current_period_end, cancel_at_period_end")
    .eq("user_id", user_id)
    .maybeSingle();
  if (fetchErr) return res.status(400).json({ error: "DB_SELECT_FAILED", detail: fetchErr.message });
  if (!cur) return res.status(404).json({ error: "NOT_FOUND" });

  const nowIso = new Date().toISOString();
  const isRecurring = (p) => p === "premium" || p === "premium_plus";
  const isFixed     = (p) => p === "premium3" || p === "premium6";

  // 타입이 같은 정기↔정기 변경
  if (isRecurring(cur.plan) && isRecurring(new_plan)) {
    const { data, error } = await supabase
      .from("memberships")
      .update({
        plan: new_plan,
        // 정기 구독은 자동 갱신이므로 해지 예약은 유지/해제하지 않음
        updated_at: nowIso,
      })
      .eq("id", cur.id)
      .select()
      .maybeSingle();
    if (error) return res.status(400).json({ error: "DB_UPDATE_FAILED", detail: error.message });

    // 프로필 등급도 맞춰줌
    const planGrade = new_plan === "premium_plus" ? "premium_plus" : "premium";
    await supabase.from("profiles")
      .update({ grade: planGrade, updated_at: nowIso })
      .eq("user_id", user_id);

    return res.status(200).json({
      ok: true,
      mode: "recurring_changed",
      message: "플랜이 변경되었습니다. 다음 결제부터 새 요금이 적용됩니다.",
      membership: data,
    });
  }

  // 타입이 바뀌는 경우(정기↔선결제)
  // 정기는 해지 예약만 걸어두고(기간 끝나면 종료), 프런트에서 새 상품 결제 유도
  if (isRecurring(cur.plan) && isFixed(new_plan)) {
    const { data, error } = await supabase
      .from("memberships")
      .update({
        cancel_at_period_end: true,
        // cur.current_period_end 는 그대로. 만료일 도달 시 cron(autoCancel)로 비활성화됨
        updated_at: nowIso,
      })
      .eq("id", cur.id)
      .select()
      .maybeSingle();
    if (error) return res.status(400).json({ error: "DB_UPDATE_FAILED", detail: error.message });

    return res.status(200).json({
      ok: true,
      mode: "switch_to_fixed",
      message: "정기 구독이 기간 만료 시 자동 종료됩니다. 원하는 선결제 상품을 다시 구매해 주세요.",
      membership: data,
    });
  }

  if (isFixed(cur.plan) && isRecurring(new_plan)) {
    // 선결제에서 정기로 전환: 지금 플랜은 그대로 두고, 프런트에서 정기 결제 시작(등록)
    return res.status(200).json({
      ok: true,
      mode: "switch_to_recurring",
      message: "정기 구독 등록을 진행해 주세요.",
      membership: cur,
    });
  }

  // 선결제↔선결제 변경은 사실 '재구매'이므로 서버에선 안내만
  if (isFixed(cur.plan) && isFixed(new_plan)) {
    return res.status(200).json({
      ok: true,
      mode: "fixed_to_fixed",
      message: "새 선결제 상품으로 다시 구매해 주세요.",
      membership: cur,
    });
  }

  return res.status(400).json({ error: "UNSUPPORTED_CHANGE" });
}


// ✅ 선결제(premium3/6) → 정기(기본/플러스) "예약"
// body: { user_id, next_tier: 'basic' | 'plus' }
// 예약: 선결제(premium3/6) → 정기(basic/plus) 전환을 만료일에 집행하도록 저장
// 예약: 선결제(premium3/6) → 정기(basic/plus) 전환을 만료일에 집행하도록 저장
// 핸들러 분기 그대로 사용:
// if (req.method === "POST" && action === "schedule_from_fixed") return await scheduleFromFixed(req, res);

// 파일 상단: service role로 생성되어 있어야 함
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 선결제 → 정기 전환 예약: 비활성 (안내만)
async function scheduleFromFixed(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }
  return res.status(409).json({
    ok: false,
    error: 'SCHEDULING_DISABLED',
    message: '현재는 선결제 → 정기 전환 “예약”을 지원하지 않습니다. 만료일 1일 전부터 정기 등록이 가능합니다. 만료일 이후에 정기 결제를 진행해 주세요.'
  });
}

// 정기 → 선결제 전환 예약: 비활성 (안내만)
async function scheduleToFixed(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    }

    const { user_id, termMonths } = req.body || {};
    if (!user_id || !termMonths) {
      return res.status(400).json({ error: 'MISSING_OR_INVALID_PARAMS' });
    }

    return res.status(409).json({
      ok: false,
      error: 'SCHEDULING_TO_FIXED_DISABLED',
      message: '현재는 정기 → 선결제 전환 “예약”을 지원하지 않습니다. 만료일 1일 전부터 전환/구매 진행이 가능합니다. 만료일 이후 원하시는 선결제 상품을 새로 구매해 주세요.',
      hint: 'show_purchase_fixed_products'
    });
  } catch (e) {
    console.error('[scheduleToFixed] INTERNAL_ERROR:', e);
    return res.status(500).json({ error: 'INTERNAL_ERROR', detail: e?.message || '' });
  }
}





