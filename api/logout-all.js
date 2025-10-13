import { createClient } from '@supabase/supabase-js';

// ✅ Supabase 관리자(client) 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 반드시 Service Role Key 사용
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }

    // ✅ 모든 세션 강제 종료
    const { error } = await supabase.auth.admin.signOut(user_id);

    if (error) {
      console.error('로그아웃 실패:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`[LOGOUT] All sessions for user ${user_id} terminated.`);
    return res.status(200).json({ message: '모든 세션 종료 완료' });
  } catch (err) {
    console.error('Logout-all API error:', err);
    return res.status(500).json({ error: 'server error' });
  }
}
