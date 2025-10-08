import pool from '../../db.js';

export const config = {
  api: { bodyParser: true },
};

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
  const { id } = req.query;

  // ✅ 상세조회 (로그인 불필요)
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

  // ✅ 수정 (로그인 필요)
  if (req.method === 'PUT') {
    try {
      const token = getAuthToken(req);
      if (!token) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
      }

      const { title, content } = req.body || {};
      if (!title || !content) {
        return res.status(400).json({ error: '제목과 내용을 모두 입력하세요.' });
      }

      await pool.query('UPDATE notice_board SET title=$1, content=$2 WHERE id=$3', [title, content, id]);
      return res.status(200).json({ message: 'Updated successfully' });
    } catch (err) {
      console.error('[NOTICE UPDATE ERROR]', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // ✅ 삭제 (로그인 필요)
  if (req.method === 'DELETE') {
    try {
      const token = getAuthToken(req);
      if (!token) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
      }

      await pool.query('DELETE FROM notice_board WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
      console.error('[NOTICE DELETE ERROR]', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
