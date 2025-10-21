// /api/terminate-other-sessions.js
import { createClient } from '@supabase/supabase-js';

// /api/terminate-other-sessions.js
const SUPABASE_URL  = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 배포 직후 로그에서 환경 확인
console.log('[terminate-other-sessions] ENV:',
  { SUPABASE_URL: !!SUPABASE_URL, SERVICE_KEY: !!SERVICE_KEY });

export default async function handler(req, res) {
  if (req.method === 'GET' && (req.query.health || req.query._health)) {
    return res.status(200).json({
      ok: true,
      env: { SUPABASE_URL: !!SUPABASE_URL, SERVICE_KEY: !!SERVICE_KEY },
      ts: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'MISSING_ENV', detail: { SUPABASE_URL: !!SUPABASE_URL, SERVICE_KEY: !!SERVICE_KEY } });
  }

  try {
    // GoTrue Admin API (모든 세션 무효화)
    const endpoint = `${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(user_id)}/logout`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`, // Service Role
        apikey: SERVICE_KEY,
        'Content-Type': 'application/json',
      },
    });

    const text = await resp.text();

    // 응답을 있는 그대로 전달(상태/본문)
    if (!resp.ok) {
      console.error('[terminate-other-sessions] upstream', resp.status, text);
      return res.status(resp.status).send(text || 'failed');
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[terminate-other-sessions] error', e);
    return res.status(500).json({ error: e.message || 'INTERNAL_ERROR' });
  }
}
