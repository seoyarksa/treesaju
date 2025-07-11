// server.js 
import express from 'express';

//console.log(calculateDaeyunAge(new Date(1969, 7, 23), new Date(1969, 8, 6, 15), 'male'));
// server.js 최상단
import { calculateDaeyunAge, getJeolipDate } from './public//utils2.js';
import { stemOrder, branchOrder } from './public/constants.js';


import cors from 'cors';
import bodyParser from 'body-parser';
import solarlunar from 'solarlunar';
import path from 'path';
import { fileURLToPath } from 'url';



const app = express();
const PORT = 3000;

// __dirname 설정 (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 천간, 지지
const heavenlyStems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const earthlyBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

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
function getGanji(year, month, day, hour, minute) {
  const lunarDate = solarlunar.solar2lunar(year, month, day);
  const dayGanji = lunarDate.gzDay;
  const dayGanHan = dayGanji.charAt(0);
  const dayGanKor = hanToKor(dayGanHan);

  const yearGanji = lunarDate.gzYear;
  const monthGanji = lunarDate.gzMonth;

  const isDST = isDSTKorea(year, month, day);

  const timeIndex = getTimeIndexByHourMinute(hour, minute);

  console.log(`일간(일주) 천간: ${dayGanKor}`);
  console.log(`DST 여부: ${isDST}`);
  console.log(`계산된 시지 인덱스(timeIndex): ${timeIndex}`);

  const timeGanKor = timeGanTable[dayGanKor]?.[timeIndex] || '오류';
  console.log(`timeGanTable[${dayGanKor}][${timeIndex}]: ${timeGanKor}`);

  const timeGanHan = korToHanStem[timeGanKor] || '?';
  const timeJiHan = hanEarthlyBranches[timeIndex];
  const timeGanji = timeGanHan + timeJiHan;

  console.log(`최종 시주 간지: ${timeGanji}`);

  return {
    year: yearGanji,
    month: monthGanji,
    day: dayGanji,
    time: timeGanji
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
const birthDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`);
console.log('birthDate (toISOString):', birthDate.toISOString());
console.log('birthDate (local time):', birthDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
console.log('birthDate.getFullYear():', birthDate.getFullYear());


const jeolipDate = getJeolipDate(year, month);
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
