// api/otp.js — ESM + 안전 파싱 + 액션 분기 + 진단(diag-import/diag-db)
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // 항상 POST만 받기
  if ((req.method || 'GET') !== 'POST') {
    return res.status(400).end(JSON.stringify({ ok:false, error:'POST only' }));
  }

  // 일관된 JSON 응답 헬퍼
  const json = (code, obj) => res.status(code).end(JSON.stringify(obj));

  // 안전한 body 파싱 (req.body object/string/stream 모두 케어)
  async function getBody(rq) {
    if (rq.body && typeof rq.body === 'object') return rq.body;
    if (typeof rq.body === 'string' && rq.body.length) {
      try { return JSON.parse(rq.body); } catch {}
    }
    const chunks = [];
    for await (const c of rq) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  }

  // 액션 안전 파싱 (Vercel/Node 환경 모두 대응)
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const action = (reqUrl.searchParams.get('action') || req.query?.action || '').toLowerCase();

  // ---------- 진단: supabase import 확인 ----------
  if (action === 'diag-import') {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      return json(200, { ok:true, supabaseImport:true, node: process.version });
    } catch (e) {
      return json(500, { ok:false, where:'import', details:String(e?.message||e) });
    }
  }

  // ---------- 진단: DB 연결/권한 확인 ----------
  if (action === 'diag-db') {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!sbUrl || !serviceKey) {
        return json(500, { ok:false, where:'env', hasUrl:!!sbUrl, hasKey:!!serviceKey });
      }
      const s = createClient(sbUrl, serviceKey, { auth:{ persistSession:false } });
      const testPhone = 'diag:' + Date.now();
      const code = '000000';

      const { error: insErr } = await s.from('otp_codes')
        .insert({ phone:testPhone, code, created_at:new Date().toISOString() });
      if (insErr) return json(500, { ok:false, where:'db-insert', details: insErr.message });

      const { data, error: selErr } = await s.from('otp_codes')
        .select('phone, code, created_at')
        .eq('phone', testPhone)
        .order('created_at', { ascending:false })
        .limit(1);
      if (selErr) return json(500, { ok:false, where:'db-select', details: selErr.message });

      return json(200, { ok:true, diag:'db', row: data?.[0] || null });
    } catch (e) {
      return json(500, { ok:false, where:'diag-db', details:String(e?.message||e) });
    }
  }

  // ---------- 실제 send / verify ----------
  if (!['send', 'verify'].includes(action)) {
    return json(404, { error:'unknown action' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return json(500, { ok:false, error:'ENV missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
    }
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession:false },
      global: { headers: { 'X-Client-Info':'otp-api/1.0' } }
    });

    const body = await getBody(req);
    const OTP_TTL_SEC = Number(process.env.OTP_TTL_SEC || 300);
    const OTP_DEBUG = String(process.env.OTP_DEBUG || '').toLowerCase() === 'true';

    if (action === 'send') {
      const phone = (body?.phone || '').trim();
      if (!phone) return json(400, { ok:false, error:'phone required' });

      const code = String(Math.floor(Math.random()*900000) + 100000);
      const { error: insErr } = await supabase
        .from('otp_codes')
        .insert({ phone, code, created_at: new Date().toISOString() });
      if (insErr) return json(500, { ok:false, error:'DB insert failed', details: insErr.message });

      return json(200, { ok:true, ...(OTP_DEBUG ? { code } : {}) });
    }

    if (action === 'verify') {
      const phone = (body?.phone || '').trim();
      const code  = (body?.code  || '').trim();
      if (!phone || !code) return json(400, { ok:false, error:'phone and code required' });

      const { data, error: selErr } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('phone', phone)
        .order('created_at', { ascending:false })
        .limit(1);
      if (selErr) return json(500, { ok:false, error:'DB select failed', details: selErr.message });

      const row = data?.[0];
      if (!row) return json(400, { ok:false, error:'No code found' });

      const ageSec = Math.floor((Date.now() - new Date(row.created_at).getTime()) / 1000);
      if (ageSec > OTP_TTL_SEC) return json(400, { ok:false, error:'Code expired' });

      if (String(row.code) !== String(code)) return json(400, { ok:false, error:'Invalid code' });

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ phone_verified: true })
        .eq('phone', phone);
      if (updErr) return json(500, { ok:false, error:'Profile update failed', details: updErr.message });

      return json(200, { ok:true, verified:true });
    }

    return json(400, { ok:false, error:'Unhandled action' });
  } catch (e) {
    return json(500, { ok:false, error:'Unhandled server error', details:String(e?.message||e) });
  }
}
