import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "전화번호 필요" });

  // 6자리 코드 생성
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // 코드 DB 저장 (3분 유효)
  await supabase.from("otp_codes").insert({
    phone,
    code,
    expires_at: new Date(Date.now() + 3 * 60 * 1000)
  });

  // 실제 SMS 전송 대신 콘솔 출력
  console.log(`[DEV] OTP for ${phone}: ${code}`);

  return res.json({ ok: true });
}
