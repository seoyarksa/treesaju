// api/otp.js
export default async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // action은 req.query가 있으면 우선 사용, 없으면 URL에서 추출
    const action =
      (req.query && req.query.action) ||
      new URL(req.url, `http://${req.headers.host}`).searchParams.get("action");

    // --- 안전한 body 파싱 (런타임에 따라 req.body가 없을 수도 있어서) ---
    const body = await ensureJsonBody(req);

    if (action === "send") {
      const { phone } = body || {};
      if (!phone) return res.status(400).json({ error: "phone required" });

      // 6자리 코드
      const code = String(Math.floor(100000 + Math.random() * 900000));

      // supabase-js(v2)는 ESM 전용 → 동적 import + 핸들러 내부에서 지연 초기화
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { error: insErr } = await supabase
        .from("otp_codes")
        .insert({ phone, code });
      if (insErr) {
        console.error("[otp] insert error", insErr);
        return res.status(500).json({ error: "failed to store code" });
      }

      // TODO: 여기서 NCP SENS/Kakao Biz 메시지 연동
      const debug = process.env.OTP_DEBUG === "true" ? { code } : {};
      return res.status(200).json({ ok: true, ...debug });
    }

    if (action === "verify") {
      const { phone, token, user_id } = body || {};
      if (!phone || !token || !user_id) {
        return res.status(400).json({ error: "missing fields" });
      }

      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

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
        return res.status(400).json({ error: "invalid or expired code" });
      }

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ phone, phone_verified: true })
        .eq("user_id", user_id);

      if (updErr) {
        if (updErr.code === "23505") {
          return res
            .status(400)
            .json({ error: "이미 사용 중인 전화번호입니다." });
        }
        console.error("[otp] update error", updErr);
        return res.status(500).json({ error: "update failed" });
      }

      // (선택) 한번 사용한 OTP 제거
      try {
        await supabase.from("otp_codes").delete().eq("id", otpRow.id);
      } catch (_) {}

      return res.status(200).json({ ok: true });
    }

    return res.status(404).json({ error: "unknown action" });
  } catch (e) {
    console.error("[otp] server error", e);
    return res.status(500).json({ error: "server error" });
  }
}

/** 런타임별로 req.body가 비어있을 수 있어 안전 파서 */
async function ensureJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) {
    try { return JSON.parse(req.body); } catch { /* fallthrough */ }
  }
  // 직접 읽기 (이미 소비된 경우는 빈 객체 반환)
  const raw = await new Promise((resolve) => {
    try {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => resolve(data));
      req.on("error", () => resolve(""));
    } catch {
      resolve("");
    }
  });
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
