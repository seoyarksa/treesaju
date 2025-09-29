// api/otp.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "POST") {
    return res.status(405).end(JSON.stringify({ error: "Method not allowed" }));
  }

  const { action } = req.query || {};

  try {
    // 1) 코드 발송 (stub 또는 실제 전송 연결)
    if (action === "send") {
      const { phone } = req.body || {};
      if (!phone) {
        return res.status(400).end(JSON.stringify({ error: "phone required" }));
      }

      const code = (Math.floor(Math.random() * 900000) + 100000).toString();

      // DB 저장 (테스트/실사용 공통)
      const { error: insErr } = await supabase
        .from("otp_codes")
        .insert({ phone, code });
      if (insErr) {
        console.error("[otp] insert error", insErr);
        return res
          .status(500)
          .end(JSON.stringify({ error: "failed to store code" }));
      }

      // TODO: 실제 SMS 전송 연동 지점 (NCP SENS 등)
      // 테스트 중에는 코드 반환(환경변수로 ON/OFF)
      const debug = process.env.OTP_DEBUG === "true" ? { code } : {};
      return res.status(200).end(JSON.stringify({ ok: true, ...debug }));
    }

    // 2) 코드 검증 + 프로필 업데이트
    if (action === "verify") {
      const { phone, token, user_id } = req.body || {};
      if (!phone || !token || !user_id) {
        return res
          .status(400)
          .end(JSON.stringify({ error: "missing fields" }));
      }

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
        return res
          .status(400)
          .end(JSON.stringify({ error: "invalid or expired code" }));
      }

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ phone, phone_verified: true })
        .eq("user_id", user_id);

      if (updErr) {
        if (updErr.code === "23505") {
          // unique(phone) 충돌
          return res
            .status(400)
            .end(JSON.stringify({ error: "이미 사용 중인 전화번호입니다." }));
        }
        console.error("[otp] update error", updErr);
        return res.status(500).end(JSON.stringify({ error: "update failed" }));
      }

      return res.status(200).end(JSON.stringify({ ok: true }));
    }

    // 알 수 없는 action
    return res.status(404).end(JSON.stringify({ error: "unknown action" }));
  } catch (e) {
    console.error("[otp] server error", e);
    return res.status(500).end(JSON.stringify({ error: "server error" }));
  }
};
