
// /api/payment/manage-subscription.js

import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
console.log("[ENV CHECK] SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);


export default async function handler(req, res) {
  const { action } = req.query;

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
async function autoCancelExpired(req, res) {
  try {
    const nowIso = new Date().toISOString();

    // 해지 신청 + 기간 종료 도달한 대상
    const { data: targets, error } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("cancel_at_period_end", true)
      .lte("current_period_end", nowIso)
      .in("status", ["active", "past_due"]); // 진행 중이던 것만

    if (error) throw error;
    if (!targets?.length) {
      return res.status(200).json({ ok: true, message: "해지 대상 없음", count: 0 });
    }

    for (const t of targets) {
      // 1) 멤버십 중지
      const { error: upErr } = await supabase
        .from("memberships")
        .update({
          status: "inactive",          // ✅ 허용값 사용 ('canceled'로 바꾸고 싶으면 여기만 변경)
          cancel_at_period_end: false,
          updated_at: nowIso,
        })
        .eq("user_id", t.user_id);
      if (upErr) throw upErr;

      // 2) 프로필 등급 복귀
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          grade: "basic",
          updated_at: nowIso,
        })
        .eq("user_id", t.user_id);
      if (profErr) throw profErr;

      console.log(`[✅ 해지 완료] user_id: ${t.user_id}`);
    }

    return res.status(200).json({
      ok: true,
      count: targets.length,
      message: `${targets.length}명의 구독 해지 완료`,
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
        const customer_uid = u.metadata?.customer_uid;
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
