import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_id, current_session_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  try {
    // ✅ 1. 해당 유저의 모든 세션 목록 가져오기
    const { data: sessions, error: listError } = await supabase.auth.admin.listUserSessions(user_id);
    if (listError) throw listError;

    // ✅ 2. 현재 세션을 제외하고 모두 종료
    const targets = (sessions ?? []).filter(s => s.id !== current_session_id);

    for (const s of targets) {
      await supabase.auth.admin.signOut(s.user.id);
    }

    console.log(`[LOGOUT] User ${user_id} - ${targets.length} old sessions terminated.`);
    return res.status(200).json({ message: '이전 세션만 종료 완료' });
  } catch (err) {
    console.error('Logout-all error:', err);
    return res.status(500).json({ error: err.message });
  }
}
