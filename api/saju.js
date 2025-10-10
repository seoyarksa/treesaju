// api/saju.js (배포용, server.js 수정사항 반영)

// utils
import { calculateDaeyunAge } from '../utils/dateUtils.js';
import { getSolarTermDates, getJeolipDate, getSolarTermDate, MONTH_TO_SOLAR_TERM } from '../utils/solarTermCalculator.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

// ✅ 서버/배포 환경에서도 항상 한국 시간으로 고정
dayjs.tz.setDefault("Asia/Seoul");
// 천간, 지지
const heavenlyStems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const earthlyBranches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

const hanToKorStem = {
  '甲': '갑','乙': '을','丙': '병','丁': '정','戊': '무',
  '己': '기','庚': '경','辛': '신','壬': '임','癸': '계'
};
const hanToKor = (han) => hanToKorStem[han] || han;

// 절기 → 다음 절기 매핑
const SOLAR_TERM_NEXT = {
  '입춘': '경칩','경칩': '청명','청명': '입하','입하': '망종',
  '망종': '소서','소서': '입추','입추': '백로','백로': '한로',
  '한로': '입동','입동': '대설','대설': '소한','소한': '입춘'
};

// 한국 DST 여부 판단
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

// 시지 계산 (30분 경계 + DST 반영)
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

// 일주 계산 (1900-02-02 갑자일 기준)
function getDayGanji(year, month, day) {
  const baseDate = new Date(1900, 1, 19);
  const targetDate = new Date(`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}T00:00:00+09:00`);
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
  const stemIndex = diffDays % 10;
  const branchIndex = diffDays % 12;
  return heavenlyStems[(stemIndex + 10) % 10] + earthlyBranches[(branchIndex + 12) % 12];
}

// 월주 계산용 (절기월 인덱스)
function getSolarTermMonthIndex(date) {
  const year = date.getFullYear();
  const solarTerms = [
    ...getSolarTermDates(year - 1),
    ...getSolarTermDates(year),
    ...getSolarTermDates(year + 1)
  ];
  const termToBranchIndex = {
    '입춘': 0,'경칩': 1,'청명': 2,'입하': 3,'망종': 4,'소서': 5,
    '입추': 6,'백로': 7,'한로': 8,'입동': 9,'대설': 10,'소한': 11
  };
  const monthStartDates = solarTerms
    .filter(t => termToBranchIndex[t.name] !== undefined)
    .map(t => ({ name: t.name, date: new Date(t.date) }))
    .sort((a, b) => a.date - b.date);

  const dateKST = dayjs(date).tz('Asia/Seoul');
  for (let i = 0; i < monthStartDates.length; i++) {
    const start = dayjs(monthStartDates[i].date).tz('Asia/Seoul');
    let end = (i === monthStartDates.length - 1)
      ? dayjs(solarTerms.find(t => t.name === '입춘' && new Date(t.date) > monthStartDates[i].date).date).tz('Asia/Seoul')
      : dayjs(monthStartDates[i+1].date).tz('Asia/Seoul');
    if ((dateKST.isAfter(start) || dateKST.isSame(start)) && dateKST.isBefore(end)) {
      return termToBranchIndex[monthStartDates[i].name];
    }
  }
  return 11;
}

// 월간 천간표
const monthGanTable = {
  '甲': ['丙','丁','戊','己','庚','辛','壬','癸','甲','乙','丙','丁'],
  '乙': ['戊','己','庚','辛','壬','癸','甲','乙','丙','丁','戊','己'],
  '丙': ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己','庚','辛'],
  '丁': ['壬','癸','甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  '戊': ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸','甲','乙'],
  '己': ['丙','丁','戊','己','庚','辛','壬','癸','甲','乙','丙','丁'],
  '庚': ['戊','己','庚','辛','壬','癸','甲','乙','丙','丁','戊','己'],
  '辛': ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己','庚','辛'],
  '壬': ['壬','癸','甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  '癸': ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸','甲','乙'],
};
function getMonthGan(yearGanjiYear, idx) {
  return monthGanTable[yearGanjiYear]?.[idx] || '?';
}

// ganji 전체 계산
function getGanji(year, month, day, hour, minute, solarlunar) {
  // ✅ 반드시 KST 고정
  const birthDate = dayjs.tz(
    `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}T${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}:00`,
    "Asia/Seoul"
  ).toDate();

  // 일주
  const dayGanji = getDayGanji(year, month, day);
  const dayGanHan = dayGanji.charAt(0);

  // 년주 (입춘 보정)
  const lunarDate = solarlunar.solar2lunar(year, month, day);
  let yearGanji = lunarDate.gzYear;
  const ipchunDate = getJeolipDate(new Date(year, 2, 4));
  if (birthDate < ipchunDate) {
    yearGanji = solarlunar.solar2lunar(year - 1, 6, 1).gzYear;
  }

  // 월주
  const idx = getSolarTermMonthIndex(birthDate);
  const monthGan = getMonthGan(yearGanji.charAt(0), idx);
  const monthJi = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'][idx];
  const monthGanji = monthGan + monthJi;

  // 시주
  const timeIndex = getTimeIndexByHourMinute(hour, minute);
  const dayStemIndex = heavenlyStems.indexOf(dayGanHan);
  const timeStemIndex = (dayStemIndex * 2 + timeIndex) % 10;
  const timeGanji = heavenlyStems[timeStemIndex] + earthlyBranches[timeIndex];

  return { year: yearGanji, month: monthGanji, day: dayGanji, time: timeGanji };
}


// API handler
export default async function handler(req, res) {
  try {
    console.log("🕒 process.env.TZ:", process.env.TZ);
console.log("🕒 Intl resolved timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const solarlunar = (await import('solarlunar')).default;
    let { year, month, day, hour, minute, calendarType, gender } = req.body;
    year = +year; month = +month; day = +day; hour = +hour; minute = +minute;

    if (!year || !month || !day || hour === undefined || minute === undefined) {
      return res.status(400).json({ error: '입력값이 유효하지 않습니다.' });
    }

if (calendarType === 'lunar') {
  try {
    const converted = solarlunar.lunar2solar(year, month, day, false);

    if (!converted?.cYear) {
      // 변환 결과가 비정상 (예: 존재하지 않는 날짜)
      return res.status(400).json({
        error: '입력하신 음력 날짜는 실제로 존재하지 않습니다.',
      });
    }

    year = converted.cYear;
    month = converted.cMonth;
    day = converted.cDay;
  } catch (error) {
    console.error('음력 → 양력 변환 중 오류 발생:', error);
    // 예외 발생 시도 중 내부 오류 처리
    return res.status(500).json({
      error: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
}


    if (isDSTKorea(year, month, day)) {
      hour -= 1;
      if (hour < 0) {
        const prev = new Date(year, month - 1, day - 1);
        year = prev.getFullYear(); month = prev.getMonth() + 1; day = prev.getDate(); hour = 23;
      }
    }

  const birthDate = dayjs.tz(
  `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00`,
  "Asia/Seoul"
).toDate();

if (isNaN(birthDate.getTime())) {
  throw new Error('유효하지 않은 날짜');
}
    // 절기 관련
  const jeolipDate = getJeolipDate(year, month, day, hour, minute);
const thisTerm = jeolipDate.thisTerm;
const nextTerm = jeolipDate.nextTerm;



    // 간지
    const ganji = getGanji(year, month, day, hour, minute, solarlunar);
    const yearStemKor = hanToKor(ganji.year.charAt(0));

    // 대운
    const daeyunAge = calculateDaeyunAge(birthDate, jeolipDate, gender, yearStemKor);

    // 음력 변환
    const lunar = solarlunar.solar2lunar(year, month, day);

    res.json({
      solar: { year, month, day, hour, minute },
      lunar: {
        lunarYear: lunar.lYear,
        lunarMonth: lunar.lMonth,
        lunarDay: lunar.lDay,
        isleap: lunar.isLeap,
        hour, minute
      },
      daeyunAge,
      yearStemKor,
      ganji,
      birthYear: birthDate.getFullYear(),
      jeolipDate,
      thisTerm: thisTerm ? { name: thisTerm.name, date: thisTerm.date } : null,
      nextTerm: nextTerm ? { name: nextTerm.name, date: nextTerm.date } : null,
      gender,
    });
  } catch (e) {
    console.error('API 처리 오류:', e);
    res.status(500).json({ error: '서버 오류', details: e.message });
  }
}

