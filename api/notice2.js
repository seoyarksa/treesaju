// api/notice.js
import 'dotenv/config';
import pool from '../db.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// ✅ 관리자 체크
async function checkAdminFromReq(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return { ok: false, code: 401, error: 'Unauthorized' };

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { ok: false, code: 401, error: 'Invalid token' };

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('grade')
    .eq('user_id', user.id)
    .single();

  if (pErr) return { ok: false, code: 500, error: 'Profile lookup failed' };
  if (!profile || String(profile.grade).toLowerCase() !== 'admin') {
    return { ok: false, code: 403, error: '관리자 권한 필요' };
  }
  return { ok: true };
}

// ✅ id 추출 유틸
function getIdFromReq(req) {
  const qid = req.query?.id;
  if (qid) return qid;
  const parts = (req.url || '').split('?')[0].split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && last !== 'notice') return last;
  return null;
}

// ✅ 메인 핸들러
export default async function handler(req, res) {
  try {
    const { method } = req;

    // 목록 조회
    if (method === 'GET') {
      const id = getIdFromReq(req);
      if (!id) {
        const result = await pool.query(
          'SELECT id, title, created_at, views FROM notice_board ORDER BY created_at DESC LIMIT 20'
        );
        return res.status(200).json(result.rows);
      } else {
        await pool.query('UPDATE notice_board SET views = views + 1 WHERE id = $1', [id]);
        const result = await pool.query('SELECT * FROM notice_board WHERE id = $1', [id]);
        return res.status(200).json(result.rows[0] || null);
      }
    }

    // 작성
    if (method === 'POST') {
      const gate = await checkAdminFromReq(req);
      if (!gate.ok) return res.status(gate.code).json({ error: gate.error });

      const { title, content } = req.body || {};
      const result = await pool.query(
        'INSERT INTO notice_board (title, content) VALUES ($1, $2) RETURNING *',
        [title, content]
      );
      return res.status(201).json(result.rows[0]);
    }

    // 수정
    if (method === 'PUT') {
      const gate = await checkAdminFromReq(req);
      if (!gate.ok) return res.status(gate.code).json({ error: gate.error });

      const id = getIdFromReq(req) || req.body?.id;
      const { title, content } = req.body || {};
      const result = await pool.query(
        'UPDATE notice_board SET title = $1, content = $2 WHERE id = $3 RETURNING *',
        [title, content, id]
      );
      return res.status(200).json(result.rows[0]);
    }

    // 삭제
    if (method === 'DELETE') {
      const gate = await checkAdminFromReq(req);
      if (!gate.ok) return res.status(gate.code).json({ error: gate.error });

      const id = getIdFromReq(req) || req.body?.id;
      await pool.query('DELETE FROM notice_board WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Deleted successfully' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('[NOTICE ERROR]', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
