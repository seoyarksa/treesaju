// routes/notice.js  (Express Router)
import 'dotenv/config';
import express from 'express';
import pool from '../db.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// ✅ 관리자 미들웨어 (이름: checkAdmin)
async function checkAdmin(req) {
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

function getIdFromReq(req) {
  // /api/notice?id=123 or /api/notice/123 둘 다 지원
  const qid = req.query?.id;
  if (qid) return qid;
  const parts = (req.url || '').split('?')[0].split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && last !== 'notice') return last;
  return null;
}

export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method === 'GET') {
      const id = getIdFromReq(req);
      if (!id) {
        // 목록
        const result = await pool.query(
          'SELECT id, title, created_at, views FROM notice_board ORDER BY created_at DESC LIMIT 20'
        );
        return res.status(200).json(result.rows);
      } else {
        // 상세
        await pool.query('UPDATE notice_board SET views = views + 1 WHERE id = $1', [id]);
        const result = await pool.query('SELECT * FROM notice_board WHERE id = $1', [id]);
        return res.status(200).json(result.rows[0] || null);
      }
    }

    if (method === 'POST') {
      const gate = await checkAdmin(req);
      if (!gate.ok) return res.status(gate.code).json({ error: gate.error });
      const { title, content } = req.body || {};
      const result = await pool.query(
        'INSERT INTO notice_board (title, content) VALUES ($1, $2) RETURNING *',
        [title, content]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (method === 'PUT') {
      const gate = await checkAdmin(req);
      if (!gate.ok) return res.status(gate.code).json({ error: gate.error });
      const id = getIdFromReq(req) || req.body?.id;
      const { title, content } = req.body || {};
      const result = await pool.query(
        'UPDATE notice_board SET title = $1, content = $2 WHERE id = $3 RETURNING *',
        [title, content, id]
      );
      return res.status(200).json(result.rows[0]);
    }

    if (method === 'DELETE') {
      const gate = await checkAdmin(req);
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



// ✅ 공지 목록
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, created_at, views FROM notice_board ORDER BY created_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 공지 상세 (SELECT 먼저, views UPDATE는 실패해도 무시)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM notice_board WHERE id = $1', [id]);
    const row = result.rows[0] || null;

    try {
      await pool.query('UPDATE notice_board SET views = views + 1 WHERE id = $1', [id]);
    } catch (_) {} // RLS로 막혀도 상세는 보여줘야 하므로 무시

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 공지 작성 (관리자)
router.post('/', checkAdmin, async (req, res) => {
  const { title, content } = req.body || {};
  try {
    const result = await pool.query(
      'INSERT INTO notice_board (title, content) VALUES ($1, $2) RETURNING *',
      [title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 공지 수정 (관리자)
router.put('/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body || {};
  try {
    const result = await pool.query(
      'UPDATE notice_board SET title = $1, content = $2 WHERE id = $3 RETURNING *',
      [title, content, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 공지 삭제 (관리자)
router.delete('/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notice_board WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

