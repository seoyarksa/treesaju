// server.js 
import dotenv from 'dotenv';
import express from 'express';
import solarlunar from 'solarlunar'; // 기존 라이브러리
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';

dotenv.config();

// ✅ Supabase 서버측 토큰 검증용
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

// 유틸 import (원본 유지)
import { calculateDaeyunAge } from './utils/dateUtils.js';
import { 
  getSolarTermDates, 
  getJeolipDate, 
  getAccurateSolarLongitude, 
  getSolarTermDate, 
  MONTH_TO_SOLAR_TERM 
} from './utils/solarTermCalculator.js';
import { stemOrder, branchOrder } from './public/constants.js';  

dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();
app.use(express.json());



// ✅ 현재 로그인 사용자 정보 API (Supabase 토큰 기반)
app.get('/api/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: '로그인 필요' });

    const { data: userData, error } = await supabase.auth.getUser(token);
    if (error || !userData?.user) return res.status(401).json({ error: '토큰이 유효하지 않습니다.' });

    // 프로필에서 role 조회
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('role, created_at, daily_limit')
      .eq('user_id', userData.user.id)
      .single();

    if (pErr) return res.status(500).json({ error: '프로필 조회 실패' });

    res.json({
      id: userData.user.id,
      email: userData.user.email,
      role: (profile?.role || 'normal').toLowerCase(),
    });
  } catch (e) {
    res.status(500).json({ error: '서버 오류' });
  }
});

// 한국 시간 포맷 함수 (원본 유지)
function formatDateKST(date) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .replace('Z', '+09:00');
}

const PORT = 3000;

// __dirname 설정 (ESM) — 원본 위치보다 살짝 앞당겨도 무방
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CORS: 관리자 API에서 Authorization/PUT/DELETE 허용
app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
}));

// JSON 파서(원본 유지) + bodyParser.json(원본 유지; 중복이어도 동작엔 문제 없음)
app.use(bodyParser.json());

// 정적 파일 (원본 유지)
app.use(express.static(path.join(__dirname, 'public')));

// 천간, 지지 (원본 유지)
const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 시주 천간표 (원본 유지)
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

// 한자 <-> 한글 변환 (원본 유지)
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

// 절기 → 다음 절기 매핑 (원본 유지)
const SOLAR_TERM_NEXT = {
  '입춘': '경칩',
  '경칩': '청명',
  '청명': '입하',
  '입하': '망종',
  '망종': '소서',
  '소서': '입추',
  '입추': '백로',
  '백로': '한로',
  '한로': '입동',
  '입동': '대설',
  '대설': '소한',
  '소한': '입춘'
};

// 한국 DST 여부 (원본 유지)
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

// 시지 계산 (원본 유지)
function getTimeIndexByHourMinute(hour, minute) {
  const totalMinutes = hour * 60 + minute;
  const startMinutesArr = [
    23 * 60 + 30,
    1 * 60 + 30,
    3 * 60 + 30,
    5 * 60 + 30,
    7 * 60 + 30,
    9 * 60 + 30,
    11 * 60 + 30,
    13 * 60 + 30,
    15 * 60 + 30,
    17 * 60 + 30,
    19 * 60 + 30,
    21 * 60 + 30,
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

// (원본 유지) 절기월 인덱스
function getSolarTermMonthIndex(date) {
  const year = date.getFullYear();
  const solarTerms = [
    ...getSolarTermDates(year - 1),
    ...getSolarTermDates(year),
    ...getSolarTermDates(year + 1)
  ];
  const termToBranchIndex = {
    '입춘': 0, '경칩': 1, '청명': 2, '입하': 3, '망종': 4, '소서': 5,
    '입추': 6, '백로': 7, '한로': 8, '입동': 9, '대설': 10, '소한': 11
  };
  const monthStartDates = solarTerms
    .filter(t => termToBranchIndex.hasOwnProperty(t.name))
    .map(t => ({ name: t.name, date: new Date(t.date) }))
    .sort((a, b) => a.date - b.date);
  const dateKST = dayjs(date).tz('Asia/Seoul');

  for (let i = 0; i < monthStartDates.length; i++) {
    const start = dayjs(monthStartDates[i].date).tz('Asia/Seoul');
    let end;
    if (i === monthStartDates.length - 1) {
      const nextIpchun = solarTerms.find(
        t => t.name === '입춘' && new Date(t.date) > monthStartDates[i].date
      );
      if (!nextIpchun) throw new Error(`다음해 입춘 데이터 없음`);
      end = dayjs(nextIpchun.date).tz('Asia/Seoul');
    } else {
      end = dayjs(monthStartDates[i+1].date).tz('Asia/Seoul');
    }
    if ((dateKST.isAfter(start) || dateKST.isSame(start)) && dateKST.isBefore(end)) {
      const term = monthStartDates[i].name;
      const idx = termToBranchIndex[term];
      console.log(`[절기 월 결정] ${term} 시작 → 인덱스 ${idx}`);
      return idx;
    }
  }
  return 11; // fallback
}

// 월간 천간 계산 (원본 유지)
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
function getMonthGan(yearGanjiYear, solarTermMonthIndex) {
  if (!monthGanTable[yearGanjiYear]) {
    throw new Error(`유효하지 않은 연간 천간: ${yearGanjiYear}`);
  }
  const monthGan = monthGanTable[yearGanjiYear][solarTermMonthIndex];
  return monthGan;
}

// 일주 계산 (원본 유지)
function getDayGanji(year, month, day) {
  const baseDate = new Date(1900, 1, 19); // 갑자일
  const targetDate = new Date(`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}T00:00:00+09:00`);
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
  if (isNaN(diffDays)) throw new Error("유효하지 않은 날짜입니다.");
  const stemIndex = diffDays % 10;
  const branchIndex = diffDays % 12;
  return heavenlyStems[(0 + stemIndex + 10) % 10] + earthlyBranches[(0 + branchIndex + 12) % 12];
}

// 입춘 기준 년주 보정 (원본 유지)
function getYearGanjiByJeolip(year, birthDate) {
  const heavenlyStems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const earthlyBranches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const baseYear = 1864;
  const baseStemIndex = 0;
  const baseBranchIndex = 0;
  const ipchun = getSolarTermDates(year).find(t => t.name === '입춘');
  const ipchunDate = new Date(ipchun.date);
  const targetYear = (birthDate < ipchunDate) ? year - 1 : year;
  const diff = targetYear - baseYear;
  const stem = heavenlyStems[(baseStemIndex + diff) % 10];
  const branch = earthlyBranches[(baseBranchIndex + diff) % 12];
  return stem + branch;
}

// 간지 최종 (원본 유지)
export function getGanji(year, month, day, hour, minute) {
  const birthDate = new Date(year, month - 1, day, hour, minute);
  const dayGanji = getDayGanji(year, month, day);
  const dayGanHan = dayGanji.charAt(0);

  const lunarDate = solarlunar.solar2lunar(year, month, day);
  let yearGanji = lunarDate.gzYear;

  // 당해 2월 기준 입춘 절입시각
  const ipchunDate = getJeolipDate(new Date(year, 2, 4));
  if (birthDate.getTime() < ipchunDate.getTime()) {
    const prev = solarlunar.solar2lunar(year - 1, 6, 1);
    yearGanji = prev.gzYear;
  }

  const solarTermMonthIndex = getSolarTermMonthIndex(birthDate);
  const monthGanHan = getMonthGan(yearGanji.charAt(0), solarTermMonthIndex);
  const monthJiHan = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'][solarTermMonthIndex];
  const monthGanji = monthGanHan + monthJiHan;

  const timeIndex = getTimeIndexByHourMinute(hour, minute);
  const dayStemIndex = heavenlyStems.indexOf(dayGanHan);
  const timeStemIndex = (dayStemIndex * 2 + timeIndex) % 10;
  const timeGanji = heavenlyStems[timeStemIndex] + earthlyBranches[timeIndex];

  return { year: yearGanji, month: monthGanji, day: dayGanji, time: timeGanji };
}

// 사주 API (원본 유지 + 안전 가드만 추가)
app.post('/api/saju', (req, res) => {
  let { year, month, day, hour, minute, calendarType, gender  } = req.body;

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

  const jeolipDate = getJeolipDate(year, month, day, hour, minute);

  // 안전 로그 (jeolipDate가 Date일 수도, {thisTerm,..} 객체일 수도)
  try {
    console.log('birthDate:', birthDate.toISOString());
  } catch {}
  try {
    if (jeolipDate?.toISOString) console.log('jeolipDate:', jeolipDate.toISOString());
  } catch {}

  const thisTerm = jeolipDate?.thisTerm;
  const nextTerm = jeolipDate?.nextTerm;

  const birthDateKST = dayjs(birthDate).tz('Asia/Seoul').toDate();
  const idx = getSolarTermMonthIndex(birthDateKST);

  const ganji = getGanji(year, month, day, hour, minute);
  const yearStemKor = hanToKor(ganji.year.charAt(0));
  const daeyunAge = calculateDaeyunAge(birthDate, jeolipDate, gender, yearStemKor);

  const lunar = solarlunar.solar2lunar(year, month, day);

  return res.json({
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
    gender,
    jeolipDate,
    thisTerm: thisTerm ? { name: thisTerm.name, date: thisTerm.date } : null,
    nextTerm: nextTerm ? { name: nextTerm.name, date: nextTerm.date } : null
  });
});

// ✅ 서버 실행 (중복 listen 제거)
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

// 📌 절입 API (원본 위치/기능 유지)
app.get('/api/jeolip', (req, res) => {
  const { year, month, day } = req.query;
  try {
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);
    if (isNaN(y) || isNaN(m) || isNaN(d)) {
      throw new Error('year, month, day 중 하나 이상이 유효한 숫자가 아닙니다.');
    }
    const date = getJeolipDate(y, m, d);
    res.json({ date: date.toISOString ? date.toISOString() : date });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// ✅ 아임포트 빌링 등록 API
app.post("/api/payment/register-billing", async (req, res) => {
  const { imp_uid, customer_uid } = req.body;

  try {
    // 1️⃣ 아임포트 액세스 토큰 발급
    const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imp_key: process.env.IAMPORT_API_KEY,       // .env에 추가
        imp_secret: process.env.IAMPORT_API_SECRET, // .env에 추가
      }),
    });
    const tokenJson = await tokenRes.json();
    const access_token = tokenJson?.response?.access_token;
    if (!access_token) throw new Error("IAMPORT 토큰 발급 실패");

    // 2️⃣ 고객 빌링키 등록
    const billingRes = await fetch(
      `https://api.iamport.kr/subscribe/customers/${customer_uid}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: access_token,
        },
        body: JSON.stringify({
          card_number: "1234-1234-1234-1234", // 실제 카드정보는 클라이언트 입력값
          expiry: "2027-12",
          birth: "880101",
          pwd_2digit: "12",
        }),
      }
    );

    const billingJson = await billingRes.json();
    res.status(200).json(billingJson);
  } catch (err) {
    console.error("[register-billing error]", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ 매달 자동 과금 (빌링키 기반)
app.post("/api/payment/charge-billing", async (req, res) => {
  const { customer_uid, amount = 9900, name = "월간 정기구독" } = req.body;

  try {
    // 1️⃣ 아임포트 액세스 토큰 발급
    const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imp_key: process.env.IAMPORT_API_KEY,
        imp_secret: process.env.IAMPORT_API_SECRET,
      }),
    });
    const tokenJson = await tokenRes.json();
    const access_token = tokenJson?.response?.access_token;
    if (!access_token) throw new Error("IAMPORT 토큰 발급 실패");

    // 2️⃣ 등록된 빌링키로 결제 재시도 (자동결제)
    const payRes = await fetch("https://api.iamport.kr/subscribe/payments/again", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": access_token,
      },
      body: JSON.stringify({
        customer_uid,                   // 빌링 등록 시 사용한 고객 UID
        merchant_uid: "again_" + new Date().getTime(), // 고유 주문번호
        amount,
        name,
      }),
    });

    const payJson = await payRes.json();
    res.status(200).json(payJson);
  } catch (err) {
    console.error("[charge-billing error]", err);
    res.status(500).json({ error: err.message });
  }
});


