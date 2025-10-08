// api/notice/index.js
import pool from '../../db.js';

export default async function handler(req, res) {
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

  // 🔹 새 공지 추가
  if (req.method === 'POST') {
    try {
      const { title, content } = req.body;

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

  // 그 외 메서드는 모두 거부
  return res.status(405).json({ error: 'Method Not Allowed' });
}
