// api/verify-otp.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 반드시 service_role 키여야 update 가능
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone, token, user_id } = req.body;
  if (!phone || !token || !user_id) {
    return res.status(400).json({ error: "전화번호, 코드, 유저 ID가 필요합니다." });
  }

  try {
    // 1. OTP 코드 확인 (최근 5분 내 발급된 것만 허용)
    const { data: otpRow, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("code", token)
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRow) {
      return res.status(400).json({ error: "인증 코드가 올바르지 않거나 만료되었습니다." });
    }

    // 2. profiles 업데이트 (본인 확인 완료)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        phone,
        phone_verified: true,
      })
      .eq("user_id", user_id);

    if (updateError) {
      // UNIQUE 제약조건 위반 → 이미 다른 계정에서 사용한 번호
      if (updateError.code === "23505") {
        return res.status(400).json({ error: "이미 사용 중인 전화번호입니다." });
      }
      throw updateError;
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[verify-otp] error:", err);
    return res.status(500).json({ error: "인증 처리 실패" });
  }
}
