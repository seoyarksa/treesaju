// solarTermCalculator.js
import { julian, solar, base } from 'astronomia'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)



export function getAccurateSolarLongitude(T) {
  // T: J2000 세기 단위 (Julian Century)
  // solar.trueLongitude(T) 반환값: { lon: number, lat: number }
  return solar.trueLongitude(T).lon;
}

// 기존 MONTH_TO_SOLAR_TERM과 getSolarTermDate 그대로 유지
const SOLAR_TERMS = [
  ['입춘', 315], ['우수', 330], ['경칩', 345], ['춘분', 0],
  ['청명', 15], ['곡우', 30], ['입하', 45], ['소만', 60],
  ['망종', 75], ['하지', 90], ['소서', 105], ['대서', 120],
  ['입추', 135], ['처서', 150], ['백로', 165], ['추분', 180],
  ['한로', 195], ['상강', 210], ['입동', 225], ['소설', 240],
  ['대설', 255], ['동지', 270], ['소한', 285], ['대한', 300]
]

/**
 * 정밀 apparent longitude (고정밀 황경)
 * VSOP87 기반, 단위: radians
 */
export function findSolarTermDate(year, targetDeg) {
  const targetRad = targetDeg * Math.PI / 180
  let startJD = julian.CalendarGregorianToJD(year, 1, 1)
  let endJD = julian.CalendarGregorianToJD(year, 12, 31)

  const tolerance = 1e-8
  const maxIterations = 50
  let iteration = 0

  while (iteration < maxIterations) {
    const midJD = (startJD + endJD) / 2
    const T = base.J2000Century(midJD)

    const lon = getAccurateSolarLongitude(T) // ⬅ 정밀 계산
    let diff = lon - targetRad

    if (diff < -Math.PI) diff += 2 * Math.PI
    if (diff > Math.PI) diff -= 2 * Math.PI

    if (Math.abs(diff) < tolerance) {
      return julian.JDToDate(midJD)
    }

    if (diff > 0) {
      endJD = midJD
    } else {
      startJD = midJD
    }

    iteration++
  }

  return julian.JDToDate((startJD + endJD) / 2)
}

/**
 * 특정 연도의 절기 일자들을 ISO 문자열로 반환
 * @param {number} year
 * @returns {Array<{ name: string, date: string }>}
 */
export function getSolarTermDates(year) {
  return SOLAR_TERMS.map(([name, longitude]) => {
    const dateObj = findSolarTermDate(year, longitude);
    if (!dateObj || isNaN(new Date(dateObj))) {
      console.warn(`⚠️ 절기 계산 실패: ${year}, ${name} (${longitude})`);
      return null; // 혹은 { name, date: null }
    }
    const date = dayjs(dateObj).toISOString();
    return { name, date };
  }).filter(Boolean); // null 제거
}


/**
 * 단일 절기명으로 절기 날짜를 반환
 * @param {number} year
 * @param {string} termName
 * @returns {{ name: string, date: string }|undefined}
 */
export function getSolarTermDate(year, termName) {
  const allTerms = getSolarTermDates(year)
  return allTerms.find(term => term.name === termName)
}

export const MONTH_TO_SOLAR_TERM = {
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
 * 정확한 절기 판단 함수 (한국 표준시 기준)
 * @param {Date} date - 년월일시 포함 Date 객체
 * @returns {Date} - 적용 절기의 절입일시 (Date 객체)
 */




export function getJeolipDate(yearOrDate, month, day, hour = 0, minute = 0) {
  let year;

  // Date 객체가 들어온 경우
  if (yearOrDate instanceof Date) {
    year = yearOrDate.getFullYear();
    month = yearOrDate.getMonth() + 1;
    day = yearOrDate.getDate();
    hour = yearOrDate.getHours();
    minute = yearOrDate.getMinutes();
  } else if (
    typeof yearOrDate === "number" &&
    typeof month === "number" &&
    typeof day === "number"
  ) {
    // 숫자(year, month, day[, hour, minute])가 들어온 경우
    year = yearOrDate;
    // month, day, hour, minute 그대로 사용
  } else {
    throw new Error(
      `getJeolipDate: 잘못된 입력 형식입니다. Date 또는 (year, month, day[, hour, minute]) 형식을 사용하세요.`
    );
  }

  console.log("🔧 [getJeolipDate] 입력:", {
    year,
    month,
    day,
    hour,
    minute,
  });

  // 이하 로직은 그대로


  const thisMonthTermName = MONTH_TO_SOLAR_TERM[month];
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevTermName = MONTH_TO_SOLAR_TERM[prevMonth];

  console.log('📛 thisMonthTermName:', thisMonthTermName, 'prevTermName:', prevTermName);

  // 두 후보 절기 가져오기
  const thisMonthTerm = getSolarTermDate(year, thisMonthTermName);
  const prevTerm = getSolarTermDate(prevYear, prevTermName);

const current = dayjs.tz(
  `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00`,
  'Asia/Seoul'
);

const thisMonthTermKST = dayjs(thisMonthTerm.date).tz('Asia/Seoul');


// ✅ 출생시각 >= 절입시각이면 이번 절기, 아니면 이전 절기
const thisTermName = current.isBefore(thisMonthTermKST)
  ? prevTermName
  : thisMonthTermName;

const thisTermYear = current.isBefore(thisMonthTermKST) ? prevYear : year;
const thisTerm = getSolarTermDate(thisTermYear, thisTermName);


  console.log('🎯 확정 thisTermName:', thisTermName);
  console.log('🎯 thisTerm:', {
    name: thisTerm.name,
    dateKST: dayjs(thisTerm.date).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
  });

  if (!thisTerm || !thisTerm.date || !prevTerm || !prevTerm.date) {
    console.error('❌ [getJeolipDate] 절기 정보가 유효하지 않음');
    throw new Error('절기 데이터를 찾을 수 없습니다.');
  }

  // nextTerm 추가
  const termNames = Object.values(MONTH_TO_SOLAR_TERM);
  const thisIndex = termNames.indexOf(thisTermName);
  const nextTermName = termNames[(thisIndex + 1) % termNames.length];
  const nextYear = month === 12 ? year + 1 : year;
  const nextTerm = getSolarTermDate(nextYear, nextTermName);

  const thisTermKST = dayjs(thisTerm.date).tz('Asia/Seoul');
  console.log('⏱ current:', current.format(), 'thisTermKST:', thisTermKST.format());

// 항상 현재 절기의 절입시각을 반환
const result = new Date(thisTerm.date);
  // 속성 추가
  result.thisTerm = thisTerm;
  result.nextTerm = nextTerm;

  console.log('✅ 최종 반환:', result);
  return result;
}


