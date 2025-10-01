// api/otp.js — 단일 파일, send / verify / diag (안전판: update-only)
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

        // 개발 중에만 code 노출
        return json(200, { ok:true, ...(OTP_DEBUG ? { code } : {}) });
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
if (action === 'verify') {
  const phone  = (body?.phone   || '').trim();
  const code   = (body?.code    || '').trim();
  const userId = (body?.user_id || '').trim(); // 로그인 유저 id
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

  // 2) profiles — 기존 행만 갱신 (없으면 409), phone은 비어 있을 때만 채움
  const nowIso = new Date().toISOString();

  // 2-0) 우선 user_id로 조회
  let profSel = await supabase
    .from('profiles')
    .select('user_id, id, phone, phone_verified')
    .eq('user_id', userId)
    .limit(1);

  let prof = profSel.error ? null : (profSel.data?.[0] || null);

  // user_id가 없으면 id로도 시도(공식 템플릿 대비)
  if (!prof) {
    profSel = await supabase
      .from('profiles')
      .select('user_id, id, phone, phone_verified')
      .eq('id', userId)
      .limit(1);
    prof = profSel.error ? null : (profSel.data?.[0] || null);
  }

  if (!prof) {
    // 절대 새로 만들지 않음: 운영 안전
    return json(409, {
      ok:false,
      error:'Profile not found',
      hint:'회원가입/온보딩에서 profiles 행을 먼저 생성하세요 (user_id 또는 id = auth.users.id).'
    });
  }

  // 업데이트 페이로드: phone은 비어 있을 때만 채움
  const patch = { phone_verified: true, updated_at: nowIso };
  const hasPhone = typeof prof.phone === 'string' && prof.phone.trim() !== '';
  if (!hasPhone) patch.phone = phone;

  // 어떤 키로 매칭되었는지에 따라 업데이트
  const keyCol = prof.user_id ? 'user_id' : 'id';
  const { data: updRows, error: updErr } = await supabase
    .from('profiles')
    .update(patch)
    .eq(keyCol, userId)
    .select('user_id, id, phone, phone_verified');

  if (updErr) {
    return json(500, { ok:false, error:'Profile update failed', details: updErr.message, stage:`update_by_${keyCol}` });
  }
  if (Array.isArray(updRows) && updRows.length > 0) {
    return json(200, { ok:true, verified:true, via:`update_by_${keyCol}`, profile: updRows[0] });
  }

  // 이 경우는 거의 없음(0건 업데이트) — 명확히 안내
  return json(409, { ok:false, error:'Profile exists but not updated', stage:`update_by_${keyCol}` });
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
