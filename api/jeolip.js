import { getJeolipDate } from '../../utils/solarTermCalculator'; // 경로는 실제 위치에 맞게 조정하세요

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);

    if (isNaN(year) || isNaN(month)) {
      return res.status(400).json({ error: 'year와 month 쿼리 파라미터가 필요합니다.' });
    }

    const jeolipDate = getJeolipDate(year, month);

    return res.status(200).json({
      year,
      month,
      jeolipDate: jeolipDate.toISOString(),
    });
  } catch (error) {
    console.error('API /api/jeolip 처리 오류:', error);
    res.status(500).json({ error: '서버 오류 발생', details: error.message });
  }
}
