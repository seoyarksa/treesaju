// dateUtils.js
//함수종류
// calculateDaeyunAge, getJeolipDate, getCurrentDaeyunIndexFromStartAge




// 대운 시작 나이 계산
export function calculateDaeyunAge(birthDate, jeolipDate, gender, yearStemKor) {
  if (!yearStemKor) {
    throw new Error('yearStemKor가 함수 인자로 전달되지 않았습니다.');
  }

  // ✅ 반드시 thisTerm.date 기준
  const thisTermDate = new Date(jeolipDate.thisTerm.date);

  console.log('입력값 - birthDate:', birthDate);
  console.log('입력값 - thisTermDate:', thisTermDate);
  console.log('입력값 - gender:', gender);
  console.log('입력값 - yearStemKor:', yearStemKor);

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = (thisTermDate - birthDate) / msPerDay;
  console.log('diffDays (절입 - 출생, 일수):', diffDays);

  const isYang = ['갑', '병', '무', '경', '임'].includes(yearStemKor);
  console.log('isYang (천간 양 여부):', isYang);

  const isForward = (gender === 'male' && isYang) || (gender === 'female' && !isYang);
  console.log('isForward (대운 순행 여부):', isForward);

  // ✅ 순행/역행 공식 적용
  let age;
  if (isForward) {
    age = 10 + diffDays / 3;
  } else {
    age = -diffDays / 3;
  }
  console.log('계산된 age:', age);

  const finalAge = Number(age.toFixed(2));
  console.log('최종 대운 시작 나이:', finalAge);

  return finalAge;
}





