import dotenv from "dotenv";
dotenv.config();

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { imp_uid, customer_uid, user_id } = req.body;
  console.log("[register-billing] req.body:", req.body);

  if (!imp_uid || !customer_uid || !user_id) {
    console.error("[register-billing] missing parameters", { imp_uid, customer_uid, user_id });
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    // 1️⃣ 아임포트 토큰 발급
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

    // 2️⃣ 결제 검증
    const verifyRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: { Authorization: access_token },
    });
    const verifyJson = await verifyRes.json();
    const payment = verifyJson?.response;
    if (!payment) throw new Error("No payment response");
    if (payment.status !== "paid") throw new Error("Payment not completed");

    // 3️⃣ memberships에 등록 또는 갱신
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
    console.log("[register-billing] membership updated:", data);

    // 4️⃣ profiles에 프리미엄 등급 반영
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        role: "premium",
        premium_assigned_at: now.toISOString(),
      })
      .eq("user_id", user_id);

    if (profileErr) {
      console.warn("[register-billing] ⚠️ profile update failed:", profileErr);
    } else {
      console.log("[register-billing] ✅ profile upgraded to premium");
    }

    // 5️⃣ 응답
    return res.status(200).json({
      ok: true,
      message: "정기결제 등록 및 프리미엄 전환 완료 ✅",
      membership: data,
    });
  } catch (err) {
    console.error("[register-billing] error caught:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Unknown server error",
    });
  }
}