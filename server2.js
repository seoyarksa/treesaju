// server.js 
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import solarlunar from 'solarlunar' // 기존 라이브러리
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);


// 수정된 유틸 import
import { calculateDaeyunAge } from './public/dateUtils.js';
import { getSolarTermDates, getJeolipDate, getAccurateSolarLongitude } from './public/solarTermCalculator.js';
import { stemOrder, branchOrder } from './public/constants.js';  // 사용 중이면 유지

// server.js 또는 solarTermCalculator.js 파일 상단 어딘가에
function formatDateKST(date) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .replace('Z', '+09:00');
}


const app = express();
const PORT = 3000;



app.get('/api/jeolip', (req, res) => {
  const { year, month } = req.query;

  console.log('📥 [/api/jeolip] 요청 받음');
  console.log('➡️ 입력값 year:', year, 'month:', month);

  try {
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    console.log('📅 생성된 Date 객체:', dateObj);

    const date = getJeolipDate(dateObj);
    console.log('✅ getJeolipDate 반환값:', date);

    res.json({ date: date.toISOString() });  // Date → ISO 문자열로 보내기
  } catch (e) {
    console.error('❌ [/api/jeolip] 에러 발생:', e.message);
    console.error(e.stack); // 에러 스택까지 출력
    res.status(500).send({ error: e.message });
  }
});


// __dirname 설정 (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 천간, 지지
const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];


// 시주 천간표 (일간 기준)
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

// 한자 <-> 한글 변환
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


// 한국 DST 여부 판단 함수 (역사적 썸머타임 구간 모두 반영)
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

// 시지 계산: 30분 경계 기준 + DST 1시간 보정 포함
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

// 간지 계산

const MONTH_TO_SOLAR_TERM = {
  1: '소한',   // 1월 시작 절기 (소한) → 입춘 이전 절기
  2: '입춘',   // 2월 시작 절기 (입춘)
  3: '경칩',
  4: '청명',
  5: '입하',
  6: '망종',
  7: '소서',
  8: '입추',
  9: '백로',
  10: '한로',
  11: '입동',
  12: '대설',
};

/**
 * 양력 기준 절기월 인덱스 구하기 (입춘을 1월 인덱스로)
 * @param {Date} date 한국 표준시 Date 객체
 * @returns {number} 0~11 (0=입춘(인월))
 */
function getSolarTermMonthIndex(date) {
  const year = date.getFullYear()
  const solarTerms = getSolarTermDates(year);
console.log(solarTerms.map(t => `${t.name}: ${dayjs(t.date).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')}`));

  // 입춘 기준 절기월 시작 절기명 배열 (12개)
  const termNames = [
    '입춘', '경칩', '청명', '입하', '망종', '소서',
    '입추', '백로', '한로', '입동', '대설', '소한'
  ]
  const monthStartDates = termNames.map(name => {
    const term = solarTerms.find(t => t.name === name)
    if (!term) throw new Error(`${name} 절기 데이터 없음`)
    return new Date(term.date)
  })

  const dateKST = dayjs(date).tz('Asia/Seoul')
  for(let i=0; i<monthStartDates.length; i++){
    const start = dayjs(monthStartDates[i]).tz('Asia/Seoul')
    const end = dayjs(monthStartDates[(i+1) % monthStartDates.length]).tz('Asia/Seoul')
    // console.log(`[절기 월 비교] 인덱스: ${i}, 절기명: ${termNames[i]}, 시작일: ${start.format('YYYY-MM-DD HH:mm:ss')}, 다음 절기 시작일: ${end.format('YYYY-MM-DD HH:mm:ss')}, 비교일: ${dateKST.format('YYYY-MM-DD HH:mm:ss')}`);

    // 절기 월 범위 체크 (start 이상 end 미만)
    if(dateKST.isAfter(start) || dateKST.isSame(start)){
      if(dateKST.isBefore(end)){
         console.log(`[절기 월 결정] 인덱스: ${i}, 절기명: ${termNames[i]}`);
        return i // 0부터 시작, 입춘=0
      }
    }
  }
  return 11 // 대한 이후면 대한월(11)
}

/**
 * 월간 천간 계산
 * 연간 천간과 절기월 인덱스로 계산
 * @param {string} yearGanjiYear 간지 연간 (ex: '갑')
 * @param {number} solarTermMonthIndex 절기월 인덱스 (0~11)
 * @returns {string} 월간 천간 한글
 */
const monthGanTable = {
  '甲': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
  '乙': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
  '丙': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
  '丁': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  '戊': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
  '己': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
  '庚': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
  '辛': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
  '壬': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  '癸': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
}

function getMonthGan(yearGanjiYear, solarTermMonthIndex) {
  console.log('getMonthGan 호출:', yearGanjiYear, solarTermMonthIndex);

  if (!monthGanTable[yearGanjiYear]) {
    throw new Error(`유효하지 않은 연간 천간: ${yearGanjiYear}`);
  }

  const monthGan = monthGanTable[yearGanjiYear][solarTermMonthIndex];
  console.log(`🔢 월간 계산 결과: ${monthGan} (절기 인덱스 ${solarTermMonthIndex})`);
  return monthGan;
}

/**
 * 수정된 getGanji 함수
 * @param {number} year 양력 년
 * @param {number} month 양력 월 (1~12)
 * @param {number} day 양력 일
 * @param {number} hour 시 (0~23)
 * @param {number} minute 분 (0~59)
 * @returns {{year:string, month:string, day:string, time:string}} 간지 결과
 */
export function getGanji(year, month, day, hour, minute) {
  console.log('[getGanji] 입력값:', { year, month, day, hour, minute });

  const lunarDate = solarlunar.solar2lunar(year, month, day);
  console.log('[getGanji] lunarDate:', lunarDate);

  const dayGanji = lunarDate.gzDay;
  const dayGanHan = dayGanji.charAt(0);
  const dayGanKor = hanToKor(dayGanHan);
  console.log('[getGanji] 일간 한자:', dayGanHan, '→ 한글:', dayGanKor);

  const yearGanji = lunarDate.gzYear;
  const yearGanHan = yearGanji.charAt(0);
  console.log('[getGanji] 연간 한자:', yearGanHan);

  // 절기월 인덱스 계산 (입춘=0)
  const solarTermMonthIndex = getSolarTermMonthIndex(new Date(year, month - 1, day, hour, minute));
  console.log('[getGanji] 절기월 인덱스:', solarTermMonthIndex);

  // 월간 천간 계산 (절기월 기준)
  const monthGanHan = getMonthGan(yearGanHan, solarTermMonthIndex);
  console.log('[getGanji] 월간 천간 한자:', monthGanHan);

  // 절기 기준 월지 계산
  const earthlyBranchesSolarTerm = [
  '寅', // 0: 입춘
  '卯', // 1: 경칩
  '辰', // 2: 청명
  '巳', // 3: 입하
  '午', // 4: 망종
  '未', // 5: 소서
  '申', // 6: 입추
  '酉', // 7: 백로
  '戌', // 8: 한로
  '亥', // 9: 입동 ← 여기!
  '子', // 10: 대설
  '丑', // 11: 소한
];

  const monthJiHan = earthlyBranchesSolarTerm[solarTermMonthIndex];
  console.log('[getGanji] 월지 한자:', monthJiHan);

  const monthGanji = monthGanHan + monthJiHan;
  console.log('[getGanji] 월간지:', monthGanji);

  // --- 시간 간지 계산 추가 ---
  // 천간 배열 (한자)
  const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  // 지지 배열 (한자)
  const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 시간 인덱스 계산 함수 getTimeIndexByHourMinute 그대로 사용한다고 가정
  const timeIndex = getTimeIndexByHourMinute(hour, minute);
  console.log('[getGanji] 시간 인덱스:', timeIndex);

  // 일간 천간 인덱스 구하기
  const dayStemIndex = heavenlyStems.indexOf(dayGanHan);
  console.log('[getGanji] 일간 천간 인덱스:', dayStemIndex);

  // 시간 천간 인덱스 계산 (일간 * 2 + 시간 인덱스) % 10
  const timeStemIndex = (dayStemIndex * 2 + timeIndex) % 10;
  const timeStemHan = heavenlyStems[timeStemIndex];
  const timeBranchHan = earthlyBranches[timeIndex];
  const timeGanji = timeStemHan + timeBranchHan;
  console.log('[getGanji] 시간 간지:', timeGanji);

  return {
    year: yearGanji,
    month: monthGanji,
    day: dayGanji,
    time: timeGanji,  // 여기에 시간 간지 추가
  };
}


// API 요청 처리
app.post('/api/saju', (req, res) => {
  let { year, month, day, hour, minute, calendarType, gender  } = req.body;
 // 1) 생년월일 Date 객체 생성


  console.log('서버 수신 데이터:', req.body);
  console.log(`서버에 받은 시간: ${hour}시 ${minute}분`);
  console.log('calendarType:', calendarType);

 if (!year || !month || !day || hour === undefined || minute === undefined || !calendarType) {
  return res.status(400).json({ error: '누락된 입력값이 있습니다.' });
}

  console.log('calendarType:', calendarType);  // ✅ 확인용

if (calendarType === 'lunar') {
  const converted = solarlunar.lunar2solar(year, month, day, false);
  console.log('음력 → 양력 변환 결과:', converted);
  if (!converted || !converted.cYear) {
    return res.status(400).json({ error: '음력을 양력으로 변환하는 데 실패했습니다.' });
  }
  year = converted.cYear;
  month = converted.cMonth;
  day = converted.cDay;
}

  console.log(`최종 양력 생년월일: ${year}-${month}-${day}`);



    console.log(`음력 → 양력 변환 결과: ${year}-${month}-${day}`);
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
  // 3. 날짜 객체 생성
//const birthDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`);
//////////////////////////////////////console.log('birthDate (toISOString):', birthDate.toISOString());
//console.log('birthDate (local time):', birthDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
//console.log('birthDate.getFullYear():', birthDate.getFullYear());


//음력을 양력으로 변경, 양력생일입력
// 음력 → 양력 변환 완료 이후 시점
console.log(`최종 양력 생년월일: ${year}-${month}-${day}`);

// ✅ 이 위치에서 Date 객체 생성해도 완벽히 안전함
const birthDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`);

if (isNaN(birthDate.getTime())) {
  console.error('❌ birthDate 생성 실패:', year, month, day, hour, minute);
  return res.status(500).json({ error: '유효하지 않은 생년월일입니다.' });
}
const jeolipDate = getJeolipDate(birthDate);  // ✅ 이건 항상 양력 기준 Date
console.log('✅ 최종 birthDate:', formatDateKST(birthDate));
console.log('✅ 계산된 jeolipDate:', formatDateKST(jeolipDate));






//const idx = getSolarTermMonthIndex(birthDate);
//////////////////////////console.log('절기월 인덱스:', idx);
const idx = getSolarTermMonthIndex(birthDate);
console.log('절기월 인덱스:', idx);
// ✅ 여기서 yearStemKor 변수 선언
// 1. ganji 먼저 얻기
const ganji = getGanji(year, month, day, hour, minute);

// 2. yearStemKor 추출
const yearStemKor = hanToKor(ganji.year.charAt(0));  // 예: '己酉' → '己' → '기'
console.log('ganji.year:', ganji.year);       // ex) '己酉'
console.log('yearStemKor:', yearStemKor);     // ex) '기'
// 3. daeyunAge 계산
const daeyunAge = calculateDaeyunAge(birthDate, jeolipDate, gender, yearStemKor);

  console.log('birthDate:', birthDate.toISOString());
  console.log('jeolipDate:', jeolipDate.toISOString());
  console.log('대운 시작 나이:', daeyunAge);  // ✅ 이제 여기서 사용 가능
  console.log('ganji:', ganji);
console.log('ganji.year:', ganji.year);
if (!ganji.year) {
  console.error('Error: ganji.year is undefined or empty');
}
console.log('yearStemKor:', hanToKor(ganji.year.charAt(0)));
  
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
       yearStemKor, // 👉 이 줄 추가
    ganji,
 birthYear: birthDate.getFullYear()  // ✅ 여기서 숫자 연도로 추가
  });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
