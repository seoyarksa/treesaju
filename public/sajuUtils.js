// sajuUtils.js
//함수종류
//convertKorToHanStem, convertKorToHanBranch, convertHanToKorStem, normalizeBranch, 
// isYangStem, getDaYunDirection, generateDaYunStems, getTenGod, colorize, splitGanji, 
// getThreeLinesFromArray, generateDaYun, getGanjiByYear,
// generateYearlyGanjiSeries2, generateDaeyunBy60Gapja, getStartMonthBySewoonStem, 
// calculateSewonYear, findStartMonthIndex, generateMonthlyGanjiSeriesByGanji, getDangryeong,
//getSaryeong,



import { stemOrder, 
         branchOrder,
         saryeongMap,
         DANGRYEONGSHIK_MAP,
         jijiToSibganMap,
         firstHeesinMap
        } from './constants.js';
import { elementColors } from './renderUtils.js';
import { getJeolipDate } from './dateUtils.js'; // 절입일 계산 함수

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





const tenGodMap = {
  '갑': { '갑': '비견', '을': '겁재', '병': '식신', '정': '상관', '무': '편재', '기': '정재', '경': '편관', '신': '정관', '임': '편인', '계': '정인' },
  '을': { '갑': '겁재', '을': '비견', '병': '상관', '정': '식신', '무': '편재', '기': '정재', '경': '정관', '신': '편관', '임': '편인', '계': '정인' },
  '병': { '갑': '편인', '을': '정인', '병': '비견', '정': '겁재', '무': '식신', '기': '상관', '경': '편재', '신': '정재', '임': '편관', '계': '정관' },
  '정': { '갑': '편인', '을': '정인', '병': '겁재', '정': '비견', '무': '상관', '기': '식신', '경': '편재', '신': '정재', '임': '정관', '계': '편관' },
  '무': { '갑': '정관', '을': '편관', '병': '편인', '정': '정인', '무': '비견', '기': '겁재', '경': '식신', '신': '상관', '임': '편재', '계': '정재' },
  '기': { '갑': '편관', '을': '정관', '병': '편인', '정': '정인', '무': '겁재', '기': '비견', '경': '상관', '신': '식신', '임': '편재', '계': '정재' },
  '경': { '갑': '편재', '을': '정재', '병': '정관', '정': '편관', '무': '편인', '기': '정인', '경': '비견', '신': '겁재', '임': '식신', '계': '상관' },
  '신': { '갑': '편재', '을': '정재', '병': '편관', '정': '정관', '무': '편인', '기': '정인', '경': '겁재', '신': '비견', '임': '상관', '계': '식신' },
  '임': { '갑': '상관', '을': '식신', '병': '편재', '정': '정재', '무': '정관', '기': '편관', '경': '편인', '신': '정인', '임': '비견', '계': '겁재' },
  '계': { '갑': '식신', '을': '상관', '병': '편재', '정': '정재', '무': '편관', '기': '정관', '경': '편인', '신': '정인', '임': '겁재', '계': '비견' },
};

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
  const yangStems = ['갑', '병', '무', '경', '임'];
  return yangStems.includes(stemKor);
}

// 대운 방향 결정 함수: 성별 + 년간(한글) 기준
export function getDaYunDirection(gender, yearStemKor) {
  const isYang = yangStems.includes(yearStemKor);
  return (gender === 'male' && isYang) || (gender === 'female' && !isYang)
    ? 1
    : -1;
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

//육신함수
export function getTenGod(dayStemKor, targetStemKor) {
  return tenGodMap[dayStemKor]?.[targetStemKor] || '';
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
    const stem = stemOrder[i % 10];
    const branch = branchOrder[i % 12];
    ganji60.push(stem + branch);
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
    '갑': { stem: '을', branch: '축' }, '甲': { stem: '을', branch: '축' },
    '기': { stem: '을', branch: '축' }, '己': { stem: '을', branch: '축' },
    '을': { stem: '정', branch: '축' }, '乙': { stem: '정', branch: '축' },
    '경': { stem: '정', branch: '축' }, '庚': { stem: '정', branch: '축' },
    '병': { stem: '기', branch: '축' }, '丙': { stem: '기', branch: '축' },
    '신': { stem: '기', branch: '축' }, '辛': { stem: '기', branch: '축' },
    '정': { stem: '신', branch: '축' }, '丁': { stem: '신', branch: '축' },
    '임': { stem: '신', branch: '축' }, '壬': { stem: '신', branch: '축' },
    '무': { stem: '계', branch: '축' }, '戊': { stem: '계', branch: '축' },
    '계': { stem: '계', branch: '축' }, '癸': { stem: '계', branch: '축' },
  };
  return map[sewoonStem] || { stem: '갑', branch: '자' }; // 기본값
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
export function dangryeongshik(tianganArray, sajuChungan, sajuJiji, jijiToSibganMap) {
const firstHeesin = firstHeesinMap[dangryeong];
  return tianganArray.map((char, index) => {
    const highlightChungan = sajuChungan.includes(char);

    let highlightJiji = false;
    let wrapInParens = false;

    for (const jiji of sajuJiji) {
      const sibganList = jijiToSibganMap[jiji] || [];

      for (const item of sibganList) {
        const sibganChar = typeof item === 'string' ? item : item.char;
        const wrap = typeof item === 'string' ? false : item.wrap;

        if (sibganChar === char) {
          highlightJiji = true;
          if (wrap) wrapInParens = true;
        }
      }
    }

    return {
      char,
      highlightChungan,
      highlightJiji,
      isDangryeong: char === dangryeong,
      isFirstHeesin: char === firstHeesin,
      wrapInParens
    };
  });
}



