import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { action } = req.query;

  if (req.method === "POST" && action === "register") {
    return await registerBilling(req, res);
  }
  if (req.method === "POST" && action === "cancel") {
    return await cancelSubscription(req, res);
  }
  if (req.method === "GET" && action === "autoCancel") {
    return await autoCancelExpired(req, res);
  }

  return res.status(405).json({ error: "Invalid request" });
}

// ✅ 1️⃣ 결제 등록 및 프리미엄 등급 적용
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

    // 4. profiles.role 변경
    await supabase
      .from("profiles")
      .update({
        role: "premium",
        premium_assigned_at: now.toISOString(),
      })
      .eq("user_id", user_id);

    return res.status(200).json({
      ok: true,
      message: "정기결제 등록 및 프리미엄 등급 전환 완료",
      membership: data,
    });
  } catch (err) {
    console.error("[registerBilling] error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ✅ 2️⃣ 사용자가 해지 신청
async function cancelSubscription(req, res) {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  try {
    const now = new Date();
    const { data, error } = await supabase
      .from("memberships")
      .update({
        status: "cancel_requested",
        cancel_at_period_end: true,
        updated_at: now.toISOString(),
      })
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      ok: true,
      message: "해지 신청 완료. 이번 달 말일에 해지됩니다.",
      membership: data,
    });
  } catch (err) {
    console.error("[cancelSubscription] error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// ✅ 3️⃣ 자동 해지 (cron job)
async function autoCancelExpired(req, res) {
  try {
    const now = new Date().toISOString();

    const { data: targets, error } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("cancel_at_period_end", true)
      .lte("current_period_end", now)
      .eq("status", "cancel_requested");

    if (error) throw error;
    if (!targets?.length)
      return res.status(200).json({ message: "해지 대상 없음" });

    for (const t of targets) {
      await supabase
        .from("memberships")
        .update({
          status: "inactive",
          cancel_at_period_end: false,
          updated_at: now,
        })
        .eq("user_id", t.user_id);

      await supabase
        .from("profiles")
        .update({ role: "normal" })
        .eq("user_id", t.user_id);

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
