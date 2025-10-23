
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

  // ✅ 즉시 전환(선결제 → 정기)
  if (req.method === "POST" && action === "switch_from_fixed_to_recurring") {
    return await switchFromFixedToRecurring(req, res);
  }

    // ✅ 즉시 전환(정기 → 선결제)
if (req.method === "POST" && action === "activate_fixed") {
  return await activateFixedAfterPayment(req, res);
}

  // (기존) 예약 관련은 막아둔 상태라면 그대로 두세요
  if (req.method === "POST" && action === "schedule_from_fixed") {
    return res.status(409).json({ error: 'SCHEDULING_DISABLED', message: '...' });
  }
  if (req.method === "POST" && action === "schedule_to_fixed") {
    return res.status(409).json({ error: 'SCHEDULING_TO_FIXED_DISABLED', message: '...' });
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
          metadata: { ...(existing?.metadata || {}), customer_uid },
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
         metadata: { ...(existing?.metadata || {}), customer_uid },
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
// /api/payment/manage-subscription.js 내부
// if (req.method === "POST" && action === "change_plan") return await changePlan(req, res);
async function verifyIamportPayment(token, imp_uid) {
  const r = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
    headers: { "Authorization": token },
  });
  const j = await r.json();
  if (j.code !== 0) throw new Error(j.message || "PAYMENT_LOOKUP_FAILED");
  return j.response; // { status, pay_method, pg_provider, pg_tid, paid_at, ... }
}

async function changePlan(req, res) {
  const { user_id, new_plan } = req.body || {};
  if (!user_id || !new_plan) {
    return res.status(400).json({ error: "MISSING_PARAMS" });
  }

  // 허용 플랜
  const allowed = new Set(["premium", "premium_plus", "premium3", "premium6"]);
  if (!allowed.has(new_plan)) {
    return res.status(400).json({ error: "INVALID_PLAN" });
  }

  // 유틸
  const safeParse = (raw) => {
    if (raw == null) return null;
    try {
      const a = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (typeof a === "string") { try { return JSON.parse(a); } catch { return a; } }
      return a;
    } catch { return null; }
  };
  async function getIamportToken() {
    const resp = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imp_key: process.env.IAMPORT_API_KEY,
        imp_secret: process.env.IAMPORT_API_SECRET,
      }),
    });
    const j = await resp.json();
    const token = j?.response?.access_token;
    if (!token) throw new Error("IAMPORT_TOKEN_FAILED");
    return token;
  }
  async function payNow(customer_uid, token, amount, name) {
    const r = await fetch("https://api.iamport.kr/subscribe/payments/again", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": token },
      body: JSON.stringify({
        customer_uid,
        merchant_uid: "plan_switch_" + Date.now(),
        amount,
        name,
      }),
    });
    const j = await r.json();
    if (j.code !== 0) throw new Error(j.message || "PAYMENT_FAILED");
    return j.response;
  }

  // 현재 멤버십
  const { data: cur, error: fetchErr } = await supabase
    .from("memberships")
    .select("id, user_id, plan, status, current_period_end, cancel_at_period_end, provider, metadata")
    .eq("user_id", user_id)
    .maybeSingle();
  if (fetchErr) return res.status(400).json({ error: "DB_SELECT_FAILED", detail: fetchErr.message });
  if (!cur)      return res.status(404).json({ error: "NOT_FOUND" });

  const nowIso = new Date().toISOString();
  const isRecurring = (p) => p === "premium" || p === "premium_plus";
  const isFixed     = (p) => p === "premium3" || p === "premium6";

  // ▶ 정기 ↔ 정기 : 즉시 결제 + 다음 결제일 연장 + 해지예약 해제
  if (isRecurring(cur.plan) && isRecurring(new_plan)) {
    try {
      // 1) 가격
      const amountMap = { premium: 11000, premium_plus: 16500 };
      const amount = amountMap[new_plan];
      if (!amount) return res.status(400).json({ error: "PLAN_PRICE_NOT_DEFINED" });

      // 2) 결제 키(customer_uid)
      const meta = safeParse(cur.metadata) || {};
      const customer_uid = meta?.customer_uid;
      if (!customer_uid) {
        // 빌링키 등록 유도
        return res.status(409).json({
          ok: false,
          error: "NEED_BILLING_KEY",
          message: "정기 플랜 전환에는 카드 자동결제 등록(빌링키)이 필요합니다. 결제 등록을 먼저 진행해 주세요.",
          next_plan: new_plan,
          hint: "start_billing_key",
        });
      }

// 3) 아임포트 즉시 결제
const token = await getIamportToken();
const paid  = await payNow(
  customer_uid,
  token,
  amount,
  new_plan === "premium_plus" ? "정기구독+ 플랜 변경 결제" : "정기구독(기본) 플랜 변경 결제"
);
// ✅ 3.5) 서버측 결제 검증
const v = await verifyIamportPayment(token, paid.imp_uid);
if (v.status !== "paid") {
  return res.status(402).json({ error: "PAYMENT_NOT_CONFIRMED" });
}

      // 4) 다음 결제일 = 기존 current_period_end 기준 +1개월 (과거면 now 기준)
      const baseEnd = cur.current_period_end ? new Date(cur.current_period_end) : new Date();
      const now = new Date();
      const base = baseEnd > now ? baseEnd : now;
      const nextEnd = new Date(base);
      nextEnd.setMonth(nextEnd.getMonth() + 1);

      // 5) 멤버십 갱신 (해지 예약 해제)
// 5) 멤버십 갱신 전: last_purchase 메타 확장
const newMeta = {
  ...(meta || {}),
  provider: cur.provider || "kakao",
  last_purchase: {
    kind: "recurring_switch",
    imp_uid: paid?.imp_uid,
    merchant_uid: paid?.merchant_uid,
    amount: paid?.amount,
    at: nowIso,
    to_plan: new_plan,
    // ✅ 검증정보 추가
    pay_method: v?.pay_method || "billing_key",
    pg_provider: v?.pg_provider || null,
    pg_tid: v?.pg_tid || null,
    paid_at_unix: v?.paid_at || null, // unix seconds
  },
  purchases: [
    ...(meta?.purchases || []),
    {
      kind: "recurring_switch",
      imp_uid: paid?.imp_uid,
      merchant_uid: paid?.merchant_uid,
      amount: paid?.amount,
      at: nowIso,
      to_plan: new_plan,
      pay_method: v?.pay_method || "billing_key",
      pg_provider: v?.pg_provider || null,
      pg_tid: v?.pg_tid || null,
      paid_at_unix: v?.paid_at || null,
    },
  ],
};

// ✅ jsonb 직렬화 안전화 (Date/undefined 제거)
const safeMeta = JSON.parse(JSON.stringify(newMeta));


// 멤버십 갱신
const { data: updated, error: upErr } = await supabase
  .from("memberships")
  .update({
    plan: new_plan,
    status: "active",
    cancel_at_period_end: false,
    cancel_effective_at: null,
    current_period_end: nextEnd.toISOString(),
    metadata: safeMeta,         // ← 여기!
    updated_at: nowIso,
  })
  .eq("id", cur.id)
  .select()
  .maybeSingle();

      if (upErr) return res.status(500).json({ error: "DB_UPDATE_FAILED", detail: upErr.message });

      // 6) 프로필 동기화(보조)
      const planGrade = new_plan === "premium_plus" ? "premium_plus" : "premium";
      const limit = new_plan === "premium_plus" ? 150 : 60;
      await supabase.from("profiles")
        .update({ grade: planGrade, daily_limit: limit, updated_at: nowIso })
        .eq("user_id", user_id);

      // 7) 응답
      return res.status(200).json({
        ok: true,
        mode: "recurring_changed_charged_now",
        message: `정기(${new_plan === "premium_plus" ? "플러스" : "기본"})로 전환되었습니다. 결제가 완료되었고 새 다음 결제일은 ${nextEnd.toISOString().slice(0,10)} 입니다.`,
        membership: updated,
      });
    } catch (e) {
      console.error("[changePlan recurring->recurring] error:", e);
      return res.status(500).json({ error: "PLAN_SWITCH_PAYMENT_FAILED", detail: e?.message || "" });
    }
  }

  // ▶ 정기 → 선결제 : 즉시 전환은 '구매' 필요 → 프런트에서 3/6 결제로 이어지게
  if (isRecurring(cur.plan) && isFixed(new_plan)) {
    return res.status(200).json({
      ok: true,
      mode: "switch_to_fixed",
      message: "선결제 상품으로 전환하려면 해당 상품을 결제해 주세요.",
      membership: cur,
    });
  }

  // ▶ 선결제 → 정기 : 즉시 전환은 정기 등록/결제 필요 → 프런트에서 billing key 등록/결제 진행
  if (isFixed(cur.plan) && isRecurring(new_plan)) {
    return res.status(200).json({
      ok: true,
      mode: "switch_to_recurring",
      message: "정기 구독 등록(결제)을 진행해 주세요.",
      membership: cur,
    });
  }

  // ▶ 선결제 ↔ 선결제 : 재구매 안내
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



// manage-subscription.js 내부
// 라우팅: if (req.method === "POST" && action === "switch_from_fixed_to_recurring") return await switchFromFixedToRecurring(req, res);
// (추가) 결제 검증 함수
async function getPayment(access_token, imp_uid) {
  const r = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
    headers: { Authorization: access_token },
  });
  const j = await r.json();
  if (j.code !== 0) throw new Error(j.message || "PAYMENT_LOOKUP_FAILED");
  return j.response; // { status, pay_method, pg_provider, pg_tid, paid_at, ... }
}
async function switchFromFixedToRecurring(req, res) {
  try {
    const { user_id, next_tier } = req.body || {};
    if (!user_id || !next_tier) return res.status(400).json({ error: "MISSING_PARAMS" });

    // tier 매핑
    const raw  = String(next_tier).trim().toLowerCase();
    const tier = { plus:'plus','premium_plus':'plus','premium+':'plus', basic:'basic', premium:'basic' }[raw];
    if (!tier) return res.status(400).json({ error: "INVALID_TIER" });
    const nextPlan = tier === 'plus' ? 'premium_plus' : 'premium';

    // 현재 멤버십 조회 (메타 포함: 빌링키 확인용)
    const { data: mem, error: selErr } = await supabase
      .from('memberships')
      .select('id, user_id, plan, status, provider, current_period_end, metadata')
      .eq('user_id', user_id)
      .maybeSingle();
    if (selErr) return res.status(500).json({ error: "DB_SELECT_FAILED", detail: selErr.message });
    if (!mem)   return res.status(404).json({ error: "MEMBERSHIP_NOT_FOUND" });

    // 선결제 → 정기만 허용
    if (!['premium3','premium6'].includes(mem.plan || '')) {
      return res.status(400).json({ error: "ONLY_FIXED_ALLOWED", detail: `current plan: ${mem.plan}` });
    }
    if (!mem.current_period_end) {
      return res.status(400).json({ error: "NO_EXPIRE_DATE" });
    }

    // 빌링키 확인 (정기 과금 필수)
    let meta = {};
    try { meta = typeof mem.metadata === 'string' ? JSON.parse(mem.metadata) : (mem.metadata || {}); } catch {}
    const customer_uid = meta?.customer_uid;
    if (!customer_uid) {
      return res.status(409).json({ error: "NEED_BILLING_KEY", next_plan: nextPlan });
    }

    // 아임포트 토큰
    const tokRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imp_key: process.env.IAMPORT_API_KEY,
        imp_secret: process.env.IAMPORT_API_SECRET,
      }),
    });
    const tokJson = await tokRes.json();
    const access_token = tokJson?.response?.access_token;
    if (!access_token) return res.status(500).json({ error: "IAMPORT_TOKEN_FAIL" });

    // 즉시 청구 (정기 시작 결제)
  // 즉시 청구
    const amount = (nextPlan === 'premium_plus') ? 16500 : 11000;
    const merchant_uid = `switch-fixed2recurring-${Date.now()}`;
    const againRes = await fetch("https://api.iamport.kr/subscribe/payments/again", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": access_token },
      body: JSON.stringify({
        customer_uid,
        merchant_uid,
        amount,
        name: `정기(${nextPlan}) 시작 결제`,
      }),
    });
    const again = await againRes.json();
    if (again.code !== 0) {
      return res.status(400).json({ error: "PAYMENT_FAILED", detail: again.message || "again failed" });
    }

    // ✅ 결제 검증
    const v = await getPayment(access_token, again.response.imp_uid);
    if (v.status !== "paid") {
      return res.status(402).json({ error: "PAYMENT_NOT_CONFIRMED" });
    }

    // 기간 계산(기존 동일)
    const prevEnd = new Date(mem.current_period_end);
    const now = new Date();
    const base = (prevEnd > now ? prevEnd : now);
    const nextEnd = new Date(base);
    nextEnd.setMonth(nextEnd.getMonth() + 1);

    // ✅ last_purchase에 결제 메타 확장
    const nowIso = new Date().toISOString();
    const purchase = {
      kind: 'recurring_start',
      imp_uid: again.response.imp_uid,
      merchant_uid,
      amount: again.response.amount,
      at: nowIso,
      pay_method: v.pay_method || null,
      pg_provider: v.pg_provider || null,
      pg_tid: v.pg_tid || null,
      paid_at_unix: v.paid_at || null, // unix(sec)
    };

    const newMeta = {
      ...(meta || {}),
      provider: 'kakao',
      last_purchase: purchase,
      purchases: [ ...(meta?.purchases || []), purchase ],
    };

    // ✅ jsonb 직렬화 안전화
    const safeMeta = JSON.parse(JSON.stringify(newMeta));

    // 멤버십 업데이트
    const { data: upd, error: upErr } = await supabase
      .from('memberships')
      .update({
        plan: nextPlan,
        status: 'active',
        provider: mem.provider || 'kakao',
        cancel_at_period_end: false,
        cancel_effective_at: null,
        current_period_end: nextEnd.toISOString(),
        metadata: safeMeta,
        updated_at: nowIso,
      })
      .eq('id', mem.id)
      .select()
      .maybeSingle();

    if (upErr) {
      return res.status(500).json({ error: "DB_UPDATE_FAILED", detail: upErr.message });
    }

    // (보조) 프로필 동기화 그대로
    await supabase.from('profiles').update({
      grade: nextPlan,
      daily_limit: (nextPlan === 'premium_plus') ? 150 : 60,
      updated_at: nowIso,
    }).eq('user_id', user_id);

    return res.status(200).json({
      ok: true,
      message: `정기(${nextPlan === 'premium' ? '기본' : '플러스'})로 즉시 전환되었습니다. 다음 결제일: ${nextEnd.toISOString().slice(0,10)}`,
      membership: upd,
    });
  } catch (e) {
    console.error('[switchFromFixedToRecurring] error:', e);
    return res.status(500).json({ error: 'INTERNAL_ERROR', detail: e?.message || '' });
  }
}




// util: 개월 더하기 (UTC 기반, 말일 이슈 단순화)
function addMonthsUTC(date, months) {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  return new Date(Date.UTC(y, m + months, day, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
}

// 안전 파서 (jsonb↔string 모두 대응)
function safeParse(raw) {
  if (raw == null) return {};
  try {
    const a = typeof raw === "string" ? JSON.parse(raw) : raw;
    return (typeof a === "string") ? JSON.parse(a) : (a || {});
  } catch { return {}; }
}

// manage-subscription.js 내부
// manage-subscription.js 내부
// manage-subscription.js 내부에 추가/교체

async function activateFixedAfterPayment(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const { imp_uid, merchant_uid, user_id, termMonths, price, productId } = req.body || {};
  if (!imp_uid || !merchant_uid || !user_id || !termMonths || !price) {
    return res.status(400).json({ error: 'MISSING_PARAMS' });
  }

  try {
    // 1) 아임포트 결제 검증
    const tokRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imp_key: process.env.IAMPORT_API_KEY,
        imp_secret: process.env.IAMPORT_API_SECRET,
      }),
    });
    const tokJson = await tokRes.json();
    const access_token = tokJson?.response?.access_token;
    if (!access_token) throw new Error("IAMPORT_TOKEN_FAIL");

    const payRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: { Authorization: access_token },
    });
    const payJson = await payRes.json();
    const payment = payJson?.response;
    if (!payment || payment.status !== "paid") {
      return res.status(400).json({ error: "PAYMENT_NOT_PAID" });
    }

    const months = Number(termMonths);
    const planName = months === 6 ? "premium6" : "premium3";
    const nowISO = new Date().toISOString();

    // 2) 현재 멤버십 조회
    const { data: mem, error: selErr } = await supabase
      .from("memberships")
      .select("id, user_id, plan, status, current_period_end, metadata")
      .eq("user_id", user_id)
      .maybeSingle();
    if (selErr) throw selErr;

    // 메타 준비
    let meta = {};
    try { meta = mem?.metadata && typeof mem.metadata === 'string' ? JSON.parse(mem.metadata) : (mem?.metadata || {}); } catch {}
const purchase = {
  imp_uid,
  merchant_uid,
  termMonths: months,
  price: Number(price),
  amount: Number(price),          // ← 추가 (트리거/뷰 호환)
  at: nowISO,
  pay_method: payment?.pay_method || "card",
  pg_provider: payment?.pg_provider || null,
  pg_tid: payment?.pg_tid || null,
  paid_at_unix: payment?.paid_at || null,
};

meta.last_purchase = purchase;
meta.purchases = Array.isArray(meta.purchases) ? meta.purchases : [];
meta.purchases.push(purchase);


    // 3) 현재 정기라면: "예약 기반 선결제" (기존 방식 유지: plan 변경 X, 해지예약 true, metadata에 예약 기록)
// 3) 현재 정기라면: ❌ 예약 X → ✅ 즉시 plan을 고정제로 바꾸되,
//    유효기간은 "현재 정기 만료 다음날 00:00 KST부터 +N개월"
if (mem && (mem.plan === 'premium' || mem.plan === 'premium_plus')) {
  // KST: 기존 만료일 다음날 00:00
  const prevEnd = mem.current_period_end ? new Date(mem.current_period_end) : new Date();
  const kstBase = new Date(prevEnd.getTime() + 9 * 3600 * 1000); // KST 보정
  kstBase.setUTCHours(0, 0, 0, 0);                // 해당 날짜 KST 00:00
  const startAtKST = new Date(kstBase.getTime() + 24 * 3600 * 1000); // 다음날 00:00
  const expireAtKST = new Date(startAtKST);
  expireAtKST.setMonth(expireAtKST.getMonth() + months);

  // 메타 갱신
  meta.last_purchase = purchase;
  meta.purchases = Array.isArray(meta.purchases) ? meta.purchases : [];
  meta.purchases.push(purchase);
  if (meta.scheduled_change) delete meta.scheduled_change; // 예약 잔재 제거
  meta.provider = 'kakao';
  meta.kind = 'fixed';

  const { data: upd, error: upErr } = await supabase
    .from("memberships")
    .update({
      plan: planName,                 // 'premium3' | 'premium6' 로 즉시 전환
      status: 'active',
      provider: 'kakao',
      cancel_at_period_end: true,     // 고정제는 기간 끝에 자동 종료
      cancel_effective_at: expireAtKST.toISOString(),
      current_period_end:  expireAtKST.toISOString(),
      metadata: meta,                 // jsonb: 객체 그대로
      updated_at: nowISO,
    })
    .eq("id", mem.id)
    .select()
    .maybeSingle();

  if (upErr) return res.status(400).json({ error: 'DB_UPDATE_FAILED', detail: upErr.message });

  // (선택) 프로필 보조 동기화 — 트리거가 처리하면 생략 가능
  try {
    await supabase.from("profiles").update({
      grade: planName,                // 등급 정책에 맞게 매핑한다면 여기서 'premium' 으로 바꿔도 됨
      daily_limit: 60,
      updated_at: nowISO
    }).eq("user_id", user_id);
  } catch (_) {}

  return res.status(200).json({
    ok: true,
    mode: "fixed_activated_immediately",
    message: `프리미엄${months}으로 전환 완료. 새 유효기간: ${expireAtKST.toISOString().slice(0,10)} 까지`,
    membership: upd
  });
}


    // 4) 그 외(미보유/선결제 상태 등): 즉시 활성화 (기존 로직 유지)
    const start = new Date();             // 즉시 시작
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);

    meta = {
      ...(meta || {}),
      provider: 'kakao',
      kind: 'fixed',
      last_purchase: purchase,
      purchases: [ ...(meta.purchases || []), purchase ],
      ...(productId ? { productId } : {})
    };

    const payload = {
      plan: planName,
      status: 'active',
      provider: 'kakao',
      current_period_end: end.toISOString(),
      cancel_at_period_end: true,
      cancel_effective_at: end.toISOString(),
      price_id: null,
      metadata: meta, // jsonb
      updated_at: nowISO
    };

    if (mem) {
      const { data: upd, error: upErr } = await supabase
        .from("memberships")
        .update(payload)
        .eq("id", mem.id)
        .select()
        .maybeSingle();
      if (upErr) return res.status(400).json({ error: 'DB_UPDATE_FAILED', detail: upErr.message });

      return res.status(200).json({ ok: true, mode: "updated", membership: upd });
    } else {
      const { data: ins, error: insErr } = await supabase
        .from("memberships")
        .insert({ user_id, ...payload, created_at: nowISO })
        .select()
        .single();
      if (insErr) return res.status(400).json({ error: 'DB_INSERT_FAILED', detail: insErr.message });

      return res.status(200).json({ ok: true, mode: "inserted", membership: ins });
    }
  } catch (e) {
    console.error("[activateFixedAfterPayment] error:", e);
    return res.status(500).json({ error: e?.message || "INTERNAL_ERROR" });
  }
}
