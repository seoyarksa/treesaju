// sajuUtils.js
//함수종류
//convertKorToHanStem, convertKorToHanBranch, convertHanToKorStem, normalizeBranch, 
// isYangStem, getDaYunDirection, generateDaYunStems, getTenGod, colorize, splitGanji, 
// getThreeLinesFromArray, generateDaYun, getGanjiByYear,
// generateYearlyGanjiSeries2, generateDaeyunBy60Gapja, getStartMonthBySewoonStem, 
// calculateSewonYear, findStartMonthIndex, generateMonthlyGanjiSeriesByGanji, getDangryeong,
//getSaryeong,



import { 
         saryeongMap, elementMap,
         DANGRYEONGSHIK_MAP,
         jijiToSibganMap,
         YANG_GAN, YIN_GAN,
         firstHeesinMap,
        HEESIN_GISIN_COMBINED, 
        HEESIN_BY_DANGRYEONG_POSITION, 
        GISIN_BY_DANGRYEONG_POSITION,
        tenGodMap,
        tenGodMapKor, 간합MAP,
        SARYEONGSHIK_MAP_WITH_ROLE, SAMHAP_SUPPORT,
        johuBasis, johuMap, johuMeaning,태과불급map, 특수태과불급map, SANGSAENG_MAP, SANGGEUK_MAP
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

  return `사령식: ${styled}`;
}




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




export function extractJijiSibgansWithMiddleInfo(sajuJijiArray) {
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
export function extractJijiHeesinGisin(dangryeong, sajuJijiArray) {
  const heesinMap = HEESIN_BY_DANGRYEONG_POSITION[dangryeong] || {};
  const gisinMap = GISIN_BY_DANGRYEONG_POSITION[dangryeong] || {};

  if (!Array.isArray(sajuJijiArray)) {
    //console.error('[ERROR] sajuJijiArray가 유효하지 않음:', sajuJijiArray);
    throw new Error('sajuJijiArray는 배열이어야 합니다.');
  }

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

  return {
    jijiHeesinList,
    jijiGisinList
  };
}




/////조후용신파트//////////////////////

export function extractSajuGanList(saju) {
  const { yearGan, monthGan, dayGan, hourGan, yearBranch, monthBranch, dayBranch, hourBranch } = saju;

  console.log("🟢 extractSajuGanList called with saju:", saju);

  // 1) 천간
  const ganListFromCheongan = [yearGan, monthGan, dayGan, hourGan].map(g => ({
    gan: g,
    tag: "天",
    isMiddle: false
  }));
  console.log("🔹 ganListFromCheongan:", ganListFromCheongan);

  // 2) 지지 → 지장간
  const ganListFromJiji = [yearBranch, monthBranch, dayBranch, hourBranch]
    .flatMap(j => {
      console.log("👉 처리중인 지지:", j, " → 매핑:", jijiToSibganMap[j]);
      return (jijiToSibganMap[j] || [])
        .filter(obj => obj.char)
        .map(obj => ({
          gan: obj.char,
          tag: "地",
          isMiddle: obj.isMiddle || false
        }));
    });
  console.log("🔹 ganListFromJiji:", ganListFromJiji);

  // 3) 합치기
  const all = [...ganListFromCheongan, ...ganListFromJiji];
  console.log("✅ combined before sort:", all);

  // 4) 십간 순서 정렬
  all.sort((a, b) => stemOrder.indexOf(a.gan) - stemOrder.indexOf(b.gan));
  console.log("✅ final sorted:", all);

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



///조후용신 나열
export function renderJohuCell(saju) {
  const ganList = extractSajuGanList(saju);
  // ✅ 적용타입 계산:조화판단
  const applyType = getJohuApplyType(saju);
  console.log("조후용신 적용 타입:", applyType);
// 1행: 천간 나열
const rowTop = `<tr><td colspan="9" style="text-align:left; padding:4px; background:#FFDDDD;">` 
  + `사주(천간): ` 
  + formatGanList(ganList, "天")   // (中) 표시는 그대로 유지
  + `</td></tr>`;

// 2행: 지지 나열
const rowMiddle = `<tr><td colspan="9" style="text-align:left; padding:4px; background:#FFDDDD;">`
  + `사주(지지): `
  + formatGanList(ganList, "地")   // (中) 표시는 그대로 유지
  + `</td></tr>`;


  // 3·4행: 조후용신 (9칸 구조)
  const johuChars = (johuMap[saju.monthBranch] || "").split("");
  const allGans = ganList.map(m => m.gan);

// 원국 천간 + 지지 (지장간 제외)
const baseGans = [
  saju.yearGan, saju.monthGan, saju.dayGan, saju.hourGan,
  saju.yearBranch, saju.monthBranch, saju.dayBranch, saju.hourBranch
];


// 기준 행
const johuRow1 = `
  <tr>
    <td rowspan="2" style="background-color:#e6f0ff;">조후용신<br>[적용:<span style="color:blue;">${applyType}</span>]</td>
    <td style="background-color:#fff8dc;">기준</td>
    ${johuChars.map((ch, i) => {
      const desc = johuMeaning[i] || "";
      console.log(`📌 기준 ${i}번째: ${ch}, 설명: ${desc}`);
      return `<td style="background-color:#fff8dc;">${ch ? `<span class="tooltip" data-desc="${desc}">${ch}</span>` : ""}</td>`;
    }).join("")}
  </tr>
`;

// 보유 행
const johuRow2 = `
  <tr>
    <td>보유</td>
    ${johuChars.map((ch, i) => {
      if (!ch) {
        // 값이 없으면 X 출력
        return `<td style="color:red">X</td>`;
      }
      const isOwned = baseGans.includes(ch);   // 천간+지지에서만 검사
      const desc = johuMeaning[i] || "";
      return isOwned 
        ? `<td><span class="tooltip" data-desc="${desc}" style="color:red">${ch}</span></td>`
        : `<td style="color:red">X</td>`;  // 값은 있으나 보유 X
    }).join("")}
  </tr>
`;


  return `
    <table style="border-collapse:collapse;width:100%;text-align:center;" border="1">
      ${rowTop}
      ${rowMiddle}
      ${johuRow1}
      ${johuRow2}
    </table>
  `;
}



///조화확인
export function getJohuApplyType(saju) {
  const { monthBranch, yearGan, monthGan, dayGan, hourGan,
          yearBranch, dayBranch, hourBranch } = saju;

  if (!monthBranch) return "無";

  // 월지 그룹별 목표 천간
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
  if (!target) return "無";

  // 1) 천간 확인 (년,월,일,시)
  const cheongan = [yearGan, monthGan, dayGan, hourGan];
  if (cheongan.includes(target)) return "양";

  // 2) 지지(중기 제외) → 지장간 펼치기
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch];
  for (const br of branches) {
    const sibganList = jijiToSibganMap[br] || [];
    const found = sibganList.find(obj => obj.char === target && !obj.isMiddle);
    if (found) return "중";
  }
// 2-1) 삼합 보정 체크
const SAMHAP_SUPPORT = {
    "酉-丑": "辛", "丑-酉": "辛",
    "子-辰": "癸", "辰-子": "癸",
    "卯-未": "乙", "未-卯": "乙",
    "午-戌": "丁", "戌-午": "丁",
  };
for (const br of branches) {
  const key = `${monthBranch}-${br}`;
  if (SAMHAP_SUPPORT[key]) {
    const targetFromSamhap = SAMHAP_SUPPORT[key];
    if (targetFromSamhap === target) {
      console.log("🟢 삼합 보정으로 양 판정:", key, "=>", targetFromSamhap);
      return "양";
    }
  }
}
  // 3) 없으면 음
  return "음";
}



//태과불급 함수


export function calculateTaegwaBulgeup(saju) {
  const monthGanji = { 
    gan: saju.monthGan, 
    ji: saju.monthBranch 
  };
  const dangryeong = getDangryeong(monthGanji.ji, daeyunAge, daYunDirection);

  console.log("🔥 calculateTaegwaBulgeup 실행됨", saju, dangryeong);

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


  console.log("🟢 cheongan:", cheongan);
  console.log("🟢 jijiList:", jijiList);
  console.log("🟢 countMap:", countMap);
  console.log("🟢 dangryeong:", dangryeong);

// 이후 태과 판정
for (const gan in countMap) {
  const cnt = countMap[gan];
  console.log(`▶ 태과 검사중 (천간): ${gan}, cnt=${cnt}`);
  // ... 태과 판정 로직 ...

    // ✅ 조건0: 천간이 3개 이상이면 무조건 태과
  if (cnt >= 3) {
    판정결과.push({ 구분: "태과", 원인: gan });
    console.log(`✅ 태과 판정 (천간 3개 이상 무조건): ${gan}, cnt=${cnt}`);
    continue; // 추가 조건 안 보고 다음 글자로 넘어감
  }
// 조건1: 천간에 2개 이상 + (당령 또는 월지 삼합일 때)
// 조건1: 천간에 2개 이상 + (당령/삼합과 같은 오행일 때)
if (cnt === 2) {
  const ganOhaeng = elementMap[gan];   // 현재 천간 → 오행
  const supportedOhaeng = getSupportedOhaeng(saju, dangryeong); // 당령+삼합 오행 Set

  // 📌 특수월 (寅·辰·申·戌): 반드시 글자가 당령과 같아야 태과
  if (["寅", "辰", "申", "戌"].includes(saju.monthBranch)) {
    if (gan === dangryeong) {  
      판정결과.push({ 구분: "태과", 원인: gan });
      console.log(`✅ 태과 (특수월 동일간): ${gan}, 월지=${saju.monthBranch}, 당령=${dangryeong}`);
    } else {
      console.log(`❌ 태과 아님 (특수월, 오행 같아도 글자 다름): ${gan}, 월지=${saju.monthBranch}, 당령=${dangryeong}`);
    }
  }
  // 📌 일반월: 천간 오행이 당령/삼합 오행과 일치해야 태과
  else {
    if (supportedOhaeng.has(ganOhaeng)) {
      판정결과.push({ 구분: "태과", 원인: gan });
      console.log(`✅ 태과 판정 (조건1+당령/삼합): ${gan}, 오행=${ganOhaeng}, 당령=${dangryeong}`);
    } else {
      console.log(`❌ 태과 아님 (조건1 불충족): ${gan}, 오행=${ganOhaeng}, 당령=${dangryeong}`);
    }
  }
}






// 조건2: 천간 1개 + (당령 또는 삼합)일 때
if (cnt === 1) {
  const sameAsDangryeong = dangryeong === gan;
  const sameAsSamhap = isValidSamhap(saju, gan);

  if (sameAsDangryeong || sameAsSamhap) {
    // 🔥 당령이 丙일 때 → 丁 있으면 원인=丙
    if (dangryeong === "丙" || isValidSamhap(saju, "丙")) {
      if (countMap["丙"] && countMap["丁"]) {
        판정결과.push({ 구분: "태과", 원인: "丙" });
        console.log(`🔥 태과 판정: 당령=${dangryeong}, 원인=丙 (丙+丁 모두 존재)`);
      }
    }

    // 🔥 당령이 丁일 때 → 丙 있으면 원인=丁
    if (dangryeong === "丁" || isValidSamhap(saju, "丁")) {
      if (countMap["丙"] && countMap["丁"]) {
        판정결과.push({ 구분: "태과", 원인: "丁" });
        console.log(`🔥 태과 판정: 당령=${dangryeong}, 원인=丁 (丙+丁 모두 존재)`);
      }
    }

    // 💧 당령이 壬일 때 → 癸 있으면 원인=壬
    if (dangryeong === "壬" || isValidSamhap(saju, "壬")) {
      if (countMap["壬"] && countMap["癸"]) {
        판정결과.push({ 구분: "태과", 원인: "壬" });
        console.log(`💧 태과 판정: 당령=${dangryeong}, 원인=壬 (壬+癸 모두 존재)`);
      }
    }

    // 💧 당령이 癸일 때 → 壬 있으면 원인=癸
    if (dangryeong === "癸" || isValidSamhap(saju, "癸")) {
      if (countMap["壬"] && countMap["癸"]) {
        판정결과.push({ 구분: "태과", 원인: "癸" });
        console.log(`💧 태과 판정: 당령=${dangryeong}, 원인=癸 (癸+壬 모두 존재)`);
      }
    }
  }
}



  }


// 2) 불급 판정 (조건1 + 조건2 통합)
const ganListNoMiddle = ganList.filter(g => !g.isMiddle);

const cheonganOnly = ganListNoMiddle.filter(g => g.tag === "天");
const jijiOnly = ganListNoMiddle.filter(g => g.tag !== "天");


stemOrder.forEach(gan => {
  const cntInCheongan = cheonganOnly.filter(g => g.gan === gan).length;
  const cntInJiji = jijiOnly.filter(g => g.gan === gan).length;
  const totalCnt = cntInCheongan + cntInJiji;

  // 조건1: 아예 없음
  if (totalCnt === 0) {
    판정결과.push({ 구분: "불급", 원인: gan, source: "basic" });
    console.log(`⚠️ 불급 판정 (조건1): ${gan} 없음 (천간+지지 전체, 중기 제외)`);
  }

  // 조건2: 천간에만 1개 있고, 지지에는 없음 (단, 丙·壬·戊·己는 제외)
  else if (
    cntInCheongan === 1 &&
    cntInJiji === 0 &&
    !["丙", "壬", "戊", "己"].includes(gan)
  ) {
    // 양간1 → 지지에 生해주는 글자가 없으면 불급
    if (YANG_GAN.includes(gan)) {
      const ganElement = elementMap[gan];           // ex) 丙 → 火
      const needElement = SANGSAENG_MAP['木'];      // 木이 생하는 대상 = 火
      const existsSaeng = jijiOnly.some(j => elementMap[j.gan] === '木');
      if (!existsSaeng) {
        판정결과.push({ 구분: "불급", 원인: gan, source: "양간1" });
        console.log(`⚠️ 불급 판정 (양간1): ${gan} → 지지에 木이 없어 火를 생하지 못함`);
      }
    }

    // 음간1 → 지지에 生 오행도 없고, 삼합 지원도 없으면 불급
    else if (YIN_GAN.includes(gan)) {
      const ganElement = elementMap[gan];           // ex) 丁 → 火
      const needElement = SANGSAENG_MAP[ganElement]; // 火 → 土 (생 받는 대상)
      const existsDirect = jijiOnly.some(j => elementMap[j.gan] === needElement);

      const existsSamhap = Object.entries(SAMHAP_SUPPORT).some(([pair, supportGan]) => {
        if (supportGan !== gan) return false;
        const [a, b] = pair.split("-");
        return jijiOnly.some(j => j.ji === a) && jijiOnly.some(j => j.ji === b);
      });

      if (!existsDirect && !existsSamhap) {
        판정결과.push({ 구분: "불급", 원인: gan, source: "음간1" });
        console.log(`⚠️ 불급 판정 (음간1): ${gan} → 지지에 ${needElement}나 삼합 뿌리가 없음`);
      }
    }
  }
});




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

// 투출/불투 판정 함수 (천간 4개 기준)
function checkTuchulOrBultu(gan, cheongan) {
  const inCheon = cheongan.some(g => g.gan === gan);
  return inCheon ? "투출" : "불투";
}

const 특수rules = 특수태과불급map[dangryeong] || [];

for (const rule of 특수rules) {
  const isMulti = multiListCheck.includes(rule.원인);   // 多 여부
  const tuchulType = checkTuchulOrBultu(rule.원인, cheongan);

  // 조건: 多하거나, 투출/불투에 맞는 경우만
  if (isMulti || tuchulType === rule.구분) {
    판정결과.push({
      구분: rule.구분,
      원인: rule.원인,
      tags: rule.tags,
      조건: rule.조건,
      藥: rule.藥,
      설명: rule.설명
    });
    console.log(`✨ 특수 규칙 적용: 당령=${dangryeong}, ${rule.구분} → ${rule.원인}`);
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

console.log("🟢 원본 tbList:", tbList);

// 🔹 상세 있는 줄 / 없는 줄 분리
const detailList = tbList.filter(r => (r.藥 || r.tags || r.설명));
console.log("📋 detailList (표로 출력):", detailList);

// 🔹 나열식(藥/설명 없는 것만 모음)
const simpleMap = tbList
  .filter(r => !(r.藥 || r.tags || r.설명))
  .reduce((acc, r) => {
    if (!acc[r.구분]) acc[r.구분] = [];
    acc[r.구분].push(r.원인);
    return acc;
  }, {});
console.log("📋 simpleMap (나열식):", simpleMap);

// 🔹 다한 천간(多) 추출
const multiList = extractMultiInfo(saju, ganList, countMap);
// 최종 반환
const result = tbList.length > 0 ? tbList : ["해당사항 없음"];
return { 
  list: tbList,
  detail: detailList, 
  simple: simpleMap,
  multi: multiList   // ← 여기 추가
};
}



//////////////////////////////////////태과불급관련 보조함수들///////



// 2-1) 삼합 보정 체크//////////


function isValidSamhap(saju, gan) {
  const { monthBranch } = saju;
  const allBranches = [
    saju.yearBranch,
    saju.monthBranch,
    saju.dayBranch,
    saju.hourBranch
  ];

  for (const key in SAMHAP_SUPPORT) {
    const [month, other] = key.split("-");
    const targetGan = SAMHAP_SUPPORT[key];

    if (targetGan !== gan) continue;

    // 월지가 조건에 맞고, 다른 지지가 포함될 때 성립
    if (monthBranch === month && allBranches.includes(other)) {
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
      if (SAMHAP_SUPPORT[key]) {
        return SAMHAP_SUPPORT[key]; // 삼합당령 글자 반환
      }
    }
  }
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




///多한 천간 추출함수/////////////////////////////////////////////////////////////////////////////////////////////////////////
function extractMultiInfo(saju, ganList, countMap) {
  const cheongan = ganList.filter(g => g.tag === "天" && !g.isMiddle);
  const jijiList = ganList.filter(g => g.tag !== "天" && !g.isMiddle);

  const result = [];

  // 0) 천간 3개 이상 → 무조건 多
  for (const gan of stemOrder) {
    const cntInCheongan = cheongan.filter(g => g.gan === gan).length;
    if (cntInCheongan >= 3) {
      result.push({ 글자: gan, type: "多" });
    }
  }

  // 0-1) 무기토 특례: 천간 합쳐서 3개 이상 → 무조건 多
  const cntMu = cheongan.filter(g => g.gan === "戊").length;
  const cntGi = cheongan.filter(g => g.gan === "己").length;
  if (cntMu + cntGi >= 3) {
    if (cntMu > 0) result.push({ 글자: "戊", type: "多" });
    if (cntGi > 0) result.push({ 글자: "己", type: "多" });
  }

  // 1) 일반 多: 천간 2개 이상 + 지지에 뿌리 존재
for (const gan of stemOrder) {
  const cntInCheongan = cheongan.filter(g => g.gan === gan).length;

  // 1-1) 직결 뿌리
  const existsInJiji = jijiList.some(g => g.gan === gan);

  // 1-2) 삼합 뿌리
  const existsInSamhap = Object.entries(SAMHAP_SUPPORT).some(([pair, supportGan]) => {
    if (supportGan !== gan) return false;
    const [a, b] = pair.split("-");
    return jijiList.some(j => j.ji === a) && jijiList.some(j => j.ji === b);
  });

  // 1-3) 당령을 생하는 경우
  const dangryeongElement = elementMap[dangryeong];   // 당령의 오행
  const ganElement = elementMap[gan];                 // 현재 천간의 오행
  const supportsDangryeong = SANGSAENG_MAP[ganElement] === dangryeongElement;

  if (
    cntInCheongan >= 2 &&
    (existsInJiji || existsInSamhap || supportsDangryeong)
  ) {
    result.push({ 글자: gan, type: "多" });
  }
}


  // 1-1) 특례: 병·임·무 → 천간 2개 이상이면 바로 多
  ["丙", "壬", "戊"].forEach(gan => {
    if ((countMap[gan] || 0) >= 2) {
      result.push({ 글자: gan, type: "多" });
    }
  });

  // 2) 무기토 多 (무/기 2개 이상 + 辰戌丑未 존재)
  const jijiSet = new Set([saju.yearBranch, saju.monthBranch, saju.dayBranch, saju.hourBranch]);
  if ((countMap["戊"] >= 2 || countMap["己"] >= 2) &&
      ["辰","戌","丑","未"].some(z => jijiSet.has(z))) {
    if (countMap["戊"] >= 2) result.push({ 글자: "戊", type: "多" });
    if (countMap["己"] >= 2) result.push({ 글자: "己", type: "多" });
  }

  // 2-1) 무기토 하나이면서 월지가 辰戌丑未 → 多
if ((countMap["戊"] === 1 || countMap["己"] === 1) &&
    ["辰","戌","丑","未"].includes(saju.monthBranch)) {
  if (countMap["戊"] === 1) result.push({ 글자: "戊", type: "多" });
  if (countMap["己"] === 1) result.push({ 글자: "己", type: "多" });
}

  // 3) 무기토 동주 多 (무진/무술/기미/기축 존재 + 무기토 동투)
  const ganjiList = [
    saju.yearGan + saju.yearBranch,
    saju.monthGan + saju.monthBranch,
    saju.dayGan + saju.dayBranch,
    saju.hourGan + saju.hourBranch
  ];
  const 무기토동주패턴 = ["戊辰", "戊戌", "己未", "己丑"];
  const has동주 = ganjiList.some(ganji => 무기토동주패턴.includes(ganji));
  if (has동주 && countMap["戊"] && countMap["己"]) {
    result.push({ 글자: "戊", type: "多" });
    result.push({ 글자: "己", type: "多" });
  }

  return result;
}


//////////////////태과불급 추출함수 끝//////////////////////////////////////////////////


export function renderTaegwaBulgeupList(result, saju, ganList, countMap) {
  console.log("📌 renderTaegwaBulgeupList input:", result);

  // ✅ 값이 없을 때
  if (!result) return `태과불급: 해당사항 없음`;

  let list = result;
  let simpleMap = null;

if (typeof result === "object" && !Array.isArray(result)) {
  // calculateTaegwaBulgeup 결과: { list, detail, simple, multi }
  list = result.detail && result.detail.length > 0 ? result.detail : result.list;
  simpleMap = result.simple || null;

  // ✅ 여기서 중복 제거
if (Array.isArray(list)) {
  const seen = new Set();
  list = list.filter(item => {
    // key를 모든 주요 속성으로 구성
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
}


  // ✅ 완전히 빈 경우
  if (
    !list ||
    (Array.isArray(list) && (
      list.length === 0 ||
      (list.length === 1 && typeof list[0] === "string" && list[0].trim() === "해당사항 없음")
    )) ||
    (typeof list === "string" && list.trim() === "")
  ) {
    return `태과불급: 해당사항 없음`;
  }

  if (typeof list === "string") {
    return `태과불급: ${list}`;
  }

  if (!Array.isArray(list)) {
    list = [list];
  }

  // ✅ 메인 테이블은 '藥'이 있는 경우만 출력
  const hasYak = list.some(item => item.藥);
  let tableHTML = "";

  if (hasYak) {
    const rows = list.map(item => {
      const 구분 = item.구분 || item.type || "";
      const 원인 = item.원인 || item.gan || "";
      const tags = item.tags?.join(", ") || "";

      let yakStr = "";
      if (Array.isArray(item.藥)) {
        yakStr = item.藥.map(
          y => `<span class="tooltip" data-desc="${y.설명 || ''}">${y.글자}</span>`
        ).join(", ");
      } else if (item.藥) {
        yakStr = `<span class="tooltip" data-desc="${item.설명 || ''}">${item.藥}</span>`;
      }

      const 조건 = item.조건
  ? `<span class="tooltip" data-desc="${item.조건.설명2 || ''}">
       ${item.조건.글자} ${item.조건.설명 ? "(" + item.조건.설명 + ")" : ""}
     </span>`
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
          <th rowspan="${list.length + 1}" style="padding:4px; background:#e6f0ff;">태과불급</th>
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
    // 👉藥이 전혀 없으면 해당사항 없음
    tableHTML = `당령관련 태과불급: 해당사항 없음`;
  }

  // ✅ simpleMap (나열식)
let simpleHTML = "";
if (simpleMap && Object.keys(simpleMap).length > 0) {
  const taegwa = (simpleMap["태과"] || []);
  const bulgeup = (simpleMap["불급"] || []);
  const multi = (simpleMap["多"] || []);


// 이미 추출된 목록들
// 多 리스트
// 多 리스트 (중복 제거)
const multiList = Array.from(
  new Set((result.multi || []).map(m => m.글자))
);


// 태과 리스트
const taegwaList = (result.simple && result.simple["태과"]) ? result.simple["태과"] : [];

// "藥" 값이 있는 항목에서만 원인 글자 추출
const originFromDetail = (result.detail || [])
  .filter(r => r.藥)   // 약값 있는 것만
  .map(r => r.원인);

// 태과글자 + 원인글자 합치고 중복 제거
const originList = [...new Set([...taegwaList, ...originFromDetail])];



// 🔹 로그 확인
console.log("🔍 result.detail:", result.detail);
console.log("🔍 originFromDetail (藥 있는 원인):", originFromDetail);
console.log("🔍 taegwaList (태과 글자):", taegwaList);
console.log("🔍 originList (합쳐서 중복제거):", originList);


simpleHTML = `
  <table style="border-collapse:collapse; width:100%; text-align:center; margin-top:8px;" border="1">
    <tr style="background:#f9f9f9;">
      <th style="padding:4px; background:#e6f0ff;">多한 글자</th>
      <th style="padding:4px; background:#e6f0ff;">부족한 글자</th>
      <th style="padding:4px; background:#e6f0ff;">태과불급</th>
    </tr>
    <tr>
      <td style="border:1px solid #ccc; padding:4px;">${multiList.join(", ") || "-"}</td>
      <td style="border:1px solid #ccc; padding:4px;">${bulgeup || "-"}</td>
      <td style="border:1px solid #ccc; padding:4px; background:#FFDFFF;">${originList.join(", ") || "-"}</td>
    </tr>
  </table>
`;

  }

  return tableHTML + simpleHTML;
}




}

