// /api/terminate-other-sessions.js
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'MISSING_ENV' });
  }

  try {
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
    if (!resp.ok) return res.status(resp.status).send(text || 'failed');
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}
