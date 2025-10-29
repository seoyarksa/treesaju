// api/otp.js — 단일 파일, send / verify / diag (안전판: update-only)
import crypto from 'crypto';

// --- Kakao 알림톡 전송(네이버 클라우드 SENS) ---
async function sendAlimtalk(rawPhone, code) {
  // 1) NCP는 숫자만 허용 (하이픈/문자 제거)
  const to = String(rawPhone || '').replace(/\D/g, '');
  if (!to) throw new Error('invalid phone');

  // 2) 환경변수 필수
  const serviceId    = process.env.NCP_SENS_SERVICE_ID; // 예: ncp:kkobizmsg:kr:123456789012:myservice
  const accessKey    = process.env.NCP_ACCESS_KEY;
  const secretKey    = process.env.NCP_SECRET_KEY;
  const plusFriendId = process.env.NCP_PLUS_FRIEND_ID;  // 예: @트리만세력  (활성 상태)
  const templateCode = process.env.NCP_TEMPLATE_CODE;   // 예: VERIFYCODE  (승인된 템플릿)

  if (!serviceId || !accessKey || !secretKey || !plusFriendId || !templateCode) {
    throw new Error('Missing NCP envs');
  }

  // 3) 서명 준비
  const { createHmac } = await import('node:crypto');
  const host = 'https://sens.apigw.ntruss.com';
  const path = `/alimtalk/v2/services/${serviceId}/messages`;
  const ts   = Date.now().toString();

  const sigMsg = `POST ${path}\n${ts}\n${accessKey}`;
  const sig    = createHmac('sha256', secretKey).update(sigMsg).digest('base64');

// ✓ 템플릿 치환 방식만 사용 (content 제거)
// - 템플릿 변수: #{code}, #{minutes} 기준
// - senderKey가 있으면 senderKey 사용, 없으면 plusFriendId 사용
// - SMS 대체발송을 쓰려면 KAKAO_FALLBACK_SENDER 환경변수(승인된 발신번호) 설정
const body = {
  templateCode,
  messages: [{
    to,                  // "82..." 숫자 형태 권장 (예: +8210 → 8210)
    countryCode: "82",
    templateParameter: {
      code: String(code),
      minutes: String(Math.ceil(OTP_TTL_SEC / 60)),
    },
    // (옵션) SMS 대체발송
    ...(process.env.KAKAO_FALLBACK_SENDER ? {
      useSmsFailover: true,
      failoverConfig: {
        type: "SMS",
        from: process.env.KAKAO_FALLBACK_SENDER, // 예: 01047492139
        subject: "[트리사주] 인증번호",
        content: `[트리사주] 인증번호 ${code} (유효 ${Math.ceil(OTP_TTL_SEC/60)}분)`,
      }
    } : {})
  }],
  ...(senderKey ? { senderKey } : { plusFriendId }),
};


  // 5) 호출
  const res  = await fetch(`${host}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-apigw-timestamp': ts,
      'x-ncp-iam-access-key': accessKey,
      'x-ncp-apigw-signature-v2': sig,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return true;
}






export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // POST만 허용
  if ((req.method || 'GET') !== 'POST') {
    return res.status(405).end(JSON.stringify({ ok:false, error:'POST only' }));
  }

  const json = (code, obj) => res.status(code).end(JSON.stringify(obj));

  async function getBody(rq) {
    if (rq.body && typeof rq.body === 'object') return rq.body;
    if (typeof rq.body === 'string' && rq.body.length) { try { return JSON.parse(rq.body); } catch {} }
    const chunks=[]; for await (const c of rq) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const action = (url.searchParams.get('action') || '').toLowerCase();
  const OTP_TTL_SEC = Number(process.env.OTP_TTL_SEC || 300);
  const OTP_DEBUG = String(process.env.OTP_DEBUG || '').toLowerCase() === 'true';

  // ── 진단 ──────────────────────────────────────────────────────────────
  if (action === 'diag-import') {
    try { await import('@supabase/supabase-js'); return json(200, { ok:true, supabaseImport:true }); }
    catch (e) { return json(500, { ok:false, where:'import', details:String(e?.message||e) }); }
  }
  if (action === 'diag-db') {
    try {
      const s = await getSb();
      const phone = 'diag:'+Date.now(), code='000000';
      const ins = await s.from('otp_codes').insert({ phone, code, created_at:new Date().toISOString() });
      if (ins.error) return json(500, { ok:false, where:'db-insert', details: ins.error.message });
      const sel = await s.from('otp_codes')
        .select('phone,code,created_at').eq('phone', phone).order('created_at',{ascending:false}).limit(1);
      if (sel.error) return json(500, { ok:false, where:'db-select', details: sel.error.message });
      return json(200, { ok:true, row: sel.data?.[0] || null });
    } catch (e) { return json(500, { ok:false, where:'diag-db', details:String(e?.message||e) }); }
  }

  if (!['send','verify'].includes(action)) return json(404, { ok:false, error:'unknown action' });

  try {
    const supabase = await getSb();
    const body = await getBody(req);

    // ── send ─────────────────────────────────────────────────────────────
if (action === 'send') {
  const phone = (body?.phone || '').trim();
  if (!phone) return json(400, { ok:false, error:'phone required' });

  // ENV 사전 점검
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !serviceKey) {
    return json(500, {
      ok: false,
      where: 'env',
      hasUrl: !!sbUrl,
      hasKey: !!serviceKey,
      hint: 'Vercel > Project > Settings > Environment Variables (Production) 확인'
    });
  }

  try {
    const supabase = await getSb();
    const code = String(Math.floor(Math.random()*900000) + 100000);

    const { error } = await supabase
      .from('otp_codes')
      .insert({ phone, code, created_at: new Date().toISOString() });

    if (error) {
      return json(500, {
        ok: false,
        where: 'db-insert',
        details: error.message,
        hint: '테이블/권한/컬럼타입 확인'
      });
    }

    // 🔔 운영에서만 알림톡 발송(실패해도 흐름은 계속)
    try {
      if (process.env.NODE_ENV === 'production') {
        await sendAlimtalk(phone, code);
      }
    } catch (e) {
      console.warn('[alimtalk] send fail:', e?.message || e);
    }

    // 개발 중에만 code 노출 → 지금은 임시로 항상 반환
    return json(200, { ok:true, code });

  } catch (e) {
    return json(500, {
      ok: false,
      where: 'send-try',
      details: String(e?.message || e),
      hint: 'supabase-js import/런타임/바디파싱 확인'
    });
  }
}


    // ── verify (update-only 안정판) ──────────────────────────────────────
 // ── verify (update-only 안정판) ──────────────────────────────────────
// ── verify (update-or-insert, user_id 전용) ──────────────────────────
if (action === 'verify') {
  const phone  = (body?.phone   || '').trim();
  const code   = (body?.code    || '').trim();
  const userId = (body?.user_id || '').trim(); // auth.users.id
  if (!phone || !code)  return json(400, { ok:false, error:'phone and code required' });
  if (!userId)          return json(400, { ok:false, error:'user_id required for profile update' });

  // 1) 최근 OTP 조회
  const { data, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('phone', phone)
    .order('created_at', { ascending:false })
    .limit(1);
  if (error) return json(500, { ok:false, error:'DB select failed', details: error.message });

  const row = data?.[0];
  if (!row) return json(400, { ok:false, error:'No code found' });

  const ageSec = Math.floor((Date.now() - new Date(row.created_at).getTime())/1000);
  if (ageSec > OTP_TTL_SEC)             return json(400, { ok:false, error:'Code expired' });
  if (String(row.code) !== String(code)) return json(400, { ok:false, error:'Invalid code' });

// 2) profiles — user_id 전용
const nowIso = new Date().toISOString();

// 2-0) 현행 프로필 조회 (user_id만 사용)
const { data: prof, error: selErr } = await supabase
  .from('profiles')
  .select('user_id, phone, phone_verified, phone_verified_at')
  .eq('user_id', userId)
  .maybeSingle();

if (selErr) {
  // 조회 에러는 치명적이진 않지만 로그 정도는 추천
  console.warn('[profiles select] err:', selErr);
}

// 2-1) 없으면 생성 (핫픽스: 최초 인증 시 자동 생성)
if (!prof) {
  const row = {
    user_id: userId,
    phone,                      // 국제 포맷 +82
    phone_verified: true,
    phone_verified_at: nowIso,  // ★ 인증시각 저장
    created_at: nowIso,
    updated_at: nowIso,
  };

  const { data: insRows, error: insErr } = await supabase
    .from('profiles')
    .insert(row)
    .select('user_id, phone, phone_verified, phone_verified_at');

  if (insErr) {
    // ★ 유니크 충돌(이미 다른 계정이 같은 번호 사용)
    const raw = `${insErr?.code||''} ${insErr?.message||''} ${insErr?.details||''} ${insErr?.hint||''}`.toLowerCase();
    const isUnique = insErr?.code === '23505'
      || /duplicate key|unique constraint|profiles.*phone/i.test(raw);
    if (isUnique) {
      return json(409, { ok:false, error:'이미 존재하는 번호입니다.', code:'PHONE_CONFLICT' });
    }
    return json(500, { ok:false, error:'Profile insert failed', details: insErr.message, stage:'auto_insert_profile' });
  }

  return json(200, { ok:true, verified:true, via:'auto_insert_profile', profile: insRows?.[0] || null });
}

// 2-2) 있으면 업데이트 (전화번호 비면 채움)
const patch = {
  phone_verified: true,
  phone_verified_at: nowIso,  // ★ 인증시각 저장
  updated_at: nowIso,
};
// 기존 번호가 비어있거나, 값이 다르면 새 번호로 교체
const normalize = (v) => (typeof v === 'string' ? v.trim() : '');
const currentPhone = normalize(prof?.phone);
if (currentPhone !== phone) {
  patch.phone = phone; // ★ 덮어쓰기
}

const { data: updRows, error: updErr } = await supabase
  .from('profiles')
  .update(patch)
  .eq('user_id', userId)
  .select('user_id, phone, phone_verified, phone_verified_at');

if (updErr) {
  const raw = `${updErr?.code||''} ${updErr?.message||''} ${updErr?.details||''} ${updErr?.hint||''}`.toLowerCase();
  const isUnique = updErr?.code === '23505' || /duplicate key|unique constraint|profiles.*phone/.test(raw);
  if (isUnique) {
    return json(409, { ok:false, error:'이미 사용 중인 전화번호입니다.', code:'PHONE_CONFLICT' });
  }
  return json(500, { ok:false, error:'Profile update failed', details: updErr.message, stage:'update_profile' });
}

return json(200, { ok:true, verified:true, via:'update_profile', profile: updRows?.[0] || null });


  // 그 외 일반 오류는 400으로
  return json(400, {
    ok:false,
    error: updErr?.message || '요청 처리 실패',
    code: updErr?.code || 'UPDATE_FAILED',
    details: updErr?.details,
    stage:'update_by_user_id'
  });
}

  if (Array.isArray(updRows) && updRows.length > 0) {
 return json(200, { ok:true, verified:true, via:'update_profile', profile: updRows?.[0] || null });
} // ← end of if (action === 'verify')
} catch (e) {
  return json(500, { ok:false, error:'Unhandled server error', details:String(e?.message||e) });
}

  async function getSb() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error('ENV missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return createClient(supabaseUrl, serviceKey, {
      auth: { persistSession:false },
      global: { headers: { 'X-Client-Info': 'otp-api/1.0' } }
    });
  }
}
