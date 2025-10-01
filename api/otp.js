// api/otp.js — 단일 파일, send / verify / diag (최소 수정 안정판)
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
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

  // ✅ 백틱 복구 (크래시 원인)
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const action = (url.searchParams.get('action') || '').toLowerCase();
  const OTP_TTL_SEC = Number(process.env.OTP_TTL_SEC || 300);
  const OTP_DEBUG = String(process.env.OTP_DEBUG || '').toLowerCase() === 'true';

  // ── 진단 ──
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

    // ── send ──
    if (action === 'send') {
      const phone = (body?.phone || '').trim();
      if (!phone) return json(400, { ok:false, error:'phone required' });

      // 개발 중 프론트가 code를 기대하므로 항상 JSON+code 반환
      const code = String(Math.floor(Math.random()*900000) + 100000);
      const { error } = await supabase.from('otp_codes').insert({ phone, code, created_at:new Date().toISOString() });
      if (error) return json(500, { ok:false, where:'db-insert', details: error.message });
      return json(200, { ok:true, code }); // ← 안정
    }

    // ── verify ── (프로필은 기존 행만 갱신, insert 금지, phone 건드리지 않음)
    if (action === 'verify') {
      const phone  = (body?.phone   || '').trim();
      const code   = (body?.code    || '').trim();
      const userId = (body?.user_id || '').trim();
      if (!phone || !code)  return json(400, { ok:false, error:'phone and code required' });
      if (!userId)          return json(400, { ok:false, error:'user_id required' });

      const { data, error } = await supabase
        .from('otp_codes')
        .select('*').eq('phone', phone)
        .order('created_at', { ascending:false }).limit(1);
      if (error) return json(500, { ok:false, error:'DB select failed', details: error.message });

      const row = data?.[0];
      if (!row) return json(400, { ok:false, error:'No code found' });
      const ageSec = Math.floor((Date.now() - new Date(row.created_at).getTime())/1000);
      if (ageSec > OTP_TTL_SEC)             return json(400, { ok:false, error:'Code expired' });
      if (String(row.code) !== String(code)) return json(400, { ok:false, error:'Invalid code' });

      const patch = { phone_verified: true, updated_at: new Date().toISOString() };

      // 1) user_id로 업데이트
      let upd = await supabase.from('profiles').update(patch).eq('user_id', userId)
        .select('user_id, id, phone, phone_verified');
      if (upd.error) return json(500, { ok:false, error:'Profile update failed', details: upd.error.message, stage:'update_by_user_id' });
      if (Array.isArray(upd.data) && upd.data.length > 0) {
        return json(200, { ok:true, verified:true, via:'update_by_user_id', profile: upd.data[0] });
      }

      // 2) (공식 스키마 호환) id로도 시도
      upd = await supabase.from('profiles').update(patch).eq('id', userId)
        .select('user_id, id, phone, phone_verified');
      if (upd.error) return json(500, { ok:false, error:'Profile update failed', details: upd.error.message, stage:'update_by_id' });
      if (Array.isArray(upd.data) && upd.data.length > 0) {
        return json(200, { ok:true, verified:true, via:'update_by_id', profile: upd.data[0] });
      }

      // 3) 기존 행이 전혀 없으면 만들지 않음(로그인/UI 보존)
      return json(409, { ok:false, error:'Profile not found', hint:'profiles 행을 먼저 생성하세요.' });
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
