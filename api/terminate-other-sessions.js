const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY_RAW = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isLikelyJwt(s) {
  return typeof s === 'string' && s.split('.').length === 3 && s.length > 50;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, diag } = req.body || {};
  if (diag) {
    // 🔎 진단 모드: 키를 노출하진 않지만 "형태"는 보여줌
    return res.status(200).json({
      ok: true,
      SUPABASE_URL_present: !!SUPABASE_URL,
      SERVICE_KEY_present: !!SERVICE_KEY_RAW,
      SERVICE_KEY_isLikelyJwt: isLikelyJwt(SERVICE_KEY_RAW),
      SERVICE_KEY_preview: SERVICE_KEY_RAW
        ? `${String(SERVICE_KEY_RAW).slice(0, 8)}...len=${String(SERVICE_KEY_RAW).length}`
        : null,
    });
  }

  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  if (!SUPABASE_URL) return res.status(500).json({ error: 'MISSING_SUPABASE_URL' });

  const SERVICE_KEY = (SERVICE_KEY_RAW || '').trim();
  if (!isLikelyJwt(SERVICE_KEY)) {
    return res.status(500).json({
      error: 'BAD_SERVICE_ROLE_KEY',
      hint: '환경변수 SUPABASE_SERVICE_ROLE_KEY가 Service Role JWT인지 확인하세요 (따옴표/개행 제거).',
      present: !!SERVICE_KEY_RAW,
      length: SERVICE_KEY ? SERVICE_KEY.length : 0,
      preview: SERVICE_KEY ? `${SERVICE_KEY.slice(0,8)}...` : null
    });
  }

  try {
    const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/admin/users/${encodeURIComponent(user_id)}/logout`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`, // ✅ 반드시 Service Role JWT
        apikey: SERVICE_KEY,                    // ✅ 같이 넣어줌
        'Content-Type': 'application/json',
      },
    });

    const text = await resp.text();
    if (!resp.ok) return res.status(resp.status).send(text || 'failed');
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'INTERNAL_ERROR' });
  }
}
