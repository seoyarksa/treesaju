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



