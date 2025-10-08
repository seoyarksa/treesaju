import pool from '../../db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  // 🔹 상세 조회 (GET)
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

  // 🔹 수정 (PUT)
  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { title, content } = body || {};

      if (!title || !content) {
        return res.status(400).json({ error: '제목과 내용을 모두 입력하세요.' });
      }

      const result = await pool.query(
        'UPDATE notice_board SET title = $1, content = $2 WHERE id = $3 RETURNING id',
        [title, content, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: '공지 없음' });
      }

      return res.status(200).json({ message: 'Updated successfully' });
    } catch (err) {
      console.error('[NOTICE UPDATE ERROR]', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // 🔹 삭제 (DELETE)
  if (req.method === 'DELETE') {
    try {
      const result = await pool.query('DELETE FROM notice_board WHERE id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: '이미 삭제되었거나 존재하지 않습니다.' });
      }
      return res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
      console.error('[NOTICE DELETE ERROR]', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // 그 외 메서드
  return res.status(405).json({ error: 'Method Not Allowed' });
}
