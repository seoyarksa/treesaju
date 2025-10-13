import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 서버 전용
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  try {
    const { error } = await supabase.auth.admin.signOut(user_id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('terminate-other-sessions:', e);
    return res.status(500).json({ error: e.message });
  }
}
