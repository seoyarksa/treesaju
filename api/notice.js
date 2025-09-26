import 'dotenv/config';
import express from 'express';
import pool from '../db.js';
import { createClient } from '@supabase/supabase-js';
import serverless from 'serverless-http';

const app = express();
app.use(express.json());

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// ✅ checkAdmin 그대로 유지
async function checkAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('grade')
      .eq('user_id', user.id)
      .single();

    if (pErr) return res.status(500).json({ error: 'Profile lookup failed' });
    if (!profile || String(profile.grade).toLowerCase() !== 'admin') {
      return res.status(403).json({ error: '관리자 권한 필요' });
    }

    req.user = user;
    next();
  } catch (e) {
    res.status(500).json({ error: 'Auth check failed' });
  }
}

// ✅ 라우터 대신 app에 직접 붙이기
app.get('/api/notice', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, created_at, views FROM notice_board ORDER BY created_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notice/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notice_board SET views = views + 1 WHERE id = $1', [id]);
    const result = await pool.query('SELECT * FROM notice_board WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notice', checkAdmin, async (req, res) => {
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

app.put('/api/notice/:id', checkAdmin, async (req, res) => {
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

app.delete('/api/notice/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notice_board WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Vercel serverless function으로 export
export default serverless(app);
