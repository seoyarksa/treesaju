// api/otp.js — 단일 파일, ESM, 안전 파싱, 액션 분기( send / verify / diag-import / diag-db )
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // POST만 허용
  if ((req.method || 'GET') !== 'POST') {
    return res.status(405).end(JSON.stringify({ ok:false, error:'POST only' }));
  }

  // 공통 유틸
  const json = (code, obj) => res.status(code).end(JSON.stringify(obj));
  async function getBody(rq) {
    if (rq.body && typeof rq.body === 'object') return rq.body;
    if (typeof rq.body === 'string' && rq.body.length) {
      try { return JSON.parse(rq.body); } catch {}
    }
    const chunks = []; for await (const c of rq) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  }
  const cfg = {
    otpTtlSec: Number(process.env.OTP_TTL_SEC || 300),
    otpDebug: String(process.env.OTP_DEBUG || '').toLowerCase() === 'true',
  };
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const action = (url.searchParams.get('action') || '').toLowerCase();

  // Supabase admin client
  async function getSb() {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error('ENV missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return createClient(supabaseUrl, serviceKey, {
      auth: { persistSession:false },
      global: { headers: { 'X-Client-Info':'otp-api/1.0' } }
    });
  }

  // ---------- 진단용 ----------
  if (action === 'diag-import') {
    try { await import('@supabase/supabase-js'); return json(200, { ok:true, supabaseImport:true }); }
    catch (e) { return json(500, { ok:false, where:'import', details:String(e?.message||e) }); }
  }
  if (action === 'diag-db') {
    try {
      const s = await getSb();
      const phone = 'diag:'+Date.now(), code = '000000';
      const ins = await s.from('otp_codes').insert({ phone, code, created_at: new Date().toISOString() });
      if (ins.error) return json(500, { ok:false, where:'db-insert', details: ins.error.message });
      const sel = await s.from('otp_codes').select('phone,code,created_at').eq('phone', phone).order('created_at',{ascending:false}).limit(1);
      if (sel.error) return json(500, { ok:false, where:'db-select', details: sel.error.message });
      return json(200, { ok:true, row: sel.data?.[0] || null });
    } catch (e) { return json(500, { ok:false, where:'diag-db', details:String(e?.message||e) }); }
  }

  // ---------- 실제 액션 ----------
  if (!['send','verify'].includes(action)) return json(404, { ok:false, error:'unknown action' });

  try {
    const supabase = await getSb();
    const body = await getBody(req);

    if (action === 'send') {
      const phone = (body?.phone || '').trim();
      if (!phone) return json(400, { ok:false, error:'phone required' });
      const code = String(Math.floor(Math.random()*900000) + 100000);
      const { error } = await supabase.from('otp_codes').insert({ phone, code, created_at: new Date().toISOString() });
      if (error)   return json(500, { ok:false, error:'DB insert failed', details: error.message });
      return json(200, { ok:true, ...(cfg.otpDebug ? { code } : {}) });
    }

    if (action === 'verify') {
      const phone = (body?.phone || '').trim();
      const code  = (body?.code  || '').trim();
      if (!phone || !code) return json(400, { ok:false, error:'phone and code required' });

      const sel = await supabase.from('otp_codes').select('*').eq('phone', phone).order('created_at',{ascending:false}).limit(1);
      if (sel.error) return json(500, { ok:false, error:'DB select failed', details: sel.error.message });
      const row = sel.data?.[0];
      if (!row) return json(400, { ok:false, error:'No code found' });

      const ageSec = Math.floor((Date.now() - new Date(row.created_at).getTime())/1000);
      if (ageSec > cfg.otpTtlSec) return json(400, { ok:false, error:'Code expired' });
      if (String(row.code) !== String(code)) return json(400, { ok:false, error:'Invalid code' });

      const upd = await supabase.from('profiles').update({ phone_verified: true }).eq('phone', phone);
      if (upd.error) return json(500, { ok:false, error:'Profile update failed', details: upd.error.message });

      return json(200, { ok:true, verified:true });
    }
  } catch (e) {
    return json(500, { ok:false, error:'Unhandled server error', details:String(e?.message||e) });
  }
}
