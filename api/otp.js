// api/otp.js — 단일 파일, send / verify / diag
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

  // 진단
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
      const sel = await s.from('otp_codes').select('phone,code,created_at').eq('phone', phone).order('created_at',{ascending:false}).limit(1);
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
          hint: 'Vercel > Project > Settings > Environment Variables 에서 PRODUCTION에 설정 필요'
        });
      }

      try {
        const supabase = await getSb();

        // 개발 편의: 응답에 code 포함
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

        return json(200, { ok:true, code: OTP_DEBUG ? code : code }); // 필요시 OTP_DEBUG에 따라 노출 제어
      } catch (e) {
        return json(500, {
          ok: false,
          where: 'send-try',
          details: String(e?.message || e),
          hint: 'supabase-js import/런타임/바디파싱 확인'
        });
      }
    }

    // ── verify (수정된 핵심) ─────────────────────────────────────────────
    if (action === 'verify') {
      const phone  = (body?.phone   || '').trim();
      const code   = (body?.code    || '').trim();
      const userId = (body?.user_id || '').trim(); // 로그인 유저 id (profiles.user_id uuid 기준)
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
      if (ageSec > OTP_TTL_SEC)            return json(400, { ok:false, error:'Code expired' });
      if (String(row.code) !== String(code))return json(400, { ok:false, error:'Invalid code' });

      // 2) profiles 반영 — 스키마 변경 없이: user_id 기준 update → 없으면 insert
      const nowIso = new Date().toISOString();
      const patch  = { phone, phone_verified: true, updated_at: nowIso };

      // 2-1) user_id 기준 업데이트
      const { data: updRows, error: updErr } = await supabase
        .from('profiles')
        .update(patch)
        .eq('user_id', userId)
        .select('user_id');

      if (updErr) {
        return json(500, { ok:false, error:'Profile update failed', details: updErr.message, stage:'update_by_user_id' });
      }
      if (updRows && updRows.length > 0) {
        return json(200, { ok:true, verified:true, via:'update_by_user_id' });
      }

      // 2-2) 행이 없으면 insert (user_id 포함)
      const { error: insErr } = await supabase
        .from('profiles')
        .insert({ user_id: userId, phone, phone_verified: true, updated_at: nowIso });

      if (insErr) {
        return json(500, { ok:false, error:'Profile insert failed', details: insErr.message, stage:'insert_with_user_id' });
      }

      return json(200, { ok:true, verified:true, via:'insert_with_user_id' });
    }


    // ✅ 코드/만료/불일치 검증을 모두 통과한 직후에 배치
const userId = (body?.user_id || '').trim();
if (!userId) {
  return json(400, { ok:false, error:'user_id required for profile update' });
}

const nowIso = new Date().toISOString();
// 👉 인증 완료시 phone 저장 + phone_verified true로 세팅
const patch = { phone, phone_verified: true, updated_at: nowIso };

/** 1) user_id 기준 업데이트 */
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

/** 2) 행이 없으면 새로 생성 */
const { data: insRows, error: insErr } = await supabase
  .from('profiles')
  .insert({ user_id: userId, ...patch })
  .select('user_id, phone, phone_verified');

if (insErr) {
  return json(500, { ok:false, error:'Profile insert failed', details: insErr.message, stage:'insert_with_user_id' });
}

return json(200, { ok:true, verified:true, via:'insert_with_user_id', profile: insRows?.[0] || null });


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
