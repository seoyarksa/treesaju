// api/send-otp.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "전화번호가 필요합니다." });
  }

  try {
    // 6자리 OTP 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // DB에 저장
    const { error } = await supabase.from("otp_codes").insert({
      phone,
      code,
    });
    if (error) throw error;

    // ✅ 실제 SMS 전송 대신 콘솔 출력 (테스트용)
    console.log(`발급된 OTP [${phone}]: ${code}`);

    return res.status(200).json({ success: true, test_code: code }); // test_code로 응답도 가능
  } catch (err) {
    console.error("[send-otp] error:", err);
    return res.status(500).json({ error: "OTP 발송 실패" });
  }
}

