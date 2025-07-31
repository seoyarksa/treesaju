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
    const dateObj = findSolarTermDate(year, longitude)
    const date = dayjs(dateObj).toISOString()
    return { name, date }
  })
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
 * 정확한 절기 판단 함수 (한국 표준시 기준)
 * @param {Date} date - 년월일시 포함 Date 객체
 * @returns {Date} - 적용 절기의 절입일시 (Date 객체)
 */
export function getJeolipDate(year, month) {
  console.log('🔧 [getJeolipDate] 입력:', { year, month });

  const thisTermName = MONTH_TO_SOLAR_TERM[month];
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevTermName = MONTH_TO_SOLAR_TERM[prevMonth];

  console.log('📛 thisTermName:', thisTermName, 'prevTermName:', prevTermName);

  const thisTerm = getSolarTermDate(year, thisTermName);
  const prevTerm = getSolarTermDate(prevYear, prevTermName);

  console.log('☀️ thisTerm:', {
    name: thisTerm.name,
    dateKST: dayjs(thisTerm.date).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
  });
  console.log('☀️ prevTerm:', {
    name: prevTerm.name,
    dateKST: dayjs(prevTerm.date).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
  });

  const current = dayjs(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+09:00`).tz('Asia/Seoul');
  const thisTermKST = dayjs(thisTerm.date).tz('Asia/Seoul');

  console.log('⏱ current:', current.format(), 'thisTermKST:', thisTermKST.format());

  const result = current.isBefore(thisTermKST) ? new Date(prevTerm.date) : new Date(thisTerm.date);
  console.log('✅ 최종 반환:', result);

  return result;
}
