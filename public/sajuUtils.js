// sajuUtils.js
//함수종류
//convertKorToHanStem, convertKorToHanBranch, convertHanToKorStem, normalizeBranch, 
// isYangStem, getDaYunDirection, generateDaYunStems, getTenGod, colorize, splitGanji, 
// getThreeLinesFromArray, generateDaYun, getGanjiByYear,
// generateYearlyGanjiSeries2, generateDaeyunBy60Gapja, getStartMonthBySewoonStem, 
// calculateSewonYear, findStartMonthIndex, generateMonthlyGanjiSeriesByGanji, getDangryeong,
//getSaryeong,



import { 
         saryeongMap, elementMap,jijielementMap,
         DANGRYEONGSHIK_MAP,
         jijiToSibganMap,
         YANG_GAN, YIN_GAN,
         firstHeesinMap,
        HEESIN_GISIN_COMBINED, 
        HEESIN_BY_DANGRYEONG_POSITION, 
        GISIN_BY_DANGRYEONG_POSITION,
        tenGodMap, elementToStems, HanhiddenStemsMap,산업분류Map,jijiToSibganMap2,
        tenGodMapKor, 간합MAP, ganRootMap, 
        SARYEONGSHIK_MAP_WITH_ROLE, SAMHAP_SUPPORT,jijiToSibganMap3,형충회합Map,
        johuBasis, johuMap, johuAdjustMap2,johuMeaning,태과불급map, 특수태과불급map, SANGSAENG_MAP, 
        SANGGEUK_MAP, SANGSAENG_REVERSE, 방합Map, conditionRules
        } from './constants.js';
import { elementColors,arrangeByPosition} from './renderUtils.js';



// sajuUtils.js
const stemOrder = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const branchOrder = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
// 서버에서 절기 날짜 받아오는 함수
export async function getJeolipDateFromAPI(year, month, day) {
  const baseUrl = window.location.origin;
  const res = await fetch(`${baseUrl}/api/jeolip?year=${year}&month=${month}&day=${day}`);
  if (!res.ok) {
    throw new Error(`API 요청 실패: ${res.status}`);
  }
  const data = await res.json();
  //console.log("getJeolipDateFromAPI response:", data);

  // 로컬: data.date, 서버: data.jeolipDate 대응
  return new Date(data.jeolipDate || data.date);
}


const yangStems = ['갑', '병', '무', '경', '임'];

// 천간한자 → 한글
export const hanToKorStem = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기',
  '庚': '경', '辛': '신', '壬': '임', '癸': '계'
};
// 지지한자 → 한글
const hanToKorBranch = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘',
  '辰': '진', '巳': '사', '午': '오', '未': '미',
  '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

// 천간한글 → 한자
const korToHanStem = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己',
  '경': '庚', '신': '辛', '임': '壬', '계': '癸'
};

export function convertKorToHanStem(kor) {
  return korToHanStem[kor] || kor;
}

// 천간한글 → 한자
export function convertKorToHanBranch(kor) {
  
  const korToHanBranch = {
    '자': '子', '축': '丑', '인': '寅', '묘': '卯',
    '진': '辰', '사': '巳', '오': '午', '미': '未',
    '신': '申', '유': '酉', '술': '戌', '해': '亥'
  };
  return korToHanBranch[kor] || kor;
}

export function convertHanToKorStem(han) {
  return hanToKorStem[han] || han;
}



export function getCurrentDaeyunIndexFromStartAge(correctedStartAge, inputBirthDate, inputDecimalYear) {
  let currentDecimalYear = inputDecimalYear;

  // decimalYear가 주어지지 않았으면 오늘 날짜 기준으로 계산
  if (typeof currentDecimalYear !== 'number' || isNaN(currentDecimalYear)) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    currentDecimalYear = year + (month - 1) / 12 + (day / 30) / 12;
  }

  // 생일 정보가 누락되면 종료
  if (!inputBirthDate || !inputBirthDate.year || !inputBirthDate.month || !inputBirthDate.day) {
    console.warn("생년월일 정보가 필요합니다.");
    return 0;
  }

  // 현재 나이(소수점 포함)를 계산
  const birthDecimalYear =
    inputBirthDate.year +
    (inputBirthDate.month - 1) / 12 +
    (inputBirthDate.day / 30) / 12;

  const currentAge = currentDecimalYear - birthDecimalYear;

  if (currentAge < correctedStartAge) return 0; // 월주

  const index = Math.floor((currentAge - correctedStartAge) / 10) + 1; // 월주 이후부터 1대운
  return index;
}




// 지장간 정의
export const hiddenStemsMap = {
  '자': ['임','계'],
  '축': ['계', '신', '기'],
  '인': ['무', '병', '갑'],
  '묘': ['갑', '을'],
  '진': ['을', '계', '무'],
  '사': ['무', '경', '병'],
  '오': ['병', '기', '정'],
  '미': ['정', '을', '기'],
  '신': ['무', '임', '경'],
  '유': ['경', '신'],
  '술': ['신', '정', '무'],
  '해': ['무', '갑', '임']
};


export function normalizeBranch(branch) {
  return hanToKorBranch[branch] || branch;
}

// 천간의 음양 여부 판단 (양간이면 true)
export function isYangStem(stemKor) {
  const yangStems = ['甲', '丙', '戊', '庚', '壬'];
  return yangStems.includes(stemKor);
}

// 대운 방향 결정 함수: 성별 + 년간(한글) 기준
export function getDaYunDirection(gender, yearStemKor) {
  const isYang = yangStems.includes(yearStemKor);
  return (gender === 'male' && isYang) || (gender === 'female' && !isYang)
    ? 1
    : -1;
}


//육신함수
export function getTenGod(dayStemKor, targetStemKor) {
  const korDayStem = convertHanToKorStem(dayStemKor);
  const korTargetStem = convertHanToKorStem(targetStemKor);

  return tenGodMapKor[korDayStem]?.[korTargetStem] || '';
}

// 색상 강조 함수
export function colorize(char, size = 'inherit') {
  const color = elementColors[char] || 'black';
  return `<span style="color: ${color}; font-size: ${size}">${char}</span>`;
}
// 간지 분리 함수
export function splitGanji(ganji) {
  return {
    gan: ganji.charAt(0),
    ji: ganji.charAt(1)
  };
}
// 지장간 3줄 변환 함수
export function getThreeLinesFromArray(arr) {
  const lines = ['', '', ''];
  if (arr.length === 3) {
    lines[0] = arr[0];
    lines[1] = arr[1];
    lines[2] = arr[2];
  } else if (arr.length === 2) {
    lines[0] = arr[0];
    lines[2] = arr[1];
  } else if (arr.length === 1) {
    lines[1] = arr[0];
  }
  return lines.map(convertKorToHanStem);
}




//대운 천간배열생성
export function generateDaYunStems(startGan, direction, length = 10) {
  const startIndex = stemOrder.indexOf(startGan);
  if (startIndex === -1) return [];
  const result = [];
  for (let i = 0; i < length; i++) {
    const idx = (startIndex + direction * i + 10) % 10;
    result.push(stemOrder[idx]);
  }
  return result;
}
// 대운 배열 생성
export function generateDaYun(startIndex, direction, length = 10) {
  const result = [];
  for (let i = 0; i < length; i++) {
    const idx = (startIndex + direction * i + 12) % 12;
    result.push(branchOrder[idx]);
  }
  return result;
}


export function getGanjiByYear(year) {
  const baseYear = 1984; // 기준: 갑자년
  const baseIndex = 0;   // 갑자 = index 0

  const offset = year - baseYear;
  const index = (baseIndex + offset + 60) % 60;

  const stem = stemOrder[index % 10];
  const branch = branchOrder[index % 12];

  return { stem, branch };
}


//사주쪽 세운넣기
export function generateYearlyGanjiSeriesFixed(startYear) {
  startYear = Math.floor(startYear);
  const result = [];

  for (let i = 0; i < 10; i++) {
    const year = startYear + i;
    const { stem, branch } = getGanjiByYear(year);
    result.push({ year, stem, branch });
  }

  return result; // ✅ 반드시 배열 반환
}




export function generateYearlyGanjiSeries2(startYear) {
  startYear = Math.floor(startYear); // 소숫점 버림
  const yearlyStems = [];
  const yearlyBranches = [];

  for (let i = 0; i < 10; i++) {
    const year = startYear + i; // 최신 연도부터 과거 순으로
    const { stem, branch } = getGanjiByYear(year);
    yearlyStems.push(stem);
    yearlyBranches.push(branch);
  }

  return { yearlyStems, yearlyBranches };
}


export function generateDaeyunBy60Gapja(startStemKor, startBranchKor, daYunDirection, count = 10) {
  const ganji60 = [];
  for (let i = 0; i < 60; i++) {
const stem = convertHanToKorStem(stemOrder[i % 10]);  // 예: '丙' → '병'
const branch = normalizeBranch(branchOrder[i % 12]);  // 예: '寅' → '인'
ganji60.push(stem + branch); // '병인'
  }

  const startGanji = startStemKor + startBranchKor;
  const startIndex = ganji60.indexOf(startGanji);

  if (startIndex === -1) {
    console.error('⚠️ 시작 간지를 60갑자에서 찾을 수 없음:', startGanji);
    return [];
  }

  const result = [];

  for (let i = 0; i < count; i++) {
    const idx = (startIndex + daYunDirection * i + 60) % 60;
    const ganji = ganji60[idx];

    const stemHan = ganji[0];  // 천간 (한자)
    const branchHan = ganji[1]; // 지지 (한자)

    result.push({
      stem: convertHanToKorStem(stemHan),      // 한글 천간
      branch: normalizeBranch(branchHan)       // 한글 지지
    });
  }

  return result; // ← 쌍 배열
}

export function getStartMonthBySewoonStem(sewoonStem) {
  const map = {
    '갑': { stem: '乙', branch: '丑' }, '甲': { stem: '乙', branch: '丑' },
    '기': { stem: '乙', branch: '丑' }, '己': { stem: '乙', branch: '丑' },
    '을': { stem: '丁', branch: '丑' }, '乙': { stem: '丁', branch: '丑' },
    '경': { stem: '丁', branch: '丑' }, '庚': { stem: '丁', branch: '丑' },
    '병': { stem: '己', branch: '丑' }, '丙': { stem: '己', branch: '丑' },
    '신': { stem: '己', branch: '丑' }, '辛': { stem: '己', branch: '丑' },
    '정': { stem: '辛', branch: '丑' }, '丁': { stem: '辛', branch: '丑' },
    '임': { stem: '辛', branch: '丑' }, '壬': { stem: '辛', branch: '丑' },
    '무': { stem: '癸', branch: '丑' }, '戊': { stem: '癸', branch: '丑' },
    '계': { stem: '癸', branch: '丑' }, '癸': { stem: '癸', branch: '丑' },
  };
  return map[sewoonStem] || { stem: '甲', branch: '子' }; // 기본값
}



export function calculateSewonYear(birthYear, birthMonth, birthDay, daeyunAge) {
  // ✅ 기본 Date 객체 사용
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

  // 1) 정수부 = 년
  const years = Math.floor(daeyunAge);

  // 2) 소수부 → 월 환산 (12개월 중 10분율)
  const decimal = daeyunAge - years;
  const monthsFloat = (decimal * 12) / 10;
  const months = Math.floor(monthsFloat);

  // 3) 남은 소수 → 일 환산
  const days = Math.round((monthsFloat - months) * 30);

  // ✅ 실제 세운 시작 "날짜" → Date로 직접 더하기
  const sewonDate = new Date(birthDate);
  sewonDate.setFullYear(sewonDate.getFullYear() + years);
  sewonDate.setMonth(sewonDate.getMonth() + months);
  sewonDate.setDate(sewonDate.getDate() + days);

  // ✅ 세운 년도를 소숫점(년.분수)으로 변환
  const year = sewonDate.getFullYear();     // 숫자
  const monthFraction = sewonDate.getMonth() / 12; 
  const dayFraction = (sewonDate.getDate() / 30) / 12;

  const sewonYear = year + monthFraction + dayFraction;

  return parseFloat(sewonYear.toFixed(2)); // 소숫점 2자리로 고정
}


export function findStartMonthIndex(stems, branches, targetStem, targetBranch) {
  for (let i = 0; i < 12; i++) {
    if (stems[i] === targetStem && branches[i] === targetBranch) {
      return i;
    }
  }
  return 0;
}

// 월운: 시작 간지 기준으로 12개 생성
export function generateMonthlyGanjiSeriesByGanji(startStem, startBranch) {
  const monthlyStems = [];
  const monthlyBranches = [];

  const startStemIndex = stemOrder.indexOf(startStem);
  const startBranchIndex = branchOrder.indexOf(startBranch);

  for (let i = 11; i >= 0; i--) {
    monthlyStems.push(stemOrder[(startStemIndex + i) % 10]);
    monthlyBranches.push(branchOrder[(startBranchIndex + i) % 12]);
  }

  return { monthlyStems, monthlyBranches };
}



// 1) 상수: dangryeongMap, solarTerms, isBefore 함수 (파일 상단이나 중간 어디든 가능)

export const dangryeongMap = {
  '子': ['壬', '癸'],  // 전반:壬, 후반:癸
  '丑': ['癸', '癸'],  // 절기 구분 없으니 동일하게 두 개 넣어도 무방
  '寅': ['甲', '甲'],
  '卯': ['甲', '乙'],
  '辰': ['乙', '乙'],
  '巳': ['丙', '丙'],
  '午': ['丙', '丁'],
  '未': ['丁', '丁'],
  '申': ['庚', '庚'],
  '酉': ['庚', '辛'],
  '戌': ['辛', '辛'],
  '亥': ['壬', '壬']
};

export const solarTerms = {
  dongji: { month: 12, day: 22 },
  chunbun: { month: 3, day: 21 },
  haji: { month: 6, day: 22 },
  chubun: { month: 9, day: 24 }
};

export function isBefore(month, day, term) {
  if (month < term.month) return true;
  if (month === term.month && day < term.day) return true;
  return false;
}

// 2) 당령 구하는 함수도 추가

export function getDangryeong() {
  const monthJi = window.monthJi;
  const daeyunAge = window.daeyunAge;
  const daYunDirection = window.daYunDirection;

  const d = dangryeongMap[monthJi];
  if (!d) {
    console.warn('당령을 찾을 수 없는 월지:', monthJi);
    return '';
  }
  if (!Array.isArray(d)) {
    // 배열이 아니면 둘 다 같은 값으로 간주
    return d;
  }

  const threshold = 15;
  const value = daeyunAge * 3;

  let isSecondHalf;

  if (daYunDirection === -1) { // 역행
    isSecondHalf = value >= threshold;  // 역행이고 15 이상이면 후반
  } else if (daYunDirection === 1) {  // 순행
    isSecondHalf = value < threshold;   // 순행이고 15 미만이면 후반
  } else {
    console.warn('알 수 없는 대운 방향:', daYunDirection);
    return '';
  }

  return isSecondHalf ? d[1] : d[0];
}



export function getSaryeong(monthJi, daeyunAge, direction) {
  //console.log('[getSaryeong] monthJi:', monthJi, 'daeyunAge:', daeyunAge, 'direction:', window.daYunDirection);
  if (direction === undefined) {
    throw new Error("⚠️ 대운 방향(direction)이 정의되지 않았습니다.");
  }


  if (!saryeongMap[monthJi]) return null;

  const [early, late] = saryeongMap[monthJi];
  const scaledValue = daeyunAge * 3;
  //console.log('[getSaryeong] scaledValue:', scaledValue);

  if (direction === -1) {
    return scaledValue >= 15 ? late : early;
  } else {
    return scaledValue >= 15 ? early : late;
  }

}

export function getdangryeongshik(dangryeong) {
  return DANGRYEONGSHIK_MAP[dangryeong] || [];
}


// 천간 배열에 대해 사주 천간, 사주 지지와 매핑 정보 생성
// HEESIN_GISIN_COMBINED는 위에서 만든 상수맵

// 1. 당령에 따른 전체 천간 리스트 (중복 포함, 1~5 위치순)
export function getDangryeongCheongans(dangryeong) {
  const map = HEESIN_GISIN_COMBINED[dangryeong];
  if (!map) return [];

  const result = [];
  for (let i = 1; i <= 5; i++) {
    const cheongans = map[i];
    if (Array.isArray(cheongans)) {
      result.push(...cheongans);
    }
  }

  return result;
}



//사령식 출력
 export function getSaryeongshikHtml(monthJi, saryeong) {
  const monthData = SARYEONGSHIK_MAP_WITH_ROLE[monthJi];
  if (!monthData?.formula?.[saryeong]) return '사령식 정보 없음';

  const formula = monthData.formula[saryeong];

  const roleClassMap = {
    사령: 'saryeong-char',
    보좌: 'bojo-char',
    일반: 'normal-char',
  };

  const styled = formula
    .map(({ char, role }) => {
      const className = roleClassMap[role] || 'normal-char';
      return `<span class="${className}">${char}</span>`;
    })
    .join('');

  return `<span class="explainable" data-group="terms" data-term="">사령식</span>: <span class="explainable" data-group="dang" data-term="">${styled}</span>`;
}




//3.희기신추출리스트
// 1) 천간 희기신 추출 함수
export function extractCheonganHeesinGisin() {
  const dangryeong = window.trueDangryeongChar;
  console.group("▶ extractCheonganHeesinGisin 실행");
  console.log("입력 dangryeong:", dangryeong);
  console.log("전역 sajuStemList:", window.sajuStemList);

  if (!dangryeong) {
    console.warn("⚠️ 전역 trueDangryeongChar 없음");
    return { cheonganHeesinList: [], cheonganGisinList: [] };
  }

  const heesinMap = HEESIN_BY_DANGRYEONG_POSITION[dangryeong] || {};
  const gisinMap  = GISIN_BY_DANGRYEONG_POSITION[dangryeong] || {};

  // 희신 후보
  const heesinCharPosMap = {};
  Object.entries(heesinMap).forEach(([pos, char]) => {
    if (!heesinCharPosMap[char]) heesinCharPosMap[char] = [];
    heesinCharPosMap[char].push(Number(pos));
  });

  // 기신 후보
  const gisinCharPosMap = {};
  Object.entries(gisinMap).forEach(([pos, chars]) => {
    chars.forEach(char => {
      if (!gisinCharPosMap[char]) gisinCharPosMap[char] = [];
      gisinCharPosMap[char].push(Number(pos));
    });
  });

  // 사주 천간에 포함된 희신
  const cheonganHeesinList = Object.entries(heesinCharPosMap)
    .filter(([char]) => window.sajuStemList.some(x => x.value === char))
    .map(([char, posArr]) => ({ char, pos: posArr }));

  // 사주 천간에 포함된 기신
  const rawGisinList = Object.entries(gisinCharPosMap)
    .filter(([char]) => window.sajuStemList.some(x => x.value === char))
    .map(([char, posArr]) => ({ char, pos: posArr }));

  // 희신 문자 제거
  const heesinChars = new Set(cheonganHeesinList.map(h => h.char));
  const cheonganGisinList = rawGisinList.filter(({ char }) => !heesinChars.has(char));

  console.log("최종 cheonganHeesinList:", cheonganHeesinList);
  console.log("최종 cheonganGisinList:", cheonganGisinList);
  console.groupEnd();

  // ✅ 전역에 등록
  window.cheonganHeesinList = cheonganHeesinList;
  window.cheonganGisinList = cheonganGisinList;

  return {
    cheonganHeesinList,
    cheonganGisinList
  };
}






export function extractJijiSibgansWithMiddleInfo() {
  const sajuJijiArray = window.sajuJijiArray;
  if (!Array.isArray(sajuJijiArray)) {
    throw new Error("sajuJijiArray는 배열이어야 합니다.");
  }
  //console.log('[DEBUG] extractJijiSibgansWithMiddleInfo 호출됨, 입력값:', sajuJijiArray);
  const sibganList = [];

  sajuJijiArray
    .filter(jijiChar => typeof jijiChar === 'string' && jijiChar.trim() !== '')
    .forEach(jijiChar => {
      const sibgans = jijiToSibganMap[jijiChar] || [];

      sibgans.forEach((item, index) => {
        if (item && item.char) {
          sibganList.push({
            char: item.char,
            isMiddle: index === 1,
          });
        }
      });
    });

  //console.log('[DEBUG] 지지희기신 추출전 지장간 리스트:', sibganList);
  return sibganList;
}







//사주지지천간리스트 뽑기
export function extractJijiHeesinGisin(dangryeong) {
  const sajuJijiArray = window.sajuJijiArray;
  if (!Array.isArray(sajuJijiArray)) {
    throw new Error("sajuJijiArray는 배열이어야 합니다.");
  }

  const heesinMap = HEESIN_BY_DANGRYEONG_POSITION[dangryeong] || {};
  const gisinMap  = GISIN_BY_DANGRYEONG_POSITION[dangryeong] || {};

  const flatSibganList = extractJijiSibgansWithMiddleInfo(sajuJijiArray);

  const jijiHeesinList = [];
  const jijiGisinList = [];

  // 희신 추출
  Object.entries(heesinMap).forEach(([posStr, char]) => {
    const pos = Number(posStr);
    flatSibganList.forEach(item => {
      if (item.char === char) {
        const alreadyExists = jijiHeesinList.some(
          h => h.char === char && h.pos === pos && h.isMiddle === item.isMiddle
        );
        if (!alreadyExists) {
          jijiHeesinList.push({ char, pos, isMiddle: item.isMiddle });
        }
      }
    });
  });

  // 기신 추출
  Object.entries(gisinMap).forEach(([posStr, charList]) => {
    const pos = Number(posStr);
    charList.forEach(char => {
      flatSibganList.forEach(item => {
        const isAlreadyHeesin = jijiHeesinList.some(
          h => h.char === char && h.isMiddle === item.isMiddle
        );
        const alreadyExists = jijiGisinList.some(
          g => g.char === char && g.pos === pos && g.isMiddle === item.isMiddle
        );
        if (item.char === char && !isAlreadyHeesin && !alreadyExists) {
          jijiGisinList.push({ char, pos, isMiddle: item.isMiddle });
        }
      });
    });
  });

  // ✅ 전역 등록
  window.jijiHeesinList = jijiHeesinList;
  window.jijiGisinList  = jijiGisinList;

  return {
    jijiHeesinList,
    jijiGisinList
  };
}




/////조후용신파트//////////////////////

export function extractSajuGanList() {
  const saju = window.saju;

  if (!saju) {
    console.warn("⚠️ window.saju 가 아직 준비되지 않았습니다.");
    return null;
  }

  const { yearGan, monthGan, dayGan, hourGan, yearBranch, monthBranch, dayBranch, hourBranch } = saju;

  console.log("🟢 extractSajuGanList called with saju:", saju);

  // 1) 천간
  const ganListFromCheongan = [yearGan, monthGan, dayGan, hourGan].map(g => ({
    gan: g,
    tag: "天",
    isMiddle: false
  }));
  //console.log("🔹 ganListFromCheongan:", ganListFromCheongan);

  // 2) 지지 → 지장간
  const ganListFromJiji = [yearBranch, monthBranch, dayBranch, hourBranch]
    .flatMap(j => {
   //   console.log("👉 처리중인 지지:", j, " → 매핑:", jijiToSibganMap[j]);
      return (jijiToSibganMap[j] || [])
        .filter(obj => obj.char)
        .map(obj => ({
          gan: obj.char,
          tag: "地",
          isMiddle: obj.isMiddle || false
        }));
    });
//  console.log("🔹 ganListFromJiji:", ganListFromJiji);

  // 3) 합치기
  const all = [...ganListFromCheongan, ...ganListFromJiji];
 // console.log("✅ combined before sort:", all);

  // 4) 십간 순서 정렬
  all.sort((a, b) => stemOrder.indexOf(a.gan) - stemOrder.indexOf(b.gan));
 // console.log("✅ final sorted:", all);

  return all;
}

//중복 천간 *숫자형
// 중복 천간 *숫자형
//중복 천간 *숫자형
function formatGanList(ganList, tag) {
  const countMap = new Map();

  ganList.filter(m => m.tag === tag).forEach(m => {
    const mark = m.isMiddle ? "(中)" : "";
    const key = `${m.gan}${mark}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });

  return Array.from(countMap.entries())
    .map(([key, count]) => {
      return count > 1 
        ? `${key}<span style="color:blue;">*${count}</span>` 
        : key;
    })
    .join(", ");
}


// 四孟月 : 월지와 당령 매핑
const dangryeongToMonth = {
  "甲": "寅", // 寅月
  "庚": "申", // 申月
  "丙": "巳", // 巳月
  "壬": "亥"  // 亥月
};

// ✅ 최종 후보군 구하는 함수
// ✅ 최종 후보군 구하는 함수 (전역 기반)
function getJohuList() {
  const saju = window.saju;
  if (!saju) {
    console.warn("⚠️ window.saju 가 아직 준비되지 않았습니다.");
    return "";
  }

  const monthBranch = saju.monthBranch;
  let tagList = Array.isArray(saju.johuTags) ? saju.johuTags : [saju.johuTags];
  const dangryeong = saju.dangryeong;

  // 四孟月 → 당령과 월지가 일치하면 당령 태그도 추가
  if (dangryeong && dangryeongToMonth[dangryeong] === monthBranch) {
    tagList = [...new Set([...tagList, dangryeong])];
  }

  // 보정맵 우선 적용
  if (johuAdjustMap2[monthBranch]) {
    for (const tag of tagList) {
      if (johuAdjustMap2[monthBranch][tag]) {
        return johuAdjustMap2[monthBranch][tag];
      }
    }
  }

  // 기본 맵 적용
  return johuMap[monthBranch] || "";
}






/// 조후용신 나열
export function renderJohuCell() {
 // console.group("🟢 renderJohuCell 실행");

  const saju = window.saju;
  const daewoonSewoonStemList    = window.daewoonSewoonStemList || [];
  const daewoonSewoonBranchList1 = window.daewoonSewoonBranchList1 || [];

 // console.log("▶ saju:", saju);
 // console.log("▶ 선택된 대운:", window.selectedDaewoon);
  //console.log("▶ 선택된 세운:", window.selectedSewoon);
 // console.log("▶ daewoonSewoonStemList:", daewoonSewoonStemList);
 // console.log("▶ daewoonSewoonBranchList1:", daewoonSewoonBranchList1);

  const ganList = extractSajuGanList(saju);
 // console.log("▶ 추출된 ganList:", ganList);

  // ✅ 적용타입 계산:조화판단
  const applyType = getJohuApplyType(saju);
 // console.log("▶ 조후용신 적용 타입:", applyType);

  // 1행: 천간 나열
  const rowTop = `  <div style="text-align:left; margin:8px 0; color:#0077cc;">
  04] <span class="explainable" data-group="terms" data-term="">조후용신</span>과 역할
</div><tr><td colspan="9" style="text-align:left; padding:4px; background:#FFDDDD;">` 
    + `사주(천간): ` 
    + formatGanList(ganList, "天")
    + `</td></tr>`;

  // 2행: 지지 나열
  const rowMiddle = `<tr><td colspan="9" style="text-align:left; padding:4px; background:#FFDDDD;">`
    + `사주(지지): `
    + formatGanList(ganList, "地")
    + `</td></tr>`;

  // ✅ 조후 후보군 구하기 (특수월 보정 반영)
  let johuStr = "";
  let tagList = Array.isArray(saju.johuTags) ? [...saju.johuTags] : [];
  const dangryeongToMonth = { "甲": "寅", "庚": "申", "丙": "巳", "壬": "亥" };
  if (saju.dangryeong && dangryeongToMonth[saju.dangryeong] === saju.monthBranch) {
    tagList = [...new Set([...tagList, saju.dangryeong])];
  }

 // console.log("📌 조후태그 감지됨:", tagList);
 // console.log("📌 월지:", saju.monthBranch, "보정맵:", johuAdjustMap2[saju.monthBranch]);

  const conflictTags = ["금한수냉(金寒水冷)", "목다화치(木多火熾)"];
  const isSaHae = (saju.monthBranch === "巳" || saju.monthBranch === "亥");
  const multiTags = tagList.length >= 2;
  const hasConflict = tagList.some(t => conflictTags.includes(t));

  if (isSaHae && multiTags && hasConflict) {
 //   console.log("🟡 사/해월 + 다중 태그 + (금한수냉|목다화치) → 기본 조후맵 예외 적용");
    johuStr = johuMap[saju.monthBranch] || "";
  } else {
    if (tagList.length > 0) {
      const adjustMap = johuAdjustMap2[saju.monthBranch];
//      console.log("📌 보정맵 keys:", adjustMap ? Object.keys(adjustMap) : []);
      if (adjustMap) {
        for (const tag of tagList) {
//          console.log("🔍 보정 태그 검사:", tag);
          if (adjustMap[tag]) {
            johuStr = adjustMap[tag];
            console.log("✅ 보정 적용됨:", tag, "→", johuStr);
            break;
          }
        }
      }
    }
    if (!johuStr) {
      johuStr = johuMap[saju.monthBranch] || "";
      console.log("⚠️ 보정 없음, 기본 맵 적용:", johuStr);
    }
  }

  const johuChars = johuStr.split("");
  const allGans = ganList.map(m => m.gan);
  const baseGans = [
    saju.yearGan, saju.monthGan, saju.dayGan, saju.hourGan,
    saju.yearBranch, saju.monthBranch, saju.dayBranch, saju.hourBranch
  ];
//  console.log("🟢 baseGans 초기(원국):", baseGans);

  // --- 이하 행(row) 구성은 원본 그대로 ---

// 기준 행
const johuRow1 = `
  <tr>
    <td rowspan="3" 
    style="background-color:#e6f0ff;
           text-align:center;
           vertical-align:middle;
           white-space:nowrap;">
             <span class="explainable" data-group="terms" data-term="">조후<br>용신</span><br>[<span style="color:blue;">${applyType}</span>]</td>
    <td style="background-color:#fff8dc;">기준</td>
    ${johuChars.map((ch, i) => {
      const desc = johuMeaning[i] || "";
 //     console.log(`📌 기준 ${i}번째: ${ch}, 설명: ${desc}`);
      return `<td style="background-color:#fff8dc;">${ch ? `<span class="tooltip" data-desc="${desc}">${ch}</span>` : ""}</td>`;
    }).join("")}
  </tr>
`;

// 보유 행
// 2행: 보유(원국)
const johuRow2 = `
  <tr>
    <td>원국</td>
    ${johuChars.map((ch, i) => {
      if (!ch) return `<td style="color:red">X</td>`;
      const desc = johuMeaning[i] || "";
      const isOwned = baseGans.includes(ch); // 원국만 검사
      return isOwned
        ? `<td><span class="tooltip" data-desc="${desc}" style="color:blue">${ch}</span></td>`
        : `<td style="color:red">X</td>`;
    }).join("")}
  </tr>
`;

// 3행: 보유(대운·세운)
const johuRow3 = `
  <tr>
    <td>運</td>
    ${johuChars.map((ch, i) => {
      if (!ch) return `<td style="color:red">X</td>`;
      const desc = johuMeaning[i] || "";

      const daewoon = window.selectedDaewoon;
      const sewoon  = window.selectedSewoon;

      const lists = [];
      if (daewoon?.stem)   lists.push({ type: "daewoon", value: daewoon.stem });
      if (daewoon?.branch) lists.push({ type: "daewoon", value: daewoon.branch });
      if (sewoon?.stem)    lists.push({ type: "sewoon", value: sewoon.stem });
      if (sewoon?.branch)  lists.push({ type: "sewoon", value: sewoon.branch });

      const matches = lists.filter(item => item.value === ch);
      if (matches.length > 0) {
        const marker = matches.map(m =>
          m.type === "daewoon" ? "(大)" :
          m.type === "sewoon"  ? "(世)" : ""
        ).join("");
        return `<td><span class="tooltip" data-desc="${desc}" style="color:blue">${ch}${marker}</span></td>`;
      } else {
        return `<td style="color:red">X</td>`;
      }
    }).join("")}
  </tr>
`;



  const html = `
    <table style="...">
      <colgroup>
        <col style="width:50px;">
        <col style="width:60px;">
        <col style="width:auto;">
      </colgroup>
      ${rowTop}
      ${rowMiddle}
      ${johuRow1}
      ${johuRow2}
      ${johuRow3}
    </table>
    <div style="font-size:14px;margin-top:6px;">
      * 표의 조후글자(간지)를 마우스 오버(또는 클릭시) 간단한 설명을 볼 수 있습니다.
    </div>
  `;

//  console.log("▶ renderJohuCell 최종 HTML 길이:", html.length);
 // console.groupEnd();
  return html;
}

/// 조화확인
export function getJohuApplyType() {
  //console.group("🟢 getJohuApplyType 실행");

  const saju = window.saju;
  if (!saju) {
    console.warn("⚠️ window.saju 가 아직 준비되지 않았습니다.");
    console.groupEnd();
    return "無";
  }

  const { monthBranch, yearGan, monthGan, dayGan, hourGan,
          yearBranch, dayBranch, hourBranch } = saju;
 //// console.log("▶ monthBranch:", monthBranch);

  if (!monthBranch) {
    console.groupEnd();
    return "無";
  }

  const targetMap = {
    "亥子丑": "辛",
    "寅卯辰": "癸",
    "巳午未": "乙",
    "申酉戌": "丁",
  };

  let target = null;
  for (const group in targetMap) {
    if (group.includes(monthBranch)) {
      target = targetMap[group];
      break;
    }
  }
  console.log("▶ 목표 천간 target:", target);
  if (!target) {
    console.groupEnd();
    return "無";
  }

  const cheongan = [yearGan, monthGan, dayGan, hourGan];
  if (cheongan.includes(target)) {
    console.log("✅ 천간에서 발견됨:", target);
    console.groupEnd();
    return "+";
  }

  const branches = [yearBranch, monthBranch, dayBranch, hourBranch];
  for (const br of branches) {
    const sibganList = jijiToSibganMap[br] || [];
    const found = sibganList.find(obj => obj.char === target && !obj.isMiddle);
    if (found) {
      console.log("✅ 지지(지장간)에서 발견됨:", br, found);
      console.groupEnd();
      return "중";
    }
  }

  for (const br of branches) {
    const key = `${monthBranch}-${br}`;
    if (SAMHAP_SUPPORT[key]) {
      const targetFromSamhap = SAMHAP_SUPPORT[key];
      if (targetFromSamhap === target) {
        console.log("🟢 삼합 보정으로 양 판정:", key, "=>", targetFromSamhap);
        console.groupEnd();
        return "양";
      }
    }
  }

  console.log("❌ 발견 안 됨 → 음");
  console.groupEnd();
  return "-";
}




//태과불급 함수


export function calculateTaegwaBulgeup(saju) {

  const monthGanji = { 
    gan: saju.monthGan, 
    ji: saju.monthBranch 
  };
  const dangryeong = getDangryeong(monthGanji.ji, daeyunAge, daYunDirection);

 // console.log("🔥 calculateTaegwaBulgeup 실행됨", saju, dangryeong);

  if (!dangryeong) return ["해당사항 없음"];

  const rules = 태과불급map[dangryeong];
  if (!rules) return ["해당사항 없음"];

  const ganList = extractSajuGanList(saju);

  // 천간만 (순수 年月日時)
  const cheongan = ganList.filter(g => g.tag === "天");

  // 지지에서 나온 지장간 (본기+여러기, 중기 포함)
  // 지지에서 나온 지장간 (본기 + 여력기만, 중기는 제외)
const jijiList = ganList.filter(g => g.tag !== "天" && !g.isMiddle);


  const 판정결과 = [];

  // 천간별 카운트
// 천간만 갯수 세기
const countMap = {};
for (const g of cheongan) {
  countMap[g.gan] = (countMap[g.gan] || 0) + 1;
}


//  console.log("🟢 cheongan:", cheongan);
//  console.log("🟢 jijiList:", jijiList);
// console.log("🟢 countMap:", countMap);
//  console.log("🟢 dangryeong:", dangryeong);

  const ganListNoMiddle = ganList.filter(g => !g.isMiddle);

const cheonganOnly = ganListNoMiddle.filter(g => g.tag === "天");
const jijiOnly = ganListNoMiddle.filter(g => g.tag !== "天");

stemOrder.forEach(gan => {
  const cntInCheongan = cheonganOnly.filter(g => g.gan === gan).length;
  const cntInJiji = jijiOnly.filter(g => g.gan === gan).length;
  const totalCnt = cntInCheongan + cntInJiji;

// 이후 태과 판정
for (const gan in countMap) {
  const cnt = countMap[gan];
//  console.log(`▶ 태과 검사중 (천간): ${gan}, cnt=${cnt}`);
  // ... 태과 판정 로직 ...

    // ✅ 조건1-1: 천간이 3개 이상이면 무조건 태과
  if (cnt >= 3) {
    판정결과.push({ 구분: "태과", 원인: gan });
 ////   console.log(`✅ 조건1-1 태과 판정 (천간 3개 이상 무조건): ${gan}, cnt=${cnt}`);
    continue; // 추가 조건 안 보고 다음 글자로 넘어감
  }
   // ✅ 조건1-2: 지지4개 모두 같은 오행일때  무조건 태과
const branches = [
  convertKorToHanBranch(saju.yearBranch),
  convertKorToHanBranch(saju.monthBranch),
  convertKorToHanBranch(saju.dayBranch),
  convertKorToHanBranch(saju.hourBranch)
];

// 지지를 오행으로 변환
const branchElements = branches.map(b => jijielementMap[b]);


// 첫 번째 오행 기준으로 모두 같은지 검사
const allSame = branchElements.every(el => el === branchElements[0]);

if (allSame) {
  const sameElement = branchElements[0];
  const stems = elementToStems[sameElement] || [];
  stems.forEach(stem => {
    판정결과.push({ 구분: "태과", 원인: stem, source: "지지4동일" });
  });
 // console.log(`🔥 조건1-2) 지지 4개 동일: ${branches.join(",")} → ${sameElement} (${stems.join(",")}) 태과`);
} else {
 // console.log(`❌ 조건1-2 불충족: 지지 오행=${branchElements.join(",")}`);
}

//조건1-3 천간 같은 오행3개+ 월령, 삼합과 같은 오행
// ✅ 조건1-3: 천간 같은 오행 3개 이상 + 월령/삼합 오행과 같을 때
// ✅ 조건1-3: 천간 같은 오행 3개 이상 + 월령/삼합 오행과 같을 때
const cheonganElements = cheonganOnly.map(g => elementMap[g.gan]);

// 오행별 카운트
const elementCount = cheonganElements.reduce((acc, el) => {
  acc[el] = (acc[el] || 0) + 1;
  return acc;
}, {});

// 당령 오행 + 삼합 오행 세트
const supportedOhaeng = getSupportedOhaeng(saju, dangryeong);

Object.entries(elementCount).forEach(([el, count]) => {
  if (count >= 3 && supportedOhaeng.has(el)) {
    const stems = elementToStems[el] || [el]; // 오행→천간 변환
    stems.forEach(stem => {
      판정결과.push({ 구분: "태과", 원인: stem, source: "천간3+월령/삼합" });
    });
  //  console.log(
  //    `🔥 조건1-3) 천간 ${el} ${count}개 + 당령/삼합(${[...supportedOhaeng].join(",")}) → ${stems.join(",")} 태과`
  //  );
  } else {
 //   console.log(
 //     `❌ 조건1-3 불충족: ${el} ${count}개 (지원 오행=${[...supportedOhaeng].join(",")})`
//    );
  }
});


// 조건2: 천간에 2개 이상 + (당령/삼합과 같은 오행일 때)
if (cnt === 2) {
  const ganOhaeng = elementMap[gan];   // 현재 천간 → 오행
  const supportedOhaeng = getSupportedOhaeng(saju, dangryeong); // 당령+삼합 오행 Set

  // 🔎 로그: 현재 천간의 오행, 당령의 오행, 삼합 오행
 // console.log(
 //   `🔎 태과 조건2 검사: ${gan} x2, 오행=${ganOhaeng}, ` +
 //   `당령(${dangryeong}) 오행=${elementMap[dangryeong]}, ` +
 //   `지원오행=${[...supportedOhaeng].join(",")}`
 // );

  // 📌 특수월 (寅·辰·申·戌): 반드시 글자가 당령과 같아야 태과
  if (["寅", "辰", "申", "戌"].includes(saju.monthBranch)) {
    if (gan === dangryeong) {  
      판정결과.push({ 구분: "태과", 원인: gan });
    //  console.log(`✅ 태과 (특수월 동일간): ${gan}, 월지=${saju.monthBranch}, 당령=${dangryeong}`);
    } else {
    //  console.log(`❌ 태과 아님 (특수월, 오행 같아도 글자 다름): ${gan}, 월지=${saju.monthBranch}, 당령=${dangryeong}`);
    }
  }
  // 📌 일반월: 천간 오행이 당령/삼합 오행과 일치해야 태과
  else {
    if (supportedOhaeng.has(ganOhaeng)) {
      판정결과.push({ 구분: "태과", 원인: gan });
   //   console.log(`✅ 태과 판정 (조건1+당령/삼합): ${gan}, 오행=${ganOhaeng}, 당령=${dangryeong}`);
    } else {
    //  console.log(`❌ 태과 아님 (조건1 불충족): ${gan}, 오행=${ganOhaeng}, 당령=${dangryeong}`);
    }
  }
}






// 조건3: 천간 1개 + (당령 또는 삼합)일 때
if (cnt === 1) {
  const sameAsDangryeong = dangryeong === gan;
  const sameAsSamhap = isValidSamhap(saju, gan);

//  console.log(
 //   `🔍 조건3 검사: ${gan}, cnt=1, sameAsDangryeong=${sameAsDangryeong}, sameAsSamhap=${sameAsSamhap}`
 // );

  if (sameAsDangryeong || sameAsSamhap) {
    // 🔥 당령이 丙일 때 → 丁 있으면 원인=丙
    if (dangryeong === "丙" || isValidSamhap(saju, "丙")) {
    //  console.log("   👉 당령=丙 또는 삼합=丙 조건 진입");
      if (countMap["丙"] && countMap["丁"]) {
        판정결과.push({ 구분: "태과", 원인: "丙" });
      //  console.log(`🔥 태과 판정: 당령=${dangryeong}, 원인=丙 (丙+丁 모두 존재)`);
      } else {
     //   console.log(`❌ 불충족: 丙/丁 모두 없음 (countMap: 丙=${countMap["丙"]||0}, 丁=${countMap["丁"]||0})`);
      }
    }

    // 🔥 당령이 丁일 때 → 丙 있으면 원인=丁
    if (dangryeong === "丁" || isValidSamhap(saju, "丁")) {
   //   console.log("   👉 당령=丁 또는 삼합=丁 조건 진입");
      if (countMap["丙"] && countMap["丁"]) {
        판정결과.push({ 구분: "태과", 원인: "丁" });
     //   console.log(`🔥 태과 판정: 당령=${dangryeong}, 원인=丁 (丙+丁 모두 존재)`);
      } else {
    //    console.log(`❌ 불충족: 丙/丁 모두 없음 (countMap: 丙=${countMap["丙"]||0}, 丁=${countMap["丁"]||0})`);
      }
    }

    // 💧 당령이 壬일 때 → 癸 있으면 원인=壬
    if (dangryeong === "壬" || isValidSamhap(saju, "壬")) {
    //  console.log("   👉 당령=壬 또는 삼합=壬 조건 진입");
      if (countMap["壬"] && countMap["癸"]) {
        판정결과.push({ 구분: "태과", 원인: "壬" });
    //    console.log(`💧 태과 판정: 당령=${dangryeong}, 원인=壬 (壬+癸 모두 존재)`);
      } else {
     //   console.log(`❌ 불충족: 壬/癸 모두 없음 (countMap: 壬=${countMap["壬"]||0}, 癸=${countMap["癸"]||0})`);
      }
    }

    // 💧 당령이 癸일 때 → 壬 있으면 원인=癸
    if (dangryeong === "癸" || isValidSamhap(saju, "癸")) {
   //   console.log("   👉 당령=癸 또는 삼합=癸 조건 진입");
      if (countMap["壬"] && countMap["癸"]) {
        판정결과.push({ 구분: "태과", 원인: "癸" });
     //   console.log(`💧 태과 판정: 당령=${dangryeong}, 원인=癸 (癸+壬 모두 존재)`);
      } else {
     //   console.log(`❌ 불충족: 壬/癸 모두 없음 (countMap: 壬=${countMap["壬"]||0}, 癸=${countMap["癸"]||0})`);
      }
    }
  } else {
  //  console.log(`❌ 조건3 불충족: ${gan} → 당령(${dangryeong}) 또는 삼합 불일치`);
  }
}


//조건4 태과 천간,지지 합쳐서 같은 오행4 [화,수]만 해당


// ✅ 태과 전체 결과 로그 (중복 제거)
const taegwaResults = 판정결과.filter(r => r.구분 === "태과");

// Set을 이용해서 "원인" 기준으로 중복 제거
const uniqueTaegwa = Array.from(
  new Map(taegwaResults.map(item => [item.원인, item])).values()
);

if (uniqueTaegwa.length > 0) {
//  console.log("📋 최종 태과 판정 결과:", uniqueTaegwa);
} else {
//  console.log("📋 최종 태과 판정 없음");
}

}



// 2) 불급 판정 (조건1 + 조건2 통합)///////////////////////////////////////////////////////////////////


//  console.log(`🔍 불급 검사중: ${gan} (천간=${cntInCheongan}, 지지=${cntInJiji}, 총=${totalCnt})`);

  // 1-1) 불급조건1: 아예 없음
  if (totalCnt === 0) {
    판정결과.push({ 구분: "불급", 원인: gan, source: "basic" });
  //  console.log(`⚠️ 불급 판정 (조건1): ${gan} 없음 (천간+지지 전체, 중기 제외)`);
  } else {
 //   console.log(`❌ 1-1)조건1 불충족: ${gan} 총 ${totalCnt}개 존재`);
  }

// 1-2) 불급조건: 천간에 없고, 지지에만 1개 있을 때 (단, 월지 제외)
// 월지 지장간 전체 (본기 + 여력기)
const woljiGans = jijiToSibganMap3[saju.monthBranch] || [];

// 1-2) 불급조건: 천간에 없고, 지지에만 1개 있을 때 (월지 지장간 제외)
//console.log(`🔍 ${gan} 카운트 → 천간=${cntInCheongan}, 지지=${cntInJiji}, 총=${totalCnt}`);

if (
  cntInCheongan === 0 &&
  cntInJiji === 1 &&
  !woljiGans.includes(gan)   // ✅ 월지의 모든 지장간은 제외
) {
  판정결과.push({ 구분: "불급", 원인: gan, source: "onlyJiji1" });
 // console.log(`⚠️ 1-2)불급 검출: ${gan} → 천간 없음 + (월지 제외) 지지 1개`);
} else {
 // console.log(
 //   `❌ 1-2)조건 불충족: ${gan} (천간=${cntInCheongan}, 지지=${cntInJiji}, 월지=${saju.monthBranch}, 월지지장간=${woljiGans.join(",")})`
 // );
}


// 2) 불급조건: 천간에만 1개 있고, 지지에는 없음 (단, 丙·壬·戊 제외)
if (
  cntInCheongan === 1 &&
  cntInJiji === 0 &&
  !["丙", "壬", "戊"].includes(gan)   // 예외 처리
) {
 // console.log(`🔍 조건2 검사 대상: ${gan} (천간1개, 지지0개)`);

  const ganElement = elementMap[gan];  // ex) 丁 → 火
  // 母 오행 찾기: 어떤 오행이 현재 오행을 生하는가?
  const needElement = Object.keys(SANGSAENG_MAP).find(
    el => SANGSAENG_MAP[el] === ganElement
  );

  // 지지에서 母 오행 존재 여부 (양간/음간 모두 공통 사용)
  const existsMother = jijiOnly.some(j => elementMap[j.gan] === needElement);

  // 2-1) 양간 → 母 오행 없으면 불급
  if (YANG_GAN.includes(gan)) {
    if (!existsMother) {
      판정결과.push({ 구분: "불급", 원인: gan, source: "양간1" });
    //  console.log(`⚠️ 불급 (양간1): ${gan} → 母(${needElement}) 지지에 없음`);
    } else {
    //  console.log(`❌ 양간1 불충족: ${gan} → 母(${needElement}) 지지에 존재`);
    }
  }

  // 2-2) 음간 → 母 오행도 없고 삼합 지원도 없으면 불급
  else if (YIN_GAN.includes(gan)) {
    const existsSamhap = Object.entries(SAMHAP_SUPPORT).some(([pair, supportGan]) => {
      if (supportGan !== gan) return false;
      const [a, b] = pair.split("-");
      return jijiOnly.some(j => j.ji === a) && jijiOnly.some(j => j.ji === b);
    });

    if (!existsMother && !existsSamhap) {
      판정결과.push({ 구분: "불급", 원인: gan, source: "음간1" });
    ///  console.log(`⚠️ 불급 (음간1): ${gan} → 母(${needElement}) 지지 없음, 삼합 지원 없음`);
    } else {
   //   console.log(`❌ 음간1 불충족: ${gan} → 母(${needElement}) 지지 존재 or 삼합 지원`);
    }
  }
} else {
//  console.log(`❌ 조건2 불충족: ${gan} (천간=${cntInCheongan}, 지지=${cntInJiji})`);
}

});

// ✅ 전체 불급 리스트 로그
console.log("📋 최종 불급 판정 결과:", 판정결과.filter(r => r.구분 === "불급"));

 const bulgeup = 판정결과
    .filter(r => r.구분 === "불급")
    .map(r => r.원인);
// 3) 당령별 특수 보강[추가 태과불급과 투간적용]
// 당령별 특수 규칙
// 🔹 당령별 특수 보강
// 3) 당령별 특수 보강
const multiInfo = extractMultiInfo(saju, ganList, countMap);
const multiListCheck = multiInfo.map(m => m.글자);   // ← 이름 변경

// 불급 리스트 (기본 판정에서 잡힌 원인들) ← 지금은 사용 안 함
// const bulgeupList = 판정결과
//   .filter(r => r.구분 === "불급")
//   .map(r => r.원인);

// 투간/불투 판정 함수 (當令 기준)







const 특수rules = 특수태과불급map[dangryeong] || [];

for (const rule of 특수rules) {
  const isMulti = multiListCheck.includes(rule.원인);   // 多 여부
  const results = checkTuchulOrBultu(dangryeong, cheongan);

  // checkTuchulOrBultu는 rule별 결과 배열을 리턴하므로,
  // 해당 rule에 해당하는 판정 찾기
  const match = results.find(r => JSON.stringify(r.원인) === JSON.stringify(rule.원인));
  const tuchulType = match ? match.판정 : "불투";

  if (isMulti || tuchulType === rule.구분) {
    판정결과.push({
      구분: rule.구분,
      원인: rule.원인,
      tags: rule.tags,
      조건: rule.조건,
      藥: rule.藥,
      설명: rule.설명
    });
  //  console.log(`✨ 특수 규칙 적용: 당령=${dangryeong}, ${rule.구분} → ${rule.원인}`);
  }
}








//////태과불급추출방식 끝/////////////////






// 결과 없으면 문구 반환
if (판정결과.length === 0) {
  return ["해당사항 없음"];
}

// 🔹 rules에서 상세 정보 붙이기
const tbList = [];
for (const r of 판정결과) {
  // 👉 기본 불급은 rules 매핑 건너뜀
  if (r.구분 === "불급" && r.source === "basic") {
    tbList.push(r);
    continue;
  }

  const ruleList = rules[r.구분]; // 예: rules.태과
  if (!ruleList) {
    tbList.push(r);
    continue;
  }

  const matched = ruleList.filter(rule => rule.원인 === r.원인);
  if (matched.length > 0) {
    matched.forEach(m => {
      tbList.push({
    구분: r.구분,
    원인: m.원인,
    tags: m.tags ?? null,
    조건: m.조건 ?? null,   // 🔹 추가
    藥: m.藥 ?? null,
    설명: m.설명 ?? null
      });
    });
  } else {
    tbList.push(r);
  }
}

//console.log("🟢 원본 tbList:", tbList);

// 🔹 상세 있는 줄 / 없는 줄 분리
const detailList = tbList.filter(r => (r.藥 || r.tags || r.설명));
//console.log("📋 detailList (표로 출력):", detailList);

// 🔹 나열식(藥/설명 없는 것만 모음)
// 🔹 나열식(藥/설명 없는 것만 모음)
const simpleMap = tbList
  .filter(r => !(r.藥 || r.tags || r.설명))
  .reduce((acc, r) => {
    if (!acc[r.구분]) acc[r.구분] = [];

    // ✅ 원인이 배열이면 "乙丁"으로 합쳐서 문자열로 변환
    const originStr = Array.isArray(r.원인) ? r.원인.join("") : r.원인;

    acc[r.구분].push(originStr);
    return acc;
  }, {});


//console.log("📋 simpleMap (나열식):", simpleMap);

// 🔹 다한 천간(多) 추출
const multiList = extractMultiInfo(saju, ganList, countMap);
// 최종 반환
const result = tbList.length > 0 ? tbList : ["해당사항 없음"];
return { 
  list: [...tbList],                  // 배열 복사
  detail: [...detailList],
  simple: { ...simpleMap },
  multi: [...multiList],               // 복사
  bulgeup                // 🔹 불급도 같이 리턴
};
}



//////////////////////////////////////태과불급관련 보조함수들///////



// 2-1) 삼합 보정 체크//////////


function isValidSamhap(saju, gan) {
  const { yearBranch, monthBranch, dayBranch, hourBranch } = saju;

  const allBranches = [
    convertKorToHanBranch(yearBranch),
    convertKorToHanBranch(monthBranch),
    convertKorToHanBranch(dayBranch),
    convertKorToHanBranch(hourBranch),
  ];

  for (const key in SAMHAP_SUPPORT) {
    const [a, b] = key.split("-");
    const targetGan = SAMHAP_SUPPORT[key];

    if (targetGan !== gan) continue;

    // 월지와 무관: 단순히 해당 두 지지가 모두 존재하면 성립
    if (allBranches.includes(a) && allBranches.includes(b)) {
      return true;
    }
  }

  return false;
}



/// 삼합성립시 삼합당령글자 소환//////
function getSamhapDangryeong(saju) {
  const { yearBranch, monthBranch, dayBranch, hourBranch } = saju;
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch];


  // 모든 지지 조합 쌍 확인
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const key = `${branches[i]}-${branches[j]}`;
   //   console.log(`   👉 조합 확인: ${branches[i]}-${branches[j]} (key=${key})`);

      if (SAMHAP_SUPPORT[key]) {
     //   console.log(`   ✅ 삼합 성립: ${key} → ${SAMHAP_SUPPORT[key]}`);
        return SAMHAP_SUPPORT[key]; // 삼합당령 글자 반환
      }
    }
  }

 // console.log("❌ 삼합 성립 없음");
  return null;
}

///////오행으로 비교하기/////////
function getSupportedOhaeng(saju, dangryeong) {
  const result = new Set();

  // 1) 월지 당령 오행 무조건 추가
  result.add(elementMap[dangryeong]);

  // 2) 삼합당령 체크 → 있으면 오행 추가
  const samhapGan = getSamhapDangryeong(saju);
  // ⚡ isValidSamhap이 true/false만 반환한다면,


  if (samhapGan) {
    result.add(elementMap[samhapGan]);
  }

  return result;
}


// ✅ 천간/지지 출현 횟수 세기
export function buildCountMap(ganList) {
  const map = {};
  ganList.forEach(item => {
    // ganList 원소가 문자열일 수도, {gan:'乙', tag:'天'} 객체일 수도 있음
    const g = typeof item === "string" ? item : item.gan;
    if (!g) return;
    map[g] = (map[g] || 0) + 1;
  });
  return map;
}


///多한 천간 추출함수/////////////////////////////////////////////////////////////////////////////////////////////////////////
export function extractMultiInfo(saju, ganList, countMap) {
   const { yearGan, monthGan, hourGan, yearBranch, monthBranch, dayBranch, hourBranch } = saju;
  // ✅ 시작 로그
 // console.log("🔎 [extractMultiInfo] 多 추출 시작 --------------------");
 // ✅ 한글 → 한자로 변환
  const cheongans = [
    convertKorToHanStem(yearGan),
    convertKorToHanStem(monthGan),
    convertKorToHanStem(hourGan),
  ];

  const jijiList2 = [
    convertKorToHanBranch(yearBranch),
    convertKorToHanBranch(monthBranch),
    convertKorToHanBranch(dayBranch),
    convertKorToHanBranch(hourBranch),
  ];
  const cheongan = ganList.filter(g => g.tag === "天" && !g.isMiddle);
  const jijiList = ganList.filter(g => g.tag !== "天" && !g.isMiddle);

  const result = [];

// 0) 천간 3개 이상 → 무조건 多
let foundMulti0 = false;
for (const gan of stemOrder) {
  const cntInCheongan = cheongan.filter(g => g.gan === gan).length;
  if (cntInCheongan >= 3) {
  //  console.log(`🔥 0) 천간 3개 이상 ${gan} ${cntInCheongan}개 → 多`);
    result.push({ 글자: gan, type: "多" });
    foundMulti0 = true;
  } 
}

// 추가로 전체 결과가 없을 때도 표시
if (!foundMulti0) {
 // console.log("❌ 0) 조건충족안됨 → 多 아님");
}

// ✅ 0-0)지지 오행 多 체크 (월지 포함, 같은 오행 3개 이상일 때만 적용)
// 월지 오행
const woljiElement = jijielementMap[saju.monthBranch];

// 4지지 오행 변환
const jijiElements = jijiList2.map(j => jijielementMap[j]);

// 월지 오행 개수 카운트
const sameAsWolji = jijiElements.filter(el => el === woljiElement).length;



if (sameAsWolji >= 3) {


  // jijiList에서 등장 횟수 카운트
  const ganCount = {};
  jijiList.forEach(g => {
    ganCount[g.gan] = (ganCount[g.gan] || 0) + 1;
  });


  // 최다 등장 천간 선택
  let maxGan = null;
  let maxCount = 0;
  for (const [gan, count] of Object.entries(ganCount)) {
    if (count > maxCount) {
      maxGan = gan;
      maxCount = count;
    }
  }

  if (maxGan) {
    result.push({ 글자: maxGan, type: "多(지지)" });
  //  console.log(`✅  0-0)多(지지)최종선택: '${maxGan}' (count=${maxCount}) → 多(지지)`);
  } else {
  //  console.log("⚠️ 최다 천간을 찾지 못했음 (jijiList 비어있음?)");
  }
} else {
  //console.log("❌ 0-0)월지 포함 3개 이상 조건 불충족 → 지지 오행 多 아님");
}





  // 0-1) 무기토 특례: 천간 합쳐서 3개 이상
const cntMu = cheongan.filter(g => g.gan === "戊").length;
const cntGi = cheongan.filter(g => g.gan === "己").length;

if (cntMu + cntGi >= 3) {
  if (cntMu > 0) {
 //   console.log(`🔥 무토(戊) ${cntMu}개 + 기토 ${cntGi}개 → 多`);
    result.push({ 글자: "戊", type: "多" });
  }
  if (cntGi > 0) {
 //   console.log(`🔥 기토(己) ${cntGi}개 + 무토 ${cntMu}개 → 多`);
    result.push({ 글자: "己", type: "多" });
  }
} else {
 // console.log(`❌ 0-1)조건 충족 안됨: 무토=${cntMu}, 기토=${cntGi}, 합계=${cntMu + cntGi}`);
}



// 1) 일반 多: 천간 2개 이상 + 지지에 뿌리 존재
let foundNormal = false;  // 일반多 조건 충족 여부

for (const gan of stemOrder) {
  const cntInCheongan = cheongan.filter(g => g.gan === gan).length;

  // 천간의 뿌리 지지들
  const roots = (ganRootMap[gan] || "").split(",");

  // 실제 사주의 지지 목록 (문자열 비교)
  const existsRootInJiji = roots.some(root => jijiList2.includes(root));

  if (cntInCheongan >= 2 && existsRootInJiji) {
  //  console.log(
  //    `🔥 1) 일반多 조건 충족: ${gan} 천간 ${cntInCheongan}개 + 지지 뿌리(${roots.join(",")}) 존재`
  //  );
    result.push({ 글자: gan, type: "多" });
    foundNormal = true;
  }
}

// ✅ 일반多 조건 자체가 없을 때만 출력
if (!foundNormal) {
 // console.log("❌ 1) 조건 충족 없음");
}




  // 1-1) 특례: 병·임 천간에 2개
let foundSpecial = false; // 병·임 특례 충족 여부

["丙", "壬"].forEach(gan => {
  const count = countMap[gan] || 0;
  const pairBranch = gan === "丙" ? "午" : "子";

  if (count >= 2) {
  //  console.log(`🔥 1-1 특례) ${gan} 천간 ${count}개 → 多`);
    result.push({ 글자: gan, type: "多" });
    foundSpecial = true;
  } else if (count === 1 && jijiList.some(g => g.ji === pairBranch)) {
  //  console.log(`🔥 특례) ${gan} 천간 1개 + ${pairBranch} 지지 존재 → 多`);
    result.push({ 글자: gan, type: "多" });
    foundSpecial = true;
  } 
});

// ✅ 최종적으로 아무것도 못 찾은 경우
if (!foundSpecial) {
//  console.log("❌ 1-1)  조건 충족 없음");
}

//1-2) 병 또는 임 천간에 한개 + 같은 오행 병임포함 2개이상 + 지지에 같은 오행 하나이상
// 1-2) 특례: 병 또는 임 → 천간 1개 + 같은 오행 2개 이상 + 지지에 같은 오행 1개 이상
["丙",'丁', "壬", '癸'].forEach(gan => {
  const cntGan = countMap[gan] || 0;
  const ganElement = elementMap[gan]; // ex) 丙 → 火, 壬 → 水

  // 같은 오행에 속하는 천간들 (丙, 丁 or 壬, 癸)
  const sameElementStems = elementToStems[ganElement] || [];
  const sameElementCount = sameElementStems.reduce(
    (sum, g) => sum + (countMap[g] || 0),
    0
  );

  // 지지에도 같은 오행 있는지 검사 (지지의 지장간 사용)
  const existsInJiji = jijiList.some(j => elementMap[j.gan] === ganElement);

  //console.log(
  //  `🔍 특례1-2 검사: ${gan} (cntGan=${cntGan}, 오행=${ganElement}, ` +
  //  `같은오행천간=${sameElementCount}, 지지동일오행=${existsInJiji})`
 // );

  if (cntGan === 1 && sameElementCount >= 2 && existsInJiji) {
    result.push({ 글자: gan, type: "多", source: "특례1-2" });
 //   console.log(
 //     `🔥 특례1-2 충족: ${gan} 천간 1개 + 같은오행천간 ${sameElementCount}개 + 지지에 ${ganElement} 존재 → 多`
 //   );
  } else {
  //  console.log(`❌ 특례1-2 불충족: ${gan}`);
  }
});



  // 2-1) 무기토 多 (무/기 2개 이상 + 辰戌丑未 존재)
 const jijiSet = new Set([saju.yearBranch, saju.monthBranch, saju.dayBranch, saju.hourBranch]);

let foundMuGi = false;

if ((countMap["戊"] >= 2 || countMap["己"] >= 2) &&
    ["辰","戌","丑","未"].some(z => jijiSet.has(z))) {

  if (countMap["戊"] >= 2) {
  //  console.log(`🔥 2-1)무토 2개 이상 + 辰戌丑未 존재 → 戊多`);
    result.push({ 글자: "戊", type: "多" });
    foundMuGi = true;
  }

  if (countMap["己"] >= 2) {
  //  console.log(`🔥 기토 2개 이상 + 辰戌丑未 존재 → 己多`);
    result.push({ 글자: "己", type: "多" });
    foundMuGi = true;
  }
}

// ✅ 최종적으로 아무것도 못 찾은 경우
if (!foundMuGi) {
 // console.log("❌ 2-1)  조건 충족 없음 ");
}


  // 2-2) 무기토 하나 + 월지가 辰戌丑未
let foundMuGiMonth = false;

if ((countMap["戊"] === 1 || countMap["己"] === 1) &&
    ["辰","戌","丑","未"].includes(saju.monthBranch)) {

  if (countMap["戊"] === 1) {
   // console.log(`🔥 2-2)무토 1개 + 월지 ${saju.monthBranch} → 戊多`);
    result.push({ 글자: "戊", type: "多" });
    foundMuGiMonth = true;
  }

  if (countMap["己"] === 1) {
 //   console.log(`🔥 2-2)기토 1개 + 월지 ${saju.monthBranch} → 己多`);
    result.push({ 글자: "己", type: "多" });
    foundMuGiMonth = true;
  }
}

// ✅ 아무것도 못 찾은 경우
if (!foundMuGiMonth) {
 // console.log("❌ 2-2)  조건 충족 없음");
}

  // 2-3) 무기토 동주 多
const ganjiList = [
  saju.yearGan + saju.yearBranch,
  saju.monthGan + saju.monthBranch,
  saju.dayGan + saju.dayBranch,
  saju.hourGan + saju.hourBranch
];

const 무기토동주패턴 = ["戊辰", "戊戌", "己未", "己丑"];
const hasDongju = ganjiList.some(ganji => 무기토동주패턴.includes(ganji));

let foundMuGiDongju = false;

if (hasDongju) {
  // 👉 무/기 천간 개수
  const cntMu = countMap["戊"] || 0;
  const cntGi = countMap["己"] || 0;

  // 👉 지지에서 토(辰戌丑未) 개수
  const earthBranches = ["辰", "戌", "丑", "未"];
  const cntEarthBranch = jijiList.filter(g => earthBranches.includes(g.ji)).length;

  // 👉 합산 (천간 戊/己 + 지지 辰戌丑未)
  const totalEarth = cntMu + cntGi + cntEarthBranch;

  if (totalEarth >= 3) {
  //  console.log(
 //     `🔥 2-3) 무기토 동주 성립 (${ganjiList.join(",")}), 무=${cntMu}, 기=${cntGi}, 지지토=${cntEarthBranch}, 합계=${totalEarth} → 戊己多`
 //   );
    if (cntMu > 0) result.push({ 글자: "戊", type: "多" });
    if (cntGi > 0) result.push({ 글자: "己", type: "多" });
    foundMuGiDongju = true;
  } else {
 //   console.log(
 //     `❌ 2-3) 무기토 동주 성립했으나 토 합계 ${totalEarth}개 (<3) → 조건 불충족`
 //   );
  }
} else {
 // console.log("❌ 2-3) 조건 해당없음");
}


  // 2-4) 무토(戊)+ 지지多
const earthBranches = ["辰", "戌", "丑", "未"];

// 1) 천간 戊 개수
const cntMu2 = countMap["戊"] || 0;

// 2) 지지에서 土(辰戌丑未) 개수
const earthCount = jijiList2.filter(j => earthBranches.includes(j)).length;

// 3) 辰/戌 포함 여부
const hasChenXu = jijiList2.some(j => j === "辰" || j === "戌");

// 4) 최종 조건
const condA = hasChenXu && earthCount >= 2;
const condB = earthCount >= 3;

if (cntMu2 >= 1 && (condA || condB)) {
 // console.log(
 ///   `🔥 2-4) 무토 특례 충족: 戊=${cntMu2}, 辰戌 포함=${hasChenXu}, 토지지=${earthCount}개 → 戊多`
// );
  result.push({ 글자: "戊", type: "多" });
} else {
 //// console.log(
//    `❌ 2-4) 무토 특례 불충족: 무=${cntMu2}, 辰戌 포함=${hasChenXu}, 토지지=${earthCount}개`
 // );
}


// 1) 천간 4개
const ganList4 = [
  saju.yearGan,
  saju.monthGan,
  saju.dayGan,
  saju.hourGan
];
const ganElements = ganList4.map(gan => elementMap[gan] || "?");

// 2) 지지 4개
const jijiList4 = [
  saju.yearBranch,
  saju.monthBranch,
  saju.dayBranch,
  saju.hourBranch
];
const jijiElements4 = jijiList4.map(ji => jijielementMap[ji] || "?");

// 3) 합산
const combinedElements = [...ganElements, ...jijiElements4];

// 4) 오행 카운트
const combinedCount = combinedElements.reduce((acc, el) => {
  acc[el] = (acc[el] || 0) + 1;
  return acc;
}, {});
//console.log("📊 합산 오행 카운트:", combinedCount);

// 5) 火·水 多 판정
["火", "水", "金", "木"].forEach(el =>  {
  const cnt = combinedCount[el] || 0;

  if (cnt >= 4) {
    const stems = elementToStems[el] || [el];
    const existingStems = stems.filter(stem => ganList4.includes(stem));

    const ganCount = ganList4.reduce((acc, g) => {
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {});

    const duGan = existingStems.find(stem => ganCount[stem] >= 2);

if (duGan) {
  // 투간된 글자 하나만
  result.push({ 글자: duGan, type: "多", source: "조건4-투간" });
 // console.log(`💡 조건4) ${el} ${cnt}개 → 多 (투간: ${duGan})`);
} else if (existingStems.length > 0) {
  // 기존: "丙丁" 하나로 → 수정: ["丙","丁"] 개별로
  existingStems.forEach(stem => {
    result.push({ 글자: stem, type: "多", source: "조건4-천간존재" });
  //  console.log(`💡 조건4) ${el} ${cnt}개 → 多 (천간 존재: ${stem})`);
  });
} else {
  // 지지 우위일 때도 문자열 전체 대신 분리
  stems.forEach(stem => {
    result.push({ 글자: stem, type: "多", source: "조건4-지지우위" });
  });
 // console.log(`⚠ 조건4) ${el} ${cnt}개 (천간 없음) → 多 (${stems.join(",")})`);
}
  }

});



  console.log("✅ 최종 多 판정:", result);
    // 🔹 글자만 뽑아서 전역 multiList로 저장
  window.multiList = result.map(r => r.글자);

  return result;
}

  // ✅ 함수명 checkTuchulOrBultu2
  export function checkTuchulOrBultu(dangryeong, cheongan) {
  // ① 사주 천간 4글자 추출
// ✅ 사주팔자 천간 4글자만 기준으로
const cheonList = (window.sajuStemList || []).map(c => c.value);

  // cheonList는 ["甲","丙","辛","癸"] 이런 식

  // ② 쌍 조합 추가
  let addList = [...cheonList];
  for (let i = 0; i < cheonList.length; i++) {
    for (let j = i + 1; j < cheonList.length; j++) {
      addList.push(cheonList[i] + cheonList[j], cheonList[j] + cheonList[i]);
    }
  }

  // ✅ 기준 리스트 로그
  console.log("🟡 [투간/불투] 기준 리스트(addList):", addList);

  // ③ 룰 가져오기
  const rules = 특수태과불급map[saju.dangryeong] || [];
  //console.log("📖 당령:", saju.dangryeong, "→ 특수태과불급 룰 개수:", rules.length);

  // ④ 각 룰의 원인과 addList 비교
  return rules.map(rule => {
    const compareList = Array.isArray(rule.원인) ? rule.원인 : [rule.원인];

    // ✅ 비교할 글자 로그
    //console.log(`🔍 [룰검증] 원인=${JSON.stringify(compareList)} vs 기준리스트(addList)`);

    const isMatch = compareList.every(g => addList.includes(g));
    const 판정 = isMatch ? "투간" : "불투";

    //console.log(`➡️ 결과: 원인=${compareList.join(",")} → ${판정}`);

    return { ...rule, 판정 };
  });
}


export function checkConditions(item, multiList, bulgeup, tuchulResults) {
    if (!item.tags) {
      console.log("🔸 조건검사 SKIP(태그 없음):", item.원인, item.구분);
      return true;
    }

    const rule = conditionRules.find(r => 
  item.tags.some(tag => tag.includes(r.tag))
);

    if (!rule) {
      console.log("🔸 조건검사 SKIP(룰 없음):", item.원인, item.구분, item.tags);
      return true;
    }

    console.log("✅ 태그 매칭:", rule.tag, "원인:", item.원인, "구분:", item.구분);

    // main 조건 검사
    if (rule.main) {
      if (
        (rule.main.글자 && item.원인 !== rule.main.글자) ||
        (rule.main.구분 && item.구분 !== rule.main.구분)
      ) {
        console.log("⛔ main 조건 불일치:", { ruleMain: rule.main, item원인: item.원인, item구분: item.구분 });
        return false;
      }
    }
  
    // extra 조건 검사
    if (rule.extra) {
      const { 글자, 조건2 } = rule.extra;
      console.log("🟡 extra 조건 검사 시작:", { 글자, 조건2, bulgeup, multiList, tuchulResults });

      if (조건2 === "불급") {
        const ok = bulgeup.includes(글자);
        console.log("👉 불급 검사:", 글자, "→", ok);
        if (!ok) return false;
      }
      if (조건2 === "多") {
        const ok = multiList.includes(글자);
        console.log("👉 多 검사:", 글자, "→", ok);
        if (!ok) return false;
      }
      if (조건2 === "투간") {
        const ok = tuchulResults.some(r => r.글자 === 글자 && r.구분 === "투간");
        console.log("👉 투간 검사:", 글자, "→", ok);
        return ok;
      }
      if (조건2 === "불투") {
        const ok = !tuchulResults.some(r => r.글자 === 글자 && r.구분 === "투간");
        console.log("👉 불투 검사:", 글자, "→", ok);
        return ok;
      }
    }

    return true;
  }


//////////////////태과불급+多 추출함수 끝//////////////////////////////////////////////////
export function renderTaegwaBulgeupList(result, saju, ganList, countMap) {
  console.log("🟠 [START] renderTaegwaBulgeupList 진입");

  let extractedTags = [];
  let johuTags = [];

  // ================================
  // 0. 기본 result 처리 (빈값 early return)
  // ================================
  if (!result) {
    console.log("🚨 result 없음 → 조기 종료");
    return { html: `태과불급: 해당사항 없음`, johuTags: [] };
  }

  let list = result;
  let simpleMap = null;

  if (typeof result === "object" && !Array.isArray(result)) {
    list = (result.detail && result.detail.length > 0) ? result.detail : result.list;
    simpleMap = result.simple || null;
  } else if (Array.isArray(result)) {
    list = result;
  } else if (typeof result === "string") {
    console.log("📄 result 문자열:", result);
    return { html: `태과불급: ${result}`, johuTags: [] };
  } else {
    list = [];
  }

  if (!list || (Array.isArray(list) && list.length === 0)) {
    console.log("🚨 리스트 비어있음, 종료:", list);
    return { html: `태과불급: 해당사항 없음`, johuTags: [] };
  }

  if (!Array.isArray(list)) list = [list];

  // ================================
  // 1. 사주 관련 리스트 준비
  // ================================
  const multiList = Array.from(new Set([...(result.multi ? result.multi.map(m => m.글자) : [])]));
  const bulgeup = result.simple?.불급 || [];

  // ✅ 사주 천간만으로 투간/불투 결과 구하기
  const tuchulResults = [];
  for (const stem of window.sajuStemList || []) {
    const statusArr = checkTuchulOrBultu(saju.dangryeong, [stem]);
    if (statusArr && Array.isArray(statusArr)) {
      statusArr.forEach(s => {
        tuchulResults.push({ 글자: stem.value, 구분: s.판정 });
      });
    }
  }
  ///console.log("📦 1차 tuchulResults:", tuchulResults);

  // ================================
  // 2. 1차 필터링 (藥 있는 항목만)
  // ================================
 // ================================
// 2. 1차 필터링 (藥 있는 항목만) + 중복 제거
// ================================
let firstList = list.filter(item => item.藥);
//console.log("📦 1차 필터링 결과 (藥 있는 항목만):", firstList);

// ✅ 중복 제거
const seen = new Set();
firstList = firstList.filter(item => {
  const key = [
    item.구분,
    item.원인,
    JSON.stringify(item.tags || ""),
    JSON.stringify(item.조건 || ""),
    JSON.stringify(item.藥 || ""),
    JSON.stringify(item.설명 || "")
  ].join("|");
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log("📦 1차 필터링 + 중복제거 결과:", firstList);

  // ================================
  // 3. 2차 검증 (조건 태그 기반)
  // ================================
  const secondList = firstList.filter(item => {
    const pass = checkConditions(item, multiList, bulgeup, tuchulResults);
    console.log(`🔎 2차검증: 원인=${item.원인}, 구분=${item.구분}, pass=${pass}`);
    return pass;
  });
  console.log("📦 2차 검증 후 최종 리스트:", secondList);

  // ================================
  // 4. 태그 추출 & 조후 태그 정리
  // ================================
  secondList.forEach(item => {
    if (item?.tags) {
      Array.isArray(item.tags) ? extractedTags.push(...item.tags) : extractedTags.push(item.tags);
    }
  });
  const specialTags = ["금한수냉(金寒水冷)", "목다화치(木多火熾)", "과습(過濕)", "과조(過燥)", "한조(寒燥)", "음습(陰濕)"];
  johuTags = [...new Set(extractedTags.filter(tag => specialTags.includes(tag)))];
  saju.johuTags = johuTags;
  console.log("🌟 최종 johuTags:", johuTags);

  // ================================
  // 5. 출력 HTML 생성
  // ================================
  let tableHTML = "";
  if (secondList.length > 0) {
    const rows = secondList.map(item => {
      const 구분 = item.구분 || item.type || "";
      const 원인 = item.원인 || item.gan || "";
      const tags = item.tags?.join?.(", ") || (Array.isArray(item.tags) ? item.tags.join(", ") : (item.tags || ""));

      let yakStr = "";
      if (Array.isArray(item.藥)) {
        yakStr = item.藥.map(y => `<span class="tooltip" data-desc="${y.설명 || ''}">${y.글자}</span>`).join(", ");
      } else if (item.藥) {
        yakStr = `<span class="tooltip" data-desc="${item.설명 || ''}">${item.藥}</span>`;
      }

      const 조건 = item.조건
        ? `<span class="tooltip" data-desc="${item.조건.설명2 || ''}">${item.조건.글자} ${item.조건.설명 ? "(" + item.조건.설명 + ")" : ""}</span>`
        : "";

      return `
        <tr>
          <td style="border:1px solid #ccc; padding:4px;">${구분}</td>
          <td style="border:1px solid #ccc; padding:4px;"><span style="color:red;">${원인}</span></td>
          <td style="border:1px solid #ccc; padding:4px;"><strong>${tags}</strong></td>
          <td style="border:1px solid #ccc; padding:4px;">${조건}</td>
          <td style="border:1px solid #ccc; padding:4px;"><span style="color:blue;">${yakStr}</span></td>
        </tr>
      `;
    }).join("");

    tableHTML = `
      <table style="border-collapse:collapse; width:100%; text-align:center;" border="1">
        <tr style="background:#f2f2f2;">
          <th rowspan="${secondList.length + 1}" style="padding:4px; background:#e6f0ff;"><span class="explainable" data-group="terms" data-term="">태과불급</span>+</th>
          <th style="padding:4px; background:#fff8dc;">구분</th>
          <th style="padding:4px; background:#fff8dc;">원인</th>
          <th style="padding:4px; background:#fff8dc;">명칭</th>
          <th style="padding:4px; background:#fff8dc;">조건</th>
          <th style="padding:4px; background:#fff8dc;">藥</th>
        </tr>
        ${rows}
      </table>
    `;
  } else {
    console.log("ℹ️ 최종 리스트 없음 → 단순 메시지 출력");
    tableHTML = `당령관련 태과불급: 해당사항 없음`;
  }

  // ================================
  // 6. 전역 등록
  // ================================
  window.sajuResult = result;
  window.simpleMap = simpleMap || {};
  window.multiList = multiList;
  window.bulgeup = bulgeup;
  window.originList = [...new Set([...result.simple?.태과 || [], ...secondList.map(l => l.원인)])];

  console.log("🏁 [END] renderTaegwaBulgeupList 종료");
  return { html: tableHTML, johuTags };
}









export function renderSimpleTable() {
  const result = window.sajuResult || {};
  const simpleMap = window.simpleMap || {};

  //console.log("📌 renderSimpleTable 호출됨");
  //console.log("👉 result =", result);
  //console.log("👉 simpleMap =", simpleMap);
  //console.log("👉 selectedDaewoon =", window.selectedDaewoon);
  //console.log("👉 selectedSewoon =", window.selectedSewoon);

  // ✅ 전역 등록 (중복 제거 포함)
  window.multiList = Array.from(
    new Set([...(result?.multi ? result.multi.map(m => m.글자) : [])])
  );

  window.bulgeup = Array.from(new Set(simpleMap?.["불급"] || []));

  window.originFromDetail = Array.from(
    new Set(
      (result?.detail || [])
        .filter(r => r.藥 && r.구분 !== "투간" && r.구분 !== "불투")
        .map(r => r.원인)
    )
  );

  console.log("👉 window.multiList =", window.multiList);
  console.log("👉 window.bulgeup =", window.bulgeup);
  console.log("👉 window.originFromDetail =", window.originFromDetail);

  function renderDaewoonSewoon() {
    // 전역이 없으면 초기 기본값 넣기
    if (!window.selectedDaewoon && window.initialDaewoon) {
      window.selectedDaewoon = window.initialDaewoon;
    }
    if (!window.selectedSewoon && window.initialSewoon) {
      window.selectedSewoon = window.initialSewoon;
    }
    const daewoon = window.selectedDaewoon;
    const sewoon = window.selectedSewoon;
    console.log("👉 renderDaewoonSewoon: daewoon=", daewoon, "sewoon=", sewoon);

    if (!daewoon && !sewoon) return "-";
    const parts = [];

    if (daewoon?.stem) parts.push(`<span style="color:red;">${daewoon.stem}</span>(天,大)`);
    if (sewoon?.stem) parts.push(`<span style="color:red;">${sewoon.stem}</span>(天,世)`);

    if (daewoon?.branch) {
      (jijiToSibganMap2[daewoon.branch] || []).forEach(val =>
        parts.push(`<span style="color:red;">${val}</span>(地,大)`)
      );
    }
    if (sewoon?.branch) {
      (jijiToSibganMap2[sewoon.branch] || []).forEach(val =>
        parts.push(`<span style="color:red;">${val}</span>(地,世)`)
      );
    }

    // ✅ parts도 중복 제거
    return Array.from(new Set(parts)).join(" / ");
  }

  return `
    <table style="border-collapse:collapse; width:100%; text-align:center; margin-top:8px;" border="1">
      <tr style="background:#f9f9f9;">
        <th>多한 글자</th>
        <th>부족한 글자</th>
        <th>태과불급</th>
        <th>선택된 대운세운</th>
      </tr>
      <tr>
        <td>${window.multiList.join(", ") || "-"}</td>
        <td>${window.bulgeup.join(", ") || "-"}</td>
        <td style="background:#FFDFFF;">${window.originFromDetail.join(", ") || "-"}</td>
        <td>${renderDaewoonSewoon()}</td>
      </tr>
    </table>
  `;
}

export function updateSimpleTable() {
  const box = document.querySelector("#simple-table-box");
  if (!box) return;
  box.innerHTML = renderSimpleTable(); // 전역 사용
}




















//사주정보류////////


// --- 사주 정보 테이블 생성 ---
export function makeSajuInfoTable() {
  if (!Array.isArray(window.allBranchList1) || window.allBranchList1.length < 4) {
    return "<tr><td colspan='7'>⚠ 지지/천간 정보 없음</td></tr>";
  }

  ///console.group("▶ makeSajuInfoTable 실행");
  ///console.log("초기 allBranchList1:", window.allBranchList1);
  //console.log("초기 allStemList:", window.allStemList);

  const monthBranch = window.allBranchList1[1]?.value; // 월지 (value 사용)

  // --- 🔹 지지 관계 계산 ---
  const result = extractSajuRelations(monthBranch, window.allBranchList1, {
    daewoon: window.selectedDaewoon,
    sewoon: window.selectedSewoon
  });

  // --- 🔹 천간합 계산 ---
// --- 🔹 천간합 계산 ---
let ganhapResult = [];
for (let i = 0; i < window.allStemList.length; i++) {
  for (let j = i + 1; j < window.allStemList.length; j++) {
    const aObj = window.allStemList[i];
    const bObj = window.allStemList[j];
    const a = aObj?.value || "";
    const b = bObj?.value || "";

    if (!a || !b) continue;

    let aLabel = a;
    let bLabel = b;

    if (aObj?.type === "daewoon") aLabel += "(대운)";
    if (aObj?.type === "sewoon") aLabel += "(세운)";
    if (bObj?.type === "daewoon") bLabel += "(대운)";
    if (bObj?.type === "sewoon") bLabel += "(세운)";

    if (간합MAP[a] === b) {
      ganhapResult.push(`${aLabel}${bLabel}`);
    } else if (간합MAP[b] === a) {
      ganhapResult.push(`${bLabel}${aLabel}`);
    }
  }
}


  const ganhapStr = ganhapResult.length
    ? [...new Set(ganhapResult)].join(", ")
    : "<span style='color:red;'>X</span>";

 // console.log("👉 월지:", monthBranch);
 // console.log("👉 지지 관계 결과:", result);
 // console.log("👉 천간합 결과:", ganhapStr);
//  console.groupEnd();

  // --- 🔹 지합 계산 ---
let jihapResult = [];
for (let i = 0; i < window.allStemList.length; i++) {
  const aObj = window.allStemList[i];
  const a = aObj?.value || "";
  if (!a) continue;

  let aLabel = a;
  if (aObj?.type === "daewoon") aLabel += "(大)";
  if (aObj?.type === "sewoon") aLabel += "(世)";

  // 지지들 전부 확인 (원국+대운+세운)
  for (const bObj of window.allBranchList1) {
    const branch = bObj?.value || "";
    if (!branch) continue;

    let branchLabel = branch;
    if (bObj?.type === "daewoon") branchLabel += "(大)";
    if (bObj?.type === "sewoon") branchLabel += "(世)";

    // 🔹 해당 지지의 지장간들 추출
    const hiddenList = HanhiddenStemsMap[branch] || [];
    for (const hidden of hiddenList) {
      const hStem = hidden.stem || hidden; // 구조에 따라 stem 필드 or 값

      // 합 조건 검사 (천간 ↔ 지장간)
      if (간합MAP[a] === hStem || 간합MAP[hStem] === a) {
        jihapResult.push(`${aLabel}${branchLabel}`);
      }
    }
  }
}

const jihapStr = jihapResult.length
  ? [...new Set(jihapResult)].join("/ ")
  : "<span style='color:red;'>X</span>";


    // --- 🔹 산업분류 계산 (월지 기준 + 나머지 5지지 검사) ---
  const industryCategory = getIndustryCategoryWithTags(monthBranch, window.allBranchList1);

  //console.log("👉 월지:", monthBranch);
 // console.log("👉 지지 관계 결과:", result);
//  console.log("👉 천간합 결과:", ganhapStr);
 // console.log("👉 지합 결과:", jihapStr);
//  console.log("👉 산업분류:", industryCategory);
 // console.groupEnd();

  return `
    <div style="text-align:left; margin:8px 0; color:#0077cc;">
  01] 타고난 환경조건
</div>
    <table style="border-collapse:collapse;width:100%;text-align:center;font-size:12px;" border="1">
      <tbody>
        <tr style="background-color:#e6f7ff;">
          <td><span class="explainable" data-group="terms" data-term="">육합</span></td>
          <td><span class="explainable" data-group="terms" data-term="">삼합</span></td>
          <td><span class="explainable" data-group="terms" data-term="">방합</span></td>
          <td><span class="explainable" data-group="terms" data-term="">충</span></td>
           <td><span class="explainable" data-group="terms" data-term="">간합</span></td>
          <td><span class="explainable" data-group="terms" data-term="">형</span></td>
          <td><span class="explainable" data-group="terms" data-term="">배열</span></td>
          
        </tr>
        <tr>
          <td>${result.육합 || "<span style='color:red;'>X</span>"}</td>
          <td>${result.삼합 || "<span style='color:red;'>X</span>"}</td>
          <td>${result.방합 || "<span style='color:red;'>X</span>"}</td>
          <td>${result.충   || "<span style='color:red;'>X</span>"}</td>
          <td>${ganhapStr}</td>

          <td>${result.형   || "<span style='color:red;'>X</span>"}</td>
          <td>${result.배열 || "<span style='color:red;'>X</span>"}</td>
          
        </tr>

         <tr>
          <td style="background-color:#e6f7ff;"><span class="explainable" data-group="terms" data-term="">地합</span></td>
          <td colspan="3">${jihapStr}</td>
         
          <td style="background-color:#e6f7ff;"><span class="explainable" data-group="terms" data-term="">산업분류</span></td>
           <td colspan="2">${industryCategory}</td>
        </tr>
      </tbody>
    </table>
  `;
}


// --- 지지 관계 추출 함수 ---
function extractSajuRelations(monthBranch, jijiList, { daewoon, sewoon } = {}) {
  const relations = 형충회합Map[monthBranch] || [];
  const result = { 육합: [], 삼합: [], 방합: [], 배열: [], 충: [], 형: [], 간합: [] };

//  console.group("▶ extractSajuRelations 실행");
//  console.log("월지:", monthBranch, "입력 jijiList:", jijiList);

  for (const { target, tags } of relations) {
    const matchedList = jijiList.filter(x => x?.value === target);
    if (matchedList.length === 0) continue;

    let tagList = Array.isArray(tags) ? tags.flatMap(t => t.split('/')) : tags.split('/');

    for (const tag of tagList) {
      if (result[tag] !== undefined) {
        matchedList.forEach(matched => {
          let decorated = matched.value;

          // 🔹 type에 따라 꼬리표 부여
          if (matched.type === "daewoon") decorated += "(대운)";
          if (matched.type === "sewoon") decorated += "(세운)";

          if (matched.value !== monthBranch) decorated = monthBranch + decorated;

     //     console.log(`✅ ${tag} 추가됨:`, decorated, "(type:", matched.type, ")");
          result[tag].push(decorated);
        });
      }
    }
  }

  Object.keys(result).forEach(key => {
    result[key] = result[key].length > 0 ? [...new Set(result[key])].join(", ") : "";
  });

//  console.log("👉 최종 결과:", result);
//  console.groupEnd();

  return result;
}


function getIndustryCategoryWithTags(monthBranch, branchList) {
  for (const [category, arr] of Object.entries(산업분류Map)) {
    if (!arr.includes(monthBranch)) continue; // 월지가 그룹에 없으면 패스

    const pos = arr.indexOf(monthBranch); // 0 → [+], 1 → [-]
    const baseMark = pos === 0 ? "[+]" : "[-]";
    const baseLabel = `${monthBranch}`;

    const partner = arr[pos === 0 ? 1 : 0];

    // 나머지 5지지 중에 partner가 있는지 체크
    let partnerLabel = null;
    for (const bObj of branchList) {
      if (!bObj || bObj.value === monthBranch) continue; // 월지 제외
      if (bObj.value === partner) {
        let label = partner;
        if (bObj?.type === "daewoon") label += "(大)";
        if (bObj?.type === "sewoon") label += "(世)";
        partnerLabel = label;
        break;
      }
    }

    if (partnerLabel) {
      return `${category}[合]: ${baseLabel}${partnerLabel}`;
    } else {
      return `${category}${baseMark}: ${baseLabel}`;
    }
  }
  return "<span style='color:red;'>X</span>";
}

