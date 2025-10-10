// api/jeolip.js



import { getJeolipDate } from '../utils/solarTermCalculator.js';
 // 경로는 실제 위치에 맞게 조정하세요

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

const year = parseInt(req.query.year, 10);
const month = parseInt(req.query.month, 10);
const day = parseInt(req.query.day, 10);
const hour = req.query.hour ? parseInt(req.query.hour, 10) : 0;
const minute = req.query.minute ? parseInt(req.query.minute, 10) : 0;

if (isNaN(year) || isNaN(month) || isNaN(day)) {
  return res.status(400).json({ error: 'year, month, day 쿼리 파라미터가 필요합니다.' });
}

const jeolipDate = getJeolipDate(year, month, day, hour, minute);

    return res.status(200).json({
      year,
      month,
      day,
      jeolipDate: jeolipDate.toISOString(),
    });
  } catch (error) {
    console.error('API /api/jeolip 처리 오류:', error);
    res.status(500).json({ error: '서버 오류 발생', details: error.message });
  }
}
