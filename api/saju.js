// api/saju.js
import { calculateDaeyunAge, getJeolipDate } from '../public/utils2.js';
import solarlunar from 'solarlunar';

// 필요한 함수들을 utils2.js나 별도 헬퍼 파일에 넣었다고 가정합니다.
// 예) getGanji, hanToKor, isDSTKorea 함수도 임포트해 주세요.
import { getGanji, hanToKor, isDSTKorea } from '../public/utils2.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let { year, month, day, hour, minute, calendarType, gender } = req.body;

  if (!year || !month || !day || hour === undefined || minute === undefined || !calendarType) {
    return res.status(400).json({ error: '누락된 입력값이 있습니다.' });
  }

  if (calendarType === 'lunar') {
    const converted = solarlunar.lunar2solar(year, month, day, false);
    if (!converted || !converted.cYear) {
      return res.status(400).json({ error: '음력을 양력으로 변환하는 데 실패했습니다.' });
    }
    year = converted.cYear;
    month = converted.cMonth;
    day = converted.cDay;
  }

  // 한국 DST 보정 (필요하면 utils2.js로 분리)
  if (isDSTKorea(year, month, day)) {
    hour -= 1;
    if (hour < 0) {
      const prev = new Date(year, month - 1, day - 1);
      year = prev.getFullYear();
      month = prev.getMonth() + 1;
      day = prev.getDate();
      hour = 23;
    }
  }

  // 생년월일 Date 객체 생성 (서울 시간 기준)
  const birthDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`);

  const jeolipDate = getJeolipDate(year, month);

  const ganji = getGanji(year, month, day, hour, minute);

  if (!ganji.year) {
    return res.status(500).json({ error: '간지 계산 오류' });
  }

  const yearStemKor = hanToKor(ganji.year.charAt(0));

  const daeyunAge = calculateDaeyunAge(birthDate, jeolipDate, gender, yearStemKor);

  const lunar = solarlunar.solar2lunar(year, month, day);

  return res.status(200).json({
    solar: { year, month, day, hour, minute },
    lunar: {
      lunarYear: lunar.lYear,
      lunarMonth: lunar.lMonth,
      lunarDay: lunar.lDay,
      isleap: lunar.isLeap,
      hour,
      minute,
    },
    daeyunAge,
    yearStemKor,
    ganji,
    birthYear: birthDate.getFullYear(),
  });
}
