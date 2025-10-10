import dotenv from "dotenv";
dotenv.config();

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

console.log("[ENV CHECK] IAMPORT_API_KEY:", process.env.IAMPORT_API_KEY);
console.log("[ENV CHECK] IAMPORT_API_SECRET:", process.env.IAMPORT_API_SECRET ? "✅ Loaded" : "❌ Missing");
console.log("[ENV CHECK] SUPABASE_SERVICE_ROLE:", process.env.SUPABASE_SERVICE_ROLE ? "✅ Loaded" : "❌ Missing");


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
    // 1. 토큰 발급
    const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imp_key: process.env.IAMPORT_API_KEY,
        imp_secret: process.env.IAMPORT_API_SECRET,
      }),
    });
    const tokenJson = await tokenRes.json();
    console.log("[register-billing] tokenJson:", tokenJson);
    const access_token = tokenJson?.response?.access_token;
    if (!access_token) {
      throw new Error("Failed to get access_token");
    }

    // 2. 결제 정보 검증
    const verifyRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: { Authorization: access_token }
    });
    const verifyJson = await verifyRes.json();
    console.log("[register-billing] verifyJson:", verifyJson);
    const payment = verifyJson?.response;
    if (!payment) throw new Error("No payment response");
    if (payment.status !== "paid") {
      throw new Error("Payment not completed");
    }

    // 3. memberships 업데이트
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);

    const { data, error } = await supabase
      .from("memberships")
      .upsert(
        {
          user_id,
          plan: "premium",
          status: "active",
          provider: "kakao",
          metadata: { customer_uid },
          current_period_end: nextMonth.toISOString(),
          cancel_at_period_end: false,
          updated_at: now.toISOString()
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[register-billing] supabase upsert error:", error);
      throw error;
    }

    console.log("[register-billing] membership data:", data);

    return res.status(200).json({
      ok: true,
      message: "정기결제 등록 완료",
      membership: data,
    });
  } catch (err) {
  console.error("[register-billing] error caught:", err);

  // ✅ 명시적으로 JSON 반환 (HTML 안 나오게)
  res.status(500).json({
    ok: false,
    error: err.message || "Unknown server error",
  });
}

}
