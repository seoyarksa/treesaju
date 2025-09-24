import 'dotenv/config';
import express from 'express';
import pool from '../db.js';
import { createClient } from '@supabase/supabase-js';




const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('[ENV] SUPABASE_URL or SUPABASE_SERVICE_ROLE missing');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE); 
// .env에 SUPABASE_URL, SUPABASE_SERVICE_ROLE 넣어두세요 (service role key는 서버에서만 사용)

const router = express.Router();



async function checkAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // 토큰으로 사용자 얻기
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    // profiles 테이블에서 role 확인
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (pErr) return res.status(500).json({ error: 'Profile lookup failed' });
    if (!profile || String(profile.role).toLowerCase() !== 'admin') {
      return res.status(403).json({ error: '관리자 권한 필요' });
    }

    req.user = user;
    next();
  } catch (e) {
    res.status(500).json({ error: 'Auth check failed' });
  }
}

// 1. 공지 목록 조회
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, created_at, views FROM notice_board ORDER BY created_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. 공지 상세 조회
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 조회수 증가
    await pool.query('UPDATE notice_board SET views = views + 1 WHERE id = $1', [id]);

    // 상세 데이터 가져오기
    const result = await pool.query('SELECT * FROM notice_board WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. 공지 작성 (관리자만)
router.post('/', checkAdmin, async (req, res) => {
  const { title, content } = req.body;
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

// 4. 공지 수정 (관리자만)
router.put('/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
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

// 5. 공지 삭제 (관리자만)
router.delete('/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notice_board WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
