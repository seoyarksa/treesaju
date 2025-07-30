// saju.js

// git add .
// git commit -m "오행식 수정"   
// git push origin main
// git push


// saju.js (vercel serverless function)
// saju.js (Vercel serverless function)

import solarlunar from 'solarlunar';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
//import dotenv from 'dotenv';

import { calculateDaeyunAge } from '../public/dateUtils.js';
import { getJeolipDate, getSolarTermDates } from '../utils/solarTermCalculator.js';

dayjs.extend(utc);
dayjs.extend(timezone);
//dotenv.config();

const hanToKorStem = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계'
};
const hanToKor = (han) => hanToKorStem[han] || han;

const heavenlyStems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const earthlyBranches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

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

  for (let i = 0; i < startMinutesArr.length; i++) {
    let start = startMinutesArr[i];
    let end = startMinutesArr[(i + 1) % 12] - 1;

    if (end < start) {
      if ((modTotalMinutes >= start && modTotalMinutes <= 1439) || (modTotalMinutes >= 0 && modTotalMinutes <= end)) {
        return i;
      }
    } else {
      if (modTotalMinutes >= start && modTotalMinutes <= end) {
        return i;
      }
    }
  }
  return 0;
}

function getSolarTermMonthIndex(date) {
  const year = date.getFullYear();
  const solarTerms = getSolarTermDates(year);
  const termNames = ['입춘','경칩','청명','입하','망종','소서','입추','백로','한로','입동','대설','소한'];
  const monthStartDates = termNames.map(name => {
    const term = solarTerms.find(t => t.name === name);
    if (!term) throw new Error(`${name} 절기 데이터 없음`);
    return new Date(term.date);
  });

  const dateKST = dayjs(date).tz('Asia/Seoul');
  for(let i=0; i<monthStartDates.length; i++){
    const start = dayjs(monthStartDates[i]).tz('Asia/Seoul');
    const end = dayjs(monthStartDates[(i+1) % 12]).tz('Asia/Seoul');
    if(dateKST.isAfter(start) || dateKST.isSame(start)){
      if(dateKST.isBefore(end)) return i;
    }
  }
  return 11;
}

function getMonthGan(yearGanjiYear, solarTermMonthIndex) {
  if (!monthGanTable[yearGanjiYear]) {
    throw new Error(`유효하지 않은 연간 천간: ${yearGanjiYear}`);
  }
  return monthGanTable[yearGanjiYear][solarTermMonthIndex];
}

function getGanji(year, month, day, hour, minute) {
  const lunarDate = solarlunar.solar2lunar(year, month, day);
  const dayGanji = lunarDate.gzDay;
  const dayGanHan = dayGanji.charAt(0);
  const yearGanji = lunarDate.gzYear;
  const yearGanHan = yearGanji.charAt(0);

  const solarTermMonthIndex = getSolarTermMonthIndex(new Date(year, month - 1, day, hour, minute));
  const monthGanHan = getMonthGan(yearGanHan, solarTermMonthIndex);
  const monthJiHan = earthlyBranches[solarTermMonthIndex];
  const monthGanji = monthGanHan + monthJiHan;

  const timeIndex = getTimeIndexByHourMinute(hour, minute);
  const dayStemIndex = heavenlyStems.indexOf(dayGanHan);
  const timeStemIndex = (dayStemIndex * 2 + timeIndex) % 10;
  const timeGanji = heavenlyStems[timeStemIndex] + earthlyBranches[timeIndex];

  return {
    year: yearGanji,
    month: monthGanji,
    day: dayGanji,
    time: timeGanji,
  };
}

// ✅ Vercel 서버리스 엔트리포인트
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않은 메서드입니다.' });
  }

  try {
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

    const birthDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`);
    if (isNaN(birthDate.getTime())) {
      return res.status(500).json({ error: '유효하지 않은 생년월일입니다.' });
    }

    const jeolipDate = getJeolipDate(birthDate);
    const ganji = getGanji(year, month, day, hour, minute);
    const yearStemKor = hanToKor(ganji.year.charAt(0));
    const daeyunAge = calculateDaeyunAge(birthDate, jeolipDate, gender, yearStemKor);
    const lunar = solarlunar.solar2lunar(year, month, day);

    res.status(200).json({
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
      birthYear: birthDate.getFullYear()
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
