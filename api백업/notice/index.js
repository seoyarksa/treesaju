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

  return res.status(405).json({ error: 'Method Not Allowed' });
}
