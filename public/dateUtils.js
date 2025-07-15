// dateUtils.js
//함수종류
// calculateDaeyunAge, getJeolipDate, getCurrentDaeyunIndexFromStartAge


// 대운 시작 나이 계산
export function calculateDaeyunAge(birthDate, jeolipDate, gender, yearStemKor) {
   if (!yearStemKor) {
    throw new Error('yearStemKor가 함수 인자로 전달되지 않았습니다.');
  }
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = (jeolipDate - birthDate) / msPerDay;
  const ageRaw = diffDays / 3;

  const isYang = ['갑', '병', '무', '경', '임'].includes(yearStemKor);
  const isForward = (gender === 'male' && isYang) || (gender === 'female' && !isYang);
  
  let age = isForward ? ageRaw : 10 - ageRaw;

  // 음수 보정 (역행 시 음수일 수 있음)
  if (age < 0) {
    age += 10;
  }

  // 대운 시작 나이가 10 이상인 경우 10 빼기
  if (age >= 10) {
    age -= 10;
  }
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
