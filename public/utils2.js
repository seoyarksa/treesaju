// utils2.js
// public/utils2.js
import { stemOrder, branchOrder } from './constants.js';

const yangStems = ['갑', '병', '무', '경', '임'];


const hanToKorStem = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기',
  '庚': '경', '辛': '신', '壬': '임', '癸': '계'
};

export function convertHanToKorStem(han) {
  return hanToKorStem[han] || han;
}

const hanToKorBranch = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘',
  '辰': '진', '巳': '사', '午': '오', '未': '미',
  '申': '신', '酉': '유', '戌': '술', '亥': '해'
};

export function normalizeBranch(branch) {
  return hanToKorBranch[branch] || branch;
}
// 천간의 음양 여부 판단 (양간이면 true)
export function isYangStem(stemKor) {
  const yangStems = ['갑', '병', '무', '경', '임'];
  return yangStems.includes(stemKor);
}

// 대운 시작 나이 계산
export function calculateDaeyunAge(birthDate, jeolipDate, gender, yearStemKor) {
    console.log("🎯 calculateDaeyunAge 호출됨");
  console.log("🎯 yearStemKor 전달값:", yearStemKor);
  console.log("🎯 birthDate:", birthDate);
  console.log("🎯 jeolipDate:", jeolipDate);
  console.log("🎯 gender:", gender);
   if (!yearStemKor) {
    throw new Error('yearStemKor가 함수 인자로 전달되지 않았습니다.');
  }
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = (jeolipDate - birthDate) / msPerDay;
  const ageRaw = diffDays / 3;
  const isYang = isYangStem(yearStemKor);
  const isForward = (gender === 'male' && isYang) || (gender === 'female' && !isYang);

  let age = isForward ? ageRaw : 10 - ageRaw;

  // ✅ 음수 보정 (역행 시 음수일 수 있음)
  if (age < 0) {
    age += 10;
  }

  // ✅ 대운 시작 나이가 10 이상인 경우 10 빼기
  if (age >= 10) {
    age -= 10;
  }

  const roundedAge = Math.round(age * 10) / 10;
  console.log("🎯 diffDays:", diffDays.toFixed(4));
  console.log("🎯 ageRaw:", ageRaw.toFixed(4));
  console.log("🎯 isForward:", isForward);
  console.log("🎯 age (보정 후):", age.toFixed(4));
  console.log("🎯 roundedAge:", roundedAge);
  return Math.round(age * 10) / 10;
}





export function getJeolipDate(year, month) {
  const jeolgiTable = {
    1: { month: 2, day: 4 },
    2: { month: 3, day: 6 },
    3: { month: 4, day: 5 },
    4: { month: 5, day: 6 },
    5: { month: 6, day: 6 },
    6: { month: 7, day: 7 },
    7: { month: 8, day: 7 },
    8: { month: 9, day: 7 },
    9: { month: 10, day: 8 },
    10: { month: 11, day: 7 },
    11: { month: 12, day: 7 },
    12: { month: 1, day: 6 }
  };
  const jeolgi = jeolgiTable[month];
  const correctedYear = month === 12 ? year + 1 : year;
  return new Date(correctedYear, jeolgi.month - 1, jeolgi.day);
}


export function generateYearlyGanjiSeries(startGan, startJi, count = 10) {
  const series = [];

  const ganIndex = stemOrder.indexOf(startGan);
  const jiIndex = branchOrder.indexOf(startJi);

  for (let i = 0; i < count; i++) {
    const gan = stemOrder[(ganIndex + i) % 10];
    const ji = branchOrder[(jiIndex + i) % 12];
    series.push(gan + ji);
  }

  return series;
}

// utils2.js


export function generateYearlyGanjiSeries2(startYear) {
  startYear = Math.floor(startYear); // 소숫점 버림 처리
  const yearlyStems = [];
  const yearlyBranches = [];

  for (let i = 0; i < 10; i++) {
    const year = startYear + i;
    const { stem, branch } = getGanjiByYear(year);
    yearlyStems.push(stem);
    yearlyBranches.push(branch);
  }

  return { yearlyStems, yearlyBranches };
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

// 대운 방향 결정 함수: 성별 + 년간(한글) 기준
export function getDaYunDirection(gender, yearStemKor) {
  const yangStems = ['갑', '병', '무', '경', '임'];
  const isYang = yangStems.includes(yearStemKor);
  return (gender === 'male' && isYang) || (gender === 'female' && !isYang)
    ? 1
    : -1;
}




// utils2.js
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

