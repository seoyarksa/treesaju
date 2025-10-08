import pool from '../../db.js';

export const config = {
  api: { bodyParser: true },
};

// ✅ Authorization 헤더 읽기 (대소문자/환경 모두 호환)
function getAuthToken(req) {
  const header =
    req.headers.authorization ||
    req.headers.Authorization ||
    req.headers.get?.('authorization');

  if (!header) return null;
  const parts = header.split(' ');
  return parts.length === 2 ? parts[1] : null;
}

export default async function handler(req, res) {
  // 🔹 목록
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT id, title, created_at, views FROM notice_board ORDER BY created_at DESC LIMIT 20'
      );
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('[NOTICE LIST ERROR]', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // 🔹 추가 (로그인 필요)
  if (req.method === 'POST') {
    try {
      const token = getAuthToken(req);
      if (!token) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
      }

      const { title, content } = req.body || {};
      if (!title || !content) {
        return res.status(400).json({ error: '제목과 내용을 모두 입력하세요.' });
      }

      const result = await pool.query(
        `INSERT INTO notice_board (title, content, created_at, views)
         VALUES ($1, $2, NOW(), 0)
         RETURNING id, title, created_at, views`,
        [title, content]
      );

      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('[NOTICE ADD ERROR]', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
