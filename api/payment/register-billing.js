import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { imp_uid, customer_uid, user_id } = req.body;
  if (!imp_uid || !customer_uid || !user_id)
    return res.status(400).json({ error: "필수 정보 누락 (imp_uid, customer_uid, user_id)" });

  try {
    // ✅ 1️⃣ 아임포트 토큰 발급
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
    if (!access_token) throw new Error("IAMPORT 토큰 발급 실패");

    // ✅ 2️⃣ 결제 내역 확인 (검증)
    const verifyRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: { Authorization: access_token },
    });
    const verifyJson = await verifyRes.json();
    const payment = verifyJson?.response;

    if (!payment) throw new Error("결제 내역을 확인할 수 없습니다.");
    if (payment.status !== "paid") throw new Error("결제가 완료되지 않았습니다.");

    // ✅ 3️⃣ memberships 테이블 업데이트
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
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id" } // 기존 구독이 있으면 덮어쓰기
      )
      .select()
      .single();

    if (error) throw error;

    // ✅ 4️⃣ 응답 반환
    res.status(200).json({
      ok: true,
      message: "정기결제 등록 완료",
      membership: data,
    });

  } catch (err) {
    console.error("[register-billing error]", err);
    res.status(500).json({ error: err.message });
  }
}
