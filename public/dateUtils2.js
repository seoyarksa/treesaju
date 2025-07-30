// dateUtils.js
//함수종류
// calculateDaeyunAge, getJeolipDate, getCurrentDaeyunIndexFromStartAge




// 대운 시작 나이 계산
export function calculateDaeyunAge(birthDate, jeolipDate, gender, yearStemKor) {
  if (!yearStemKor) {
    throw new Error('yearStemKor가 함수 인자로 전달되지 않았습니다.');
  }
  console.log('입력값 - birthDate:', birthDate);
  console.log('입력값 - jeolipDate:', jeolipDate);
  console.log('입력값 - gender:', gender);
  console.log('입력값 - yearStemKor:', yearStemKor);

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = (jeolipDate - birthDate) / msPerDay;
  console.log('diffDays (절입 - 출생, 일수):', diffDays);

  const ageRaw = diffDays / 3;
  console.log('ageRaw (diffDays / 3):', ageRaw);

  const isYang = ['갑', '병', '무', '경', '임'].includes(yearStemKor);
  console.log('isYang (천간 양 여부):', isYang);

  const isForward = (gender === 'male' && isYang) || (gender === 'female' && !isYang);
  console.log('isForward (대운 순행 여부):', isForward);

  let age = isForward ? ageRaw : 10 - ageRaw;
  console.log('age (초기 대운 나이):', age);

  if (age < 0) {
    age += 10;
    console.log('age 음수 보정 후:', age);
  }

  if (age >= 10) {
    age -= 10;
    console.log('age 10 이상 보정 후:', age);
  }

  const finalAge = Number(age.toFixed(2));
  console.log('최종 대운 시작 나이:', finalAge);

  return finalAge;
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
