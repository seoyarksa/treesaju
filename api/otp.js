// api/otp.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // (선택) CORS/캐시 헤더 – 로컬/프록시 환경 안정성
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get("action"); // send | verify
    const via = url.searchParams.get("via") || "sms"; // otp | sms (라벨만; 실제 동작은 동일)

    if (action === "send") {
      const { phone } = req.body || {};
      if (!phone) return res.status(400).json({ error: "전화번호가 필요합니다." });

      // 6자리 코드 생성
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // DB 저장 (검증 시 5분 제한을 확인)
      const { error: insErr } = await supabase
        .from("otp_codes")
        .insert({ phone, code });
      if (insErr) throw insErr;

      // 실제 SMS/알림톡 연동 전: 서버 로그로 대체
      console.log(`[OTP][${via}] send -> ${phone}, code=${code}`);

      return res.status(200).json({ success: true });
    }

    if (action === "verify") {
      const { phone, token, user_id } = req.body || {};
      if (!phone || !token || !user_id) {
        return res.status(400).json({ error: "전화번호, 코드, 유저 ID가 필요합니다." });
      }

      // 최근 5분 내 코드만 인정
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: otpRow, error: selErr } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("phone", phone)
        .eq("code", token)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (selErr || !otpRow) {
        return res.status(400).json({ error: "인증 코드가 올바르지 않거나 만료되었습니다." });
      }

      // 전화번호/인증 상태 업데이트 (UNIQUE 제약 위반 → 중복 번호)
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ phone, phone_verified: true })
        .eq("user_id", user_id);

      if (updErr) {
        if (updErr.code === "23505") {
          return res.status(400).json({ error: "이미 사용 중인 전화번호입니다." });
        }
        throw updErr;
      }

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("[api/otp] error:", err);
    return res.status(500).json({ error: "server error" });
  }
}
