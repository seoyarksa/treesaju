// api/otp.js — 단일 파일 (send / verify / diag)
// 새 카카오 채널/템플릿: senderKey + templateCode + templateParameter 사용
import crypto from "crypto";

// =============== 공통 유틸 ===============
const isProd = process.env.NODE_ENV === "production";
const OTP_TTL_SEC = Number(process.env.OTP_TTL_SEC || 300);
const OTP_DEBUG   = String(process.env.OTP_DEBUG || "").toLowerCase() === "true";

function toE164KR(raw) {
  const digits = String(raw || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("82")) return `+${digits}`;  // 82...
  if (digits.startsWith("0"))  return `+82${digits.slice(1)}`;
  if (digits.startsWith("+"))  return digits;
  return `+${digits}`;
}
// SENS는 보통 수신번호를 "82..." 숫자열로 받음
function toSENS82(phoneE164) {
  return String(phoneE164 || "").replace(/^\+/, ""); // +82... -> 82...
}

function sensSignature(method, path, timestamp, accessKey, secretKey) {
  const toSign = `${method} ${path}\n${timestamp}\n${accessKey}`;
  return crypto.createHmac("sha256", secretKey).update(toSign).digest("base64");
}

// ★ 템플릿 변수 이름이 바뀌면 여기만 수정
function buildTemplateParams({ code, minutes }) {
  return {
    code: String(code),       // 템플릿이 #{otp}면 key를 'otp'로
    minutes: String(minutes), // 템플릿이 #{ttl}면 key를 'ttl'로
  };
}

// =============== SENS 알림톡 전송 ===============
// 기존 ENV(NCP_*)와 새 ENV(KAKAO_*, NCP_SENS_*) 모두 지원
async function sendAlimtalkWithTemplate({ phoneE164, code, validMinutes }) {
  // ENV alias (있는 값 우선)
  const ACCESS_KEY   = process.env.NCP_SENS_ACCESS_KEY   || process.env.NCP_ACCESS_KEY;
  const SECRET_KEY   = process.env.NCP_SENS_SECRET_KEY   || process.env.NCP_SECRET_KEY;
  const SERVICE_ID   = process.env.NCP_SENS_SERVICE_ID; // (필수)
  const SENDER_KEY   = process.env.KAKAO_SENDER_KEY     || ""; // 새 채널이면 사용
  const PLUS_ID      = process.env.NCP_PLUS_FRIEND_ID   || ""; // 구 채널이면 사용
  const TEMPLATE_CODE= process.env.KAKAO_TEMPLATE_CODE_OTP || process.env.NCP_TEMPLATE_CODE;
  const SMS_FALLBACK = process.env.KAKAO_FALLBACK_SENDER || "";

  if (!SERVICE_ID || !ACCESS_KEY || !SECRET_KEY || !TEMPLATE_CODE) {
    throw new Error("Missing SENS/Kakao envs (SERVICE_ID/ACCESS_KEY/SECRET_KEY/TEMPLATE_CODE)");
  }
  if (!SENDER_KEY && !PLUS_ID) {
    throw new Error("Missing sender identifier: set KAKAO_SENDER_KEY (recommended) or NCP_PLUS_FRIEND_ID");
  }

  const host = "https://sens.apigw.ntruss.com";
  const path = `/alimtalk/v2/services/${SERVICE_ID}/messages`;
  const timestamp = String(Date.now());
  const signature = sensSignature("POST", path, timestamp, ACCESS_KEY, SECRET_KEY);

  // 공통 메시지
  const msg = {
    to: toSENS82(phoneE164),
    countryCode: "82",
    templateParameter: buildTemplateParams({ code, minutes: Math.floor(validMinutes) }),
  };

  // payload: senderKey 우선, 없으면 plusFriendId
  const body = {
    templateCode: TEMPLATE_CODE,
    messages: [msg],
    ...(SENDER_KEY ? { senderKey: SENDER_KEY } : {}),
    ...(!SENDER_KEY && PLUS_ID ? { plusFriendId: PLUS_ID } : {}),
  };

  // (선택) SMS 대체발송
  if (SMS_FALLBACK) {
    body.messages[0].useSmsFailover = true;
    body.messages[0].failoverConfig = {
      type: "SMS",
      from: SMS_FALLBACK,
      subject: "[트리사주] 인증번호",
      content: `[트리사주] 인증번호 ${code} (유효 ${Math.floor(validMinutes)}분)`,
    };
  }

  const res = await fetch(`${host}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": ACCESS_KEY,
      "x-ncp-apigw-signature-v2": signature,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!res.ok) {
    const msgErr = json?.error?.message || json?.message || text || `HTTP ${res.status}`;
    throw new Error(msgErr);
  }
  return json;
}

// =============== Supabase (Service role) ===============
async function getSb() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL; // 둘 다 지원
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("ENV missing: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "otp-api/2.0" } }
  });
}

// =============== 본문 파서 ===============
async function parseJSON(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.length) { try { return JSON.parse(req.body); } catch {} }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

// =============== 핸들러 ===============
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if ((req.method || "GET") !== "POST") {
    return res.status(405).end(JSON.stringify({ ok: false, error: "POST only" }));
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const action = (url.searchParams.get("action") || "").toLowerCase();

  // ─ diag: import check
  if (action === "diag-import") {
    try { await import("@supabase/supabase-js"); return res.status(200).end(JSON.stringify({ ok: true, supabaseImport: true })); }
    catch (e) { return res.status(500).end(JSON.stringify({ ok: false, where: "import", details: String(e?.message || e) })); }
  }
  // ─ diag: db check
  if (action === "diag-db") {
    try {
      const s = await getSb();
      const phone = "diag:" + Date.now(), code = "000000";
      const ins = await s.from("otp_codes").insert({ phone, code, created_at: new Date().toISOString() });
      if (ins.error) return res.status(500).end(JSON.stringify({ ok: false, where: "db-insert", details: ins.error.message }));
      const sel = await s.from("otp_codes").select("phone,code,created_at").eq("phone", phone).order("created_at", { ascending: false }).limit(1);
      if (sel.error) return res.status(500).end(JSON.stringify({ ok: false, where: "db-select", details: sel.error.message }));
      return res.status(200).end(JSON.stringify({ ok: true, row: sel.data?.[0] || null }));
    } catch (e) { return res.status(500).end(JSON.stringify({ ok: false, where: "diag-db", details: String(e?.message || e) })); }
  }

  if (!["send", "verify"].includes(action)) {
    return res.status(404).end(JSON.stringify({ ok: false, error: "unknown action" }));
  }

  try {
    const supabase = await getSb();
    const body = await parseJSON(req);

    // ────────── SEND ──────────
    if (action === "send") {
      const rawPhone = String(body?.phone || "").trim();
      if (!rawPhone) return res.status(400).end(JSON.stringify({ ok: false, error: "phone required" }));

      const e164 = toE164KR(rawPhone);
      if (!e164) return res.status(400).end(JSON.stringify({ ok: false, error: "invalid phone" }));

      const code = isProd && !OTP_DEBUG
        ? String(Math.floor(100000 + Math.random() * 900000))
        : "000000";

      // 저장(최근 요청 기준 검증용). 필요하면 user_id도 같이 저장하도록 스키마 확장 가능.
      const { error: insErr } = await supabase
        .from("otp_codes")
        .insert({ phone: e164, code, created_at: new Date().toISOString() });
      if (insErr) {
        return res.status(500).end(JSON.stringify({ ok: false, where: "db-insert", details: insErr.message }));
      }

      // 프로덕션에서만 실제 발송 (개발은 콘솔/응답에 코드 노출)
      if (isProd) {
        try {
          await sendAlimtalkWithTemplate({ phoneE164: e164, code, validMinutes: Math.ceil(OTP_TTL_SEC / 60) });
        } catch (e) {
          // 발송 실패해도 코드 저장은 되어 있으니, 사용자에게는 재시도 안내만
          console.warn("[alimtalk send fail]", e?.message || e);
        }
      }

      return res.status(200).end(JSON.stringify({
        ok: true,
        ...(OTP_DEBUG || !isProd ? { code } : {})
      }));
    }

    // ────────── VERIFY ──────────
    if (action === "verify") {
      const rawPhone = String(body?.phone || "").trim();
      const code     = String(body?.code  || "").trim();
      const userId   = String(body?.user_id || "").trim(); // 프로필 업데이트에 사용

      if (!rawPhone || !code) return res.status(400).end(JSON.stringify({ ok: false, error: "phone and code required" }));
      if (!userId)            return res.status(400).end(JSON.stringify({ ok: false, error: "user_id required for profile update" }));

      const e164 = toE164KR(rawPhone);
      if (!e164) return res.status(400).end(JSON.stringify({ ok: false, error: "invalid phone" }));

      // 1) 최근 OTP 조회
      const { data, error: selErr } = await supabase
        .from("otp_codes")
        .select("*")
        .eq("phone", e164)
        .order("created_at", { ascending: false })
        .limit(1);
      if (selErr) return res.status(500).end(JSON.stringify({ ok: false, error: "DB select failed", details: selErr.message }));

      const row = data?.[0];
      if (!row) return res.status(400).end(JSON.stringify({ ok: false, error: "No code found" }));

      const ageSec = Math.floor((Date.now() - new Date(row.created_at).getTime()) / 1000);
      if (ageSec > OTP_TTL_SEC)              return res.status(400).end(JSON.stringify({ ok: false, error: "Code expired" }));
      if (String(row.code) !== String(code)) return res.status(400).end(JSON.stringify({ ok: false, error: "Invalid code" }));

      // 2) profiles 업데이트 (user_id 기준, 전화 저장 & verified 시각 기록)
      const nowIso = new Date().toISOString();

      const { data: prof, error: pSelErr } = await supabase
        .from("profiles")
        .select("user_id, phone, phone_verified, phone_verified_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (pSelErr) console.warn("[profiles select] err:", pSelErr);

      if (!prof) {
        // 없으면 생성(최초 인증 시)
        const insertRow = {
          user_id: userId,
          phone: e164,
          phone_verified: true,
          phone_verified_at: nowIso,
          created_at: nowIso,
          updated_at: nowIso,
        };
        const { data: insRows, error: pInsErr } = await supabase
          .from("profiles")
          .insert(insertRow)
          .select("user_id, phone, phone_verified, phone_verified_at");
        if (pInsErr) {
          const raw = `${pInsErr?.code||""} ${pInsErr?.message||""} ${pInsErr?.details||""}`.toLowerCase();
          const isUnique = pInsErr?.code === "23505" || /duplicate key|unique constraint|profiles.*phone/.test(raw);
          if (isUnique) return res.status(409).end(JSON.stringify({ ok: false, error: "이미 존재하는 번호입니다.", code: "PHONE_CONFLICT" }));
          return res.status(500).end(JSON.stringify({ ok: false, error: "Profile insert failed", details: pInsErr.message }));
        }
        return res.status(200).end(JSON.stringify({ ok: true, verified: true, via: "auto_insert_profile", profile: insRows?.[0] || null }));
      } else {
        // 있으면 업데이트 (번호가 다르면 교체)
        const patch = {
          phone_verified: true,
          phone_verified_at: nowIso,
          updated_at: nowIso,
        };
        const prev = typeof prof.phone === "string" ? prof.phone.trim() : "";
        if (prev !== e164) patch.phone = e164;

        const { data: updRows, error: pUpdErr } = await supabase
          .from("profiles")
          .update(patch)
          .eq("user_id", userId)
          .select("user_id, phone, phone_verified, phone_verified_at");
        if (pUpdErr) {
          const raw = `${pUpdErr?.code||""} ${pUpdErr?.message||""} ${pUpdErr?.details||""}`.toLowerCase();
          const isUnique = pUpdErr?.code === "23505" || /duplicate key|unique constraint|profiles.*phone/.test(raw);
          if (isUnique) return res.status(409).end(JSON.stringify({ ok: false, error: "이미 사용 중인 전화번호입니다.", code: "PHONE_CONFLICT" }));
          return res.status(500).end(JSON.stringify({ ok: false, error: "Profile update failed", details: pUpdErr.message }));
        }
        return res.status(200).end(JSON.stringify({ ok: true, verified: true, via: "update_profile", profile: updRows?.[0] || null }));
      }
    }

    // 여기에 도달하지 않음
    return res.status(400).end(JSON.stringify({ ok: false, error: "unhandled" }));
  } catch (e) {
    console.error("[/api/otp] error:", e);
    return res.status(500).end(JSON.stringify({ ok: false, error: e?.message || "Internal Server Error" }));
  }
}
