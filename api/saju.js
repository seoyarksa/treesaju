// saju.js

// git add .
// git commit -m "서버에서 절기 계산 로직 반영 및 birthDate 안정화"
// git push origin main
// git push


// saju.js (vercel serverless function)

// api/saju.js

import { calculateDaeyunAge } from '../utils/dateUtils.js';
import { getJeolipDate } from '../utils/solarTermCalculator.js';

const stemOrder = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const branchOrder = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const hanToKorStem = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계'
};
const korToHanStem = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸'
};
const hanEarthlyBranches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const hanToKor = (han) => hanToKorStem[han] || han;

const timeGanTable = {
  '갑': ['갑','을','병','정','무','기','경','신','임','계','갑','을'],
  '을': ['병','정','무','기','경','신','임','계','갑','을','병','정'],
  '병': ['무','기','경','신','임','계','갑','을','병','정','무','기'],
  '정': ['경','신','임','계','갑','을','병','정','무','기','경','신'],
  '무': ['임','계','갑','을','병','정','무','기','경','신','임','계'],
  '기': ['갑','을','병','정','무','기','경','신','임','계','갑','을'],
  '경': ['병','정','무','기','경','신','임','계','갑','을','병','정'],
  '신': ['무','기','경','신','임','계','갑','을','병','정','무','기'],
  '임': ['경','신','임','계','갑','을','병','정','무','기','경','신'],
  '계': ['임','계','갑','을','병','정','무','기','경','신','임','계'],
};

function isDSTKorea(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const dstPeriods = [
    { start: new Date(Date.UTC(1948, 4, 8)), end: new Date(Date.UTC(1948, 8, 12)) },
    { start: new Date(Date.UTC(1955, 4, 15)), end: new Date(Date.UTC(1955, 8, 15)) },
    { start: new Date(Date.UTC(1956, 4, 15)), end: new Date(Date.UTC(1956, 8, 15)) },
    { start: new Date(Date.UTC(1957, 4, 15)), end: new Date(Date.UTC(1957, 8, 15)) },
    { start: new Date(Date.UTC(1958, 4, 15)), end: new Date(Date.UTC(1958, 8, 15)) },
    { start: new Date(Date.UTC(1959, 4, 15)), end: new Date(Date.UTC(1959, 8, 15)) },
    { start: new Date(Date.UTC(1960, 4, 15)), end: new Date(Date.UTC(1960, 8, 15)) },
    { start: new Date(Date.UTC(1987, 4, 10)), end: new Date(Date.UTC(1987, 9, 11)) },
    { start: new Date(Date.UTC(1988, 4, 8)),  end: new Date(Date.UTC(1988, 9, 9)) }
  ];
  return dstPeriods.some(({ start, end }) => date >= start && date < end);
}

function getTimeIndexByHourMinute(hour, minute) {
  const totalMinutes = hour * 60 + minute;
  const startMinutesArr = [
    1410, 90, 210, 330, 450, 570,
    690, 810, 930, 1050, 1170, 1290
  ];
  const modTotalMinutes = totalMinutes % 1440;

  for (let i = 0; i < 12; i++) {
    let start = startMinutesArr[i];
    let end = startMinutesArr[(i + 1) % 12] - 1;
    if (end < start) {
      if ((modTotalMinutes >= start && modTotalMinutes <= 1439) || (modTotalMinutes >= 0 && modTotalMinutes <= end)) return i;
    } else {
      if (modTotalMinutes >= start && modTotalMinutes <= end) return i;
    }
  }
  return 0;
}

function getGanji(year, month, day, hour, minute, solarlunar) {
  const lunarDate = solarlunar.solar2lunar(year, month, day);
  const dayGanji = lunarDate.gzDay;
  const dayGanKor = hanToKor(dayGanji.charAt(0));
  const timeIndex = getTimeIndexByHourMinute(hour, minute);
  const timeGanKor = timeGanTable[dayGanKor]?.[timeIndex] || '오류';
  const timeGanji = (korToHanStem[timeGanKor] || '?') + hanEarthlyBranches[timeIndex];
  return {
    year: lunarDate.gzYear,
    month: lunarDate.gzMonth,
    day: dayGanji,
    time: timeGanji
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const solarlunar = (await import('solarlunar')).default;

    let { year, month, day, hour, minute, calendarType, gender } = req.body;

    year = parseInt(year, 10);
    month = parseInt(month, 10);
    day = parseInt(day, 10);
    hour = parseInt(hour, 10);
    minute = parseInt(minute, 10);

    if (
      isNaN(year) || isNaN(month) || isNaN(day) ||
      isNaN(hour) || isNaN(minute) || !calendarType
    ) {
      return res.status(400).json({ error: '입력값이 유효하지 않습니다.' });
    }

    if (calendarType === 'lunar') {
      const converted = solarlunar.lunar2solar(year, month, day, false);
      if (!converted?.cYear) {
        return res.status(400).json({ error: '음력을 양력으로 변환하는 데 실패했습니다.' });
      }
      year = converted.cYear;
      month = converted.cMonth;
      day = converted.cDay;
    }

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

    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`;
    console.log('📆 dateString:', dateString);

    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) {
      throw new Error(`Invalid birthDate: ${dateString}`);
    }

    // getJeolipDate 함수는 (year, month) 두 개 인자를 받도록 정의돼 있으므로,
    // birthDate의 년도, 월(0-based이므로 +1)으로 호출
    const jeolipDate = getJeolipDate(birthDate.getFullYear(), birthDate.getMonth() + 1);

    const ganji = getGanji(year, month, day, hour, minute, solarlunar);
    const yearStemKor = hanToKor(ganji.year.charAt(0));
    const daeyunAge = parseFloat(calculateDaeyunAge(birthDate, jeolipDate, gender, yearStemKor).toFixed(2));
    const lunar = solarlunar.solar2lunar(year, month, day);

    res.json({
      solar: { year, month, day, hour, minute },
      lunar: {
        lunarYear: lunar.lYear,
        lunarMonth: lunar.lMonth,
        lunarDay: lunar.lDay,
        isleap: lunar.isLeap,
        hour,
        minute
      },
      daeyunAge,
      yearStemKor,
      ganji,
      birthYear: birthDate.getFullYear(),
      month,
      day
    });
  } catch (error) {
    console.error('API 처리 중 오류 발생:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.', details: error.message });
  }
}

