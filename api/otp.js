// api/otp.js — 단일 파일, send / verify / diag (안전판: update-only)
import crypto from 'crypto';

async function sendAlimtalk(rawPhone, code) {
  // NCP는 숫자만 받음 (+82/- 제거)
  const to = String(rawPhone).replace(/\D/g, '');

  const serviceId    = process.env.NCP_SENS_SERVICE_ID;
  const accessKey    = process.env.NCP_ACCESS_KEY;
  const secretKey    = process.env.NCP_SECRET_KEY;
  const plusFriendId = process.env.NCP_PLUS_FRIEND_ID;   // 예: @트리만세력
  const templateCode = process.env.NCP_TEMPLATE_CODE;    // 예: VERIFYCODE

  if (!serviceId || !accessKey || !secretKey || !plusFriendId || !templateCode) {
    throw new Error('Missing NCP envs');
  }

  const host = 'https://sens.apigw.ntruss.com';
  const path = `/alimtalk/v2/services/${serviceId}/messages`;
  const ts = Date.now().toString();

  const sigMsg = `POST ${path}\n${ts}\n${accessKey}`;
  const sig = crypto.createHmac('sha256', secretKey).update(sigMsg).digest('base64');

  const body = {
    plusFriendId,
    templateCode,
    messages: [
      {
        to,
        variables: { code },   // 템플릿에 #{code} (또는 {{code}})가 있어야 함
        // content: '템플릿이 자유문구면 여기에 내용',
      },
    ],
  };

  const res = await fetch(`${host}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-apigw-timestamp': ts,
      'x-ncp-iam-access-key': accessKey,
      'x-ncp-apigw-signature-v2': sig,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
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
  const profSel = await supabase
    .from('profiles')
    .select('user_id, phone, phone_verified')
    .eq('user_id', userId)
    .limit(1);

  const prof = profSel.error ? null : (profSel.data?.[0] || null);

  // 2-1) 없으면 생성 (핫픽스: 최초 인증 시 자동 생성)
  if (!prof) {
    const { data: insRows, error: insErr } = await supabase
      .from('profiles')
      .insert({ user_id: userId, phone, phone_verified: true, created_at: nowIso, updated_at: nowIso })
      .select('user_id, phone, phone_verified');

    if (insErr) {
      return json(500, { ok:false, error:'Profile insert failed', details: insErr.message, stage:'auto_insert_profile' });
    }
    return json(200, { ok:true, verified:true, via:'auto_insert_profile', profile: insRows?.[0] || null });
  }

  // 2-2) 있으면 업데이트 (전화번호 비면 채움)
  const patch = { phone_verified: true, updated_at: nowIso };
  const hasPhone = typeof prof.phone === 'string' && prof.phone.trim() !== '';
  if (!hasPhone) patch.phone = phone;

  const { data: updRows, error: updErr } = await supabase
    .from('profiles')
    .update(patch)
    .eq('user_id', userId)
    .select('user_id, phone, phone_verified');

  if (updErr) {
    return json(500, { ok:false, error:'Profile update failed', details: updErr.message, stage:'update_by_user_id' });
  }
  if (Array.isArray(updRows) && updRows.length > 0) {
    return json(200, { ok:true, verified:true, via:'update_by_user_id', profile: updRows[0] });
  }

  return json(409, { ok:false, error:'Profile exists but not updated', stage:'update_by_user_id' });
}


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
