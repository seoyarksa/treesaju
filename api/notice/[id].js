// api/notice/[id].js
import pool from '../../db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      await pool.query('UPDATE notice_board SET views = views + 1 WHERE id = $1', [id]);
      const result = await pool.query('SELECT * FROM notice_board WHERE id = $1', [id]);
      return res.status(200).json(result.rows[0] || {});
    } catch (err) {
      console.error('[NOTICE DETAIL ERROR]', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
