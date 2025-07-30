// sajuUtils.js
//함수종류
//convertKorToHanStem, convertKorToHanBranch, convertHanToKorStem, normalizeBranch, 
// isYangStem, getDaYunDirection, generateDaYunStems, getTenGod, colorize, splitGanji, 
// getThreeLinesFromArray, generateDaYun, getGanjiByYear,
// generateYearlyGanjiSeries2, generateDaeyunBy60Gapja, getStartMonthBySewoonStem, 
// calculateSewonYear, findStartMonthIndex, generateMonthlyGanjiSeriesByGanji, getDangryeong,
//getSaryeong,



import { 
         saryeongMap,
         DANGRYEONGSHIK_MAP,
         jijiToSibganMap,
         firstHeesinMap,
        HEESIN_GISIN_COMBINED, 
        HEESIN_BY_DANGRYEONG_POSITION, 
        GISIN_BY_DANGRYEONG_POSITION,
        tenGodMap,
        tenGodMapKor
        } from './constants.js';
import { elementColors,arrangeByPosition} from './renderUtils.js';


// sajuUtils.js

// 서버에서 절기 날짜 받아오는 함수
async function getJeolipDateFromAPI(year, month) {
  const res = await fetch(`/api/jeolip?year=${year}&month=${month}`);
  const { date } = await res.json();
  return new Date(date);
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
  const monthFraction = (birthMonth - 1) / 12;
  const dayFraction = (birthDay / 30) / 12;
  const decimalPart = monthFraction + dayFraction;

  const sewonYear = (birthYear - 10) + daeyunAge + decimalPart;

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

export function getDangryeong(monthJi, daeyunAge, daYunDirection) {
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
  console.log('[getSaryeong] monthJi:', monthJi, 'daeyunAge:', daeyunAge, 'direction:', window.daYunDirection);
  if (direction === undefined) {
    throw new Error("⚠️ 대운 방향(direction)이 정의되지 않았습니다.");
  }


  if (!saryeongMap[monthJi]) return null;

  const [early, late] = saryeongMap[monthJi];
  const scaledValue = daeyunAge * 3;
  console.log('[getSaryeong] scaledValue:', scaledValue);

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



//1. 사주천간,지지리스트 뽑기


// 2. 사주팔자에서 천간 리스트와 지지 리스트 배열




//3.희기신추출리스트
// 1) 천간 희기신 추출 함수
export function extractCheonganHeesinGisin(dangryeong, sajuCheonganList) {
  const heesinMap = HEESIN_BY_DANGRYEONG_POSITION[dangryeong];
  const gisinMap = GISIN_BY_DANGRYEONG_POSITION[dangryeong];

  // 희신 후보: 문자별 위치 배열 저장
  const heesinCharPosMap = {};
  Object.entries(heesinMap).forEach(([pos, char]) => {
    if (!heesinCharPosMap[char]) heesinCharPosMap[char] = [];
    heesinCharPosMap[char].push(Number(pos));
  });

  // 기신 후보: 문자별 위치 배열 저장
  const gisinCharPosMap = {};
  Object.entries(gisinMap).forEach(([pos, chars]) => {
    chars.forEach(char => {
      if (!gisinCharPosMap[char]) gisinCharPosMap[char] = [];
      gisinCharPosMap[char].push(Number(pos));
    });
  });

  // 사주 천간에 포함된 희신만 추출
  const cheonganHeesinList = Object.entries(heesinCharPosMap)
    .filter(([char]) => sajuCheonganList.includes(char))
    .map(([char, posArr]) => ({ char, pos: posArr }));

  // 사주 천간에 포함된 기신만 추출
  const rawGisinList = Object.entries(gisinCharPosMap)
    .filter(([char]) => sajuCheonganList.includes(char))
    .map(([char, posArr]) => ({ char, pos: posArr }));

  // 희신 문자 집합
  const heesinChars = new Set(cheonganHeesinList.map(h => h.char));

  // 기신 리스트에서 희신 문자 제거
  const cheonganGisinList = rawGisinList.filter(({ char }) => !heesinChars.has(char));

  return {
    cheonganHeesinList,
    cheonganGisinList
  };
}


//사주지지천간리스트 뽑기
export function extractJijiSibgansWithMiddleInfo(sajuJijiArray) {
  const sibganList = [];

  sajuJijiArray.forEach(jijiChar => {
    const sibgans = jijiToSibganMap[jijiChar] || [];

    sibgans.forEach((item, index) => {
      if (item.char) {
        sibganList.push({
          char: item.char,
          isMiddle: index === 1,
        });
      }
    });
  });

  return sibganList;
}




// 2) 지지 희기신 추출 함수
export function extractJijiHeesinGisin(dangryeong, sajuJijiList) {
  const heesinMap = HEESIN_BY_DANGRYEONG_POSITION[dangryeong] || {};
  const gisinMap = GISIN_BY_DANGRYEONG_POSITION[dangryeong] || {};
  const sajuSet = new Set(sajuJijiList);

  const jijiHeesinList = [];
  const jijiGisinList = [];

  Object.entries(heesinMap).forEach(([posStr, char]) => {
    const pos = Number(posStr);
    const jijiChar = sajuJijiList[pos - 1];
    const sibganList = jijiToSibganMap[jijiChar] || [];
console.log(`[DEBUG][희신] pos:${pos}, jijiChar:${jijiChar}, char:${char}, sibganList:`, sibganList);
    const isMiddle = sibganList[1]?.char === char;

    if (sajuSet.has(char)) {
      jijiHeesinList.push({ char, pos, isMiddle });
    }
  });

  Object.entries(gisinMap).forEach(([posStr, chars]) => {
    const pos = Number(posStr);
    const jijiChar = sajuJijiList[pos - 1];
    const sibganList = jijiToSibganMap[jijiChar] || [];

    chars.forEach(char => {
      const isHeesin = jijiHeesinList.some(h => h.char === char);
      const isMiddle = sibganList[1]?.char === char;
console.log(`[DEBUG][기신] pos:${pos}, jijiChar:${jijiChar}, char:${char}, isHeesin:${isHeesin}, isMiddle:${isMiddle}`);

      if (sajuSet.has(char) && !isHeesin) {
        jijiGisinList.push({ char, pos, isMiddle });
      }
    });
  });

  return {
    jijiHeesinList,
    jijiGisinList
  };
}



