// gyeokUtils.js


import { 
         elementMap,
         saryeongMap,
         DANGRYEONGSHIK_MAP,
         yukshinToKey,
         jijiToSibganMap2,
         gyeokjijiToSibganMap,
         firstHeesinMap, 
         tenGodMap, 간합MAP,
         SAMHAP_SUPPORT,
         GYEOKGUK_TYPES,
         samhapGroups,
         isYangStem,
         GYEOK_USE_GU_MAP,
         GYEOK_RELATIONS,
         길신격_목록,
         흉신격_목록,
         YUKSHIN_COUNTERS,
         GYEOK_YUKSHIN_MAP, jijiToSibganMap, jijiToSibganMap3, ganRootMap, GYEOK_SEONGPAE_MAP,
        } from './constants.js';

import { hanToKorStem,
        convertKorToHanStem,
        convertKorToHanBranch, getDangryeong,
        } from './sajuUtils.js';


export function isCountering(yukshin1, yukshin2) {
  const counters = YUKSHIN_COUNTERS[yukshin1] || [];
  return counters.includes(yukshin2);
}

        // 음양 판단 함수
// yinYangUtils.js 또는 gyeokUtils.js 상단에 추가
const YANG_STEMS = ['甲', '丙', '戊', '庚', '壬'];
const YIN_STEMS = ['乙', '丁', '己', '辛', '癸'];

export function sameYinYang(stem1, stem2) {
  return (
    (YANG_STEMS.includes(stem1) && YANG_STEMS.includes(stem2)) ||
    (YIN_STEMS.includes(stem1) && YIN_STEMS.includes(stem2))
  );
}

// 생(생성) 관계 매핑
const generationMap = {
  '甲': '丙', '乙': '丁',
  '丙': '戊', '丁': '己',
  '戊': '庚', '己': '辛',
  '庚': '壬', '辛': '癸',
  '壬': '甲', '癸': '乙',
};

// 극(제어) 관계 매핑
const controlMap = {
  '甲': '戊', '乙': '己',
  '丙': '庚', '丁': '辛',
  '戊': '壬', '己': '癸',
  '庚': '甲', '辛': '乙',
  '壬': '丙', '癸': '丁',
};





// 생 관계 함수
export function isGenerating(fromStem, toStem) {
  return generationMap[fromStem] === toStem;
}

// 극 관계 함수
export function isControlling(fromStem, toStem) {
  return controlMap[fromStem] === toStem;
}



export function isSangsinInCheonganOrJijiHidden(saju, dayGan, gyeokName) {
  // 1. 천간 4글자(한자화)
  const cheongans = [
    convertKorToHanStem(saju.yearGan),
    convertKorToHanStem(saju.monthGan),
    convertKorToHanStem(saju.dayGan),
    convertKorToHanStem(saju.hourGan),
  ];

  // 2. 지지 4글자(한자화)
  const branches = [
    convertKorToHanBranch(saju.yearBranch),
    convertKorToHanBranch(saju.monthBranch),
    convertKorToHanBranch(saju.dayBranch),
    convertKorToHanBranch(saju.hourBranch),
  ];

  // 3. 각 지지에서 지장간 추출 (중첩 배열 → flat)
  const allHiddenStems = branches.flatMap(branch => jijiToSibganMap2[branch] || []);

  // 4. 상신명 추출
  const map = GYEOK_YUKSHIN_MAP[gyeokName] || GYEOK_RELATIONS[gyeokName];
  if (!map || (!map.sangsin && !map.use)) return false;
  const sangsinName = map.sangsin || map.use.char;

  // 5. 천간에서 상신 찾기
  for (const stem of cheongans) {
    if (getYukshinNameFromStems(dayGan, stem) === sangsinName) {
      return true;
    }
  }

  // 6. 지지의 모든 지장간에서 상신 찾기
  for (const stem of allHiddenStems) {
    if (getYukshinNameFromStems(dayGan, stem) === sangsinName) {
      return true;
    }
  }

  return false;
}





// 1. 격국 종류 상수 정의 
// 천간한글 → 한자
export function getYukshin(dayGan, targetGan) {
  const result = tenGodMap[dayGan]?.[targetGan];
  return result ? result + '격' : '판별불가';
}
// 격국 이름 반환 함수
export function getGyeokName(dayGanHanja, gyeokGanHanja) {
  // 월비/월겁격이 들어오면 바로 반환
  if (gyeokGanHanja === '월비격') {
    return '월비격';
  }
  if (gyeokGanHanja === '월겁격') {
    return '월겁격';
  }

  // ---- 이하 기존 코드 유지 ----
  let yukshin = tenGodMap[dayGanHanja]?.[gyeokGanHanja];
  if (!yukshin) return `판별불가(육신불가:${gyeokGanHanja})`;

  if (Array.isArray(yukshin)) {
    yukshin = yukshin[0];
  }
  const key = yukshinToKey[yukshin];
  if (!key) return `판별불가(미정의:${yukshin})(${gyeokGanHanja})`;

  return `${GYEOKGUK_TYPES[key]}(${gyeokGanHanja})`;
}



// 격국 판별 함수 (조건은 샘플이므로 나중에 사주 구조에 맞게 수정 필요)

export function hasSamhap(monthJi, otherJijiArr) {
  if (!Array.isArray(otherJijiArr)) {
    //console.error('otherJijiArr is not array:', otherJijiArr); // ← 임시로 찍어보기
    return false;
  }
  const group = samhapGroups.find(group => group.includes(monthJi));
  if (!group) return false;
  return group
    .filter(ji => ji !== monthJi)
    .some(ji => otherJijiArr.includes(ji));
}


// 주격 판별함수////////////////////////////////////////////////////

export function getGyeokForMonth({ monthJi, saryeong, chunganList, dayGan, daeyunAge, daYunDirection, saju, otherJijiArr}) {
  const jijiSibgans = jijiToSibganMap2[monthJi];
  if (!jijiSibgans || jijiSibgans.length === 0) return null;



  ///////////////////////////////////////////////////////////////////////////////////// 1. 인신사해월
  if (['寅', '申', '巳', '亥'].includes(monthJi)) {

 // 1. 건록/양인 우선 판정!

  const lastStem = jijiSibgans[jijiSibgans.length - 1];
  const yukshin = getYukshinNameFromStems(dayGan, lastStem);

  if (yukshin === '비견') { // 건록격
    if (YIN_STEMS.includes(dayGan)) {
      const hasUse = isSangsinInCheonganOrJijiHidden(saju, dayGan, '건록격');
      if (!hasUse) {
        return { char: '월비격', stem: lastStem, wrap: false };
      }
    }
    return { char: GYEOKGUK_TYPES.BIGYEON, stem: lastStem, wrap: false };
  }
  if (yukshin === '겁재') { // 양인격
    if (YIN_STEMS.includes(dayGan)) {
      const hasUse = isSangsinInCheonganOrJijiHidden(saju, dayGan, '양인격');
      if (!hasUse) {
        return { char: '월겁격', stem: lastStem, wrap: false };
      }
    }
    return { char: GYEOKGUK_TYPES.GEOBJAE, stem: lastStem, wrap: false };
  }


//2. 건록 양인이 아니면 이후로 판정

const second = jijiSibgans[0]; // 중기
const third = jijiSibgans[1];  // 정기


    const hasSamhapValue = hasSamhap(monthJi, otherJijiArr);

    const secondInChungan = chunganList.includes(second);
    const thirdInChungan = chunganList.includes(third);

    if (
      saryeong === second &&
      hasSamhapValue &&
      secondInChungan &&
      !thirdInChungan
    ) {
      const gyeokChar = getGyeokName(dayGan, second);
      return { char: gyeokChar, stem: second };
    }
    const gyeokChar = getGyeokName(dayGan, third);
    return { char: gyeokChar, stem: third };
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////// 2. 자오묘유월
if (['子', '午', '卯', '酉'].includes(monthJi)) {

 // 1. 건록/양인 우선 판정!
  const lastStem = jijiSibgans[jijiSibgans.length - 1];
  const yukshin = getYukshinNameFromStems(dayGan, lastStem);

  if (yukshin === '비견') { // 건록격
    if (YIN_STEMS.includes(dayGan)) {
      const hasUse = isSangsinInCheonganOrJijiHidden(saju, dayGan, '건록격');
      if (!hasUse) {
        return { char: '월비격', stem: lastStem, wrap: false };
      }
    }
    return { char: GYEOKGUK_TYPES.BIGYEON, stem: lastStem, wrap: false };
  }
  if (yukshin === '겁재') { // 양인격
    if (YIN_STEMS.includes(dayGan)) {
      const hasUse = isSangsinInCheonganOrJijiHidden(saju, dayGan, '양인격');
      if (!hasUse) {
        return { char: '월겁격', stem: lastStem, wrap: false };
      }
    }
    return { char: GYEOKGUK_TYPES.GEOBJAE, stem: lastStem, wrap: false };
  }


//2. 건록 양인이 아니면 이후로 판정
  
    const first = jijiSibgans[0];
  const last = jijiSibgans[1]; // 항상 두번째가 정기
  const kingElements = jijiSibgans.map(g => elementMap[g]);

  // 1. 천간에서 왕지 오행과 같은 모든 글자
  const cheonganWithKingElement = chunganList.filter(gan => kingElements.includes(elementMap[gan]));

  // 2. 천간에 왕지 오행이 아예 없으면 → 정기(마지막) 격
  if (cheonganWithKingElement.length === 0) {
    return { char: getGyeokName(dayGan, last), stem: last };
  }

  // 3. 천간에 있는 왕지 오행 종류(집합)
  const cheonganElementSet = new Set(cheonganWithKingElement.map(gan => elementMap[gan]));

  if (cheonganElementSet.size === 1) {
    // 오행이 1가지(甲甲, 丁丁, ...) → 그 오행의 천간 아무거나(보통 첫 번째) 격
    return { char: getGyeokName(dayGan, cheonganWithKingElement[0]), stem: cheonganWithKingElement[0] };
  }

  // 4. 오행이 2가지 이상(甲乙 등) → 사령과 같은 오행의 천간이 있으면 그 천간, 없으면 "사령" 자체를 격으로
  const saryeongElement = elementMap[saryeong];
  const saryeongInCheongan = cheonganWithKingElement.find(gan => elementMap[gan] === saryeongElement);

  // 아래 if는 논리상 항상 true!
  return { char: getGyeokName(dayGan, saryeongInCheongan), stem: saryeongInCheongan };
}



 ///////////////////////////////////////////////////////////////////////////////////////////////// 3. 진술축미월 (고지)
if (['辰', '戌', '丑', '未'].includes(monthJi)) {
  const stems = jijiToSibganMap2[monthJi]; // [여기, 중기, 정기]
  const [yeogi, junggi, jeonggi] = stems;

  const hasSamhapValue = hasSamhap(monthJi, otherJijiArr);

  // 1. 삼합 먼저 판단
  if (hasSamhapValue) {
    const junggiElement = elementMap[junggi];
    const junggiInCheongan = chunganList.find(g => elementMap[g] === junggiElement);

    // 삼합격 후보 구함
    const samhapGyeokStem = junggiInCheongan || junggi;
    //console.log( '[삼합] 후보:', samhapGyeokStem,  '오행:', elementMap[samhapGyeokStem], '| 일간:', dayGan,  '오행:', elementMap[dayGan],  '| 같으면 SKIP(동오행)'     );
    if (elementMap[samhapGyeokStem] !== elementMap[dayGan]) {
      return { char: getGyeokName(dayGan, samhapGyeokStem), stem: samhapGyeokStem };
    }
    // 동오행이면 SKIP! 아래 단계로 계속
  }

  // 2. 전/후반(여기/정기) 판단
  const value = daeyunAge;
  let isFirstPeriod, isSecondPeriod;
  if (daYunDirection === 1) { // 순행
    isFirstPeriod = value > 6;
    isSecondPeriod = value <= 6;
  } else { // 역행
    isFirstPeriod = value <= 4;
    isSecondPeriod = value > 4;
  }

  // 후반기(정기)
  if (isSecondPeriod) {
    const jeonggiElement = elementMap[jeonggi];
    const jeonggiInCheonganList = chunganList.filter(g => elementMap[g] === jeonggiElement);
    const jeonggiFirstCandidate =
      jeonggiInCheonganList.length === 1
        ? jeonggiInCheonganList[0]
        : jeonggi;

    if (elementMap[jeonggiFirstCandidate] !== elementMap[dayGan]) {
      return { char: getGyeokName(dayGan, jeonggiFirstCandidate), stem: jeonggiFirstCandidate };
    }

    // 2순위: 전반기(여기) 후보(천간 포함 우선)
    const yeogiElement = elementMap[yeogi];
    const yeogiInCheonganList = chunganList.filter(g => elementMap[g] === yeogiElement);
    const yeogiSecondCandidate =
      yeogiInCheonganList.length === 1
        ? yeogiInCheonganList[0]
        : yeogi;

    if (elementMap[yeogiSecondCandidate] !== elementMap[dayGan]) {
      return { char: getGyeokName(dayGan, yeogiSecondCandidate), stem: yeogiSecondCandidate };
    }

    // 둘 다 동오행(건록/양인)일 때만 판별불가
    return { char: '판별불가', wrap: false };
  }

  // 전반기(여기)
  if (isFirstPeriod) {
    const yeogiElement = elementMap[yeogi];
    const yeogiInCheonganList = chunganList.filter(g => elementMap[g] === yeogiElement);
    const yeogiFirstCandidate =
      yeogiInCheonganList.length === 1
        ? yeogiInCheonganList[0]
        : yeogi;

    if (elementMap[yeogiFirstCandidate] !== elementMap[dayGan]) {
      return { char: getGyeokName(dayGan, yeogiFirstCandidate), stem: yeogiFirstCandidate };
    }

    // 2순위: 후반기(정기) 후보(천간 포함 우선)
    const jeonggiElement = elementMap[jeonggi];
    const jeonggiInCheonganList = chunganList.filter(g => elementMap[g] === jeonggiElement);
    const jeonggiSecondCandidate =
      jeonggiInCheonganList.length === 1
        ? jeonggiInCheonganList[0]
        : jeonggi;

    if (elementMap[jeonggiSecondCandidate] !== elementMap[dayGan]) {
      return { char: getGyeokName(dayGan, jeonggiSecondCandidate), stem: jeonggiSecondCandidate };
    }

    // 둘 다 동오행(건록/양인)일 때만 판별불가
    return { char: '판별불가', wrap: false };
  }

  // 최종적으로 모두 동오행이면
  return { char: '판별불가', wrap: false };
}



//아래는 함수 닫는 괄호[노랑색]
}










//////보조격 구하는 함수
 export function getSecondaryGyeok({
  monthJi,
  saryeong,
  jijiSibgans,
  chunganList,
  dayGan,
  primaryStem,
  daeyunAge,
  daYunDirection,
  primaryChar,
  otherJijiArr
}) {

  //건록양인월겁월비격의 보조격



  // 1. 생지(寅申巳亥) 보조격 판별
  if (['寅', '申', '巳', '亥'].includes(monthJi)) {
////////우선 선별조건
  if (
    primaryChar === '양인격' ||
    primaryChar === '건록격' ||
    primaryChar === '월비격' ||
    primaryChar === '월겁격'
  ) {
    return null;
  }

////이후 보조격 판단

    const junggi = jijiSibgans[0];
    const jeonggi = jijiSibgans[1];

    const isSamhap = hasSamhap(monthJi, otherJijiArr);
    const isJunggiSaryeong = saryeong === junggi;
    const junggiInChungan = chunganList.includes(junggi);
    const jeonggiInChungan = chunganList.includes(jeonggi);

    if (isSamhap && isJunggiSaryeong && junggiInChungan) {
      if (jeonggiInChungan) {
        return {
          primary: { char: getGyeokName(dayGan, jeonggi), stem: jeonggi },
          secondary: { char: getGyeokName(dayGan, junggi), stem: junggi }
        };
      } else {
        return {
          primary: { char: getGyeokName(dayGan, junggi), stem: junggi },
          secondary: { char: getGyeokName(dayGan, jeonggi), stem: jeonggi }
        };
      }
    }
    return null;
  }

  // 2. 왕지(子午卯酉) 보조격 판별
  if (['子', '午', '卯', '酉'].includes(monthJi)) {


////////우선 선별조건
  if (
    primaryChar === '양인격' ||
    primaryChar === '건록격' ||
    primaryChar === '월비격' ||
    primaryChar === '월겁격'
  ) {
    return null;
  }

////이후 보조격 판단


    if (primaryStem && primaryStem !== saryeong) {
      return { char: getGyeokName(dayGan, saryeong), stem: saryeong };
    }
    return null;
  }

  // 3. 고지(辰戌丑未) 보조격 판별
  if (['辰', '戌', '丑', '未'].includes(monthJi)) {
  const [yeogi, junggi, jeonggi] = jijiSibgans;

  // 1. 삼합 성립: 중기(junggi) 사령, 주격이 중기 아니면
  if (hasSamhap(monthJi, otherJijiArr)) {
    if (primaryStem !== junggi) {
      const candidateChar = getGyeokName(dayGan, junggi);
      //console.log('보조격 후보-삼합:', candidateChar, 'stem:', junggi);

      // 보조격 후보가 4격이면 SKIP, 다음 단계로 진행
if (
  !['월비격', '월겁격', '건록격', '양인격'].some(type => candidateChar.startsWith(type))
) {
  return { char: candidateChar, stem: junggi };
}

      // else: SKIP, 아래 전/후반 분기로 계속!
    } else {
      return null; // 삼합인데 주격이 중기면 보조격 없음!
    }
  }

  // 2. 삼합X - 4:6 분할(전반:여기, 후반:정기), 대운 방향 반영
  const value = daeyunAge;
  let isFirstPeriod, isSecondPeriod;
  if (daYunDirection === 1) { // 순행
    isFirstPeriod = value > 6;      // 7~10년차(전반, 여기)
    isSecondPeriod = value <= 6;    // 1~6년차(후반, 정기)
  } else { // 역행
    isFirstPeriod = value <= 4;     // 1~4년차(전반, 여기)
    isSecondPeriod = value > 4;     // 5~10년차(후반, 정기)
  }

  // 전반(여기) 우선
  if (isFirstPeriod) {
    if (primaryStem !== yeogi) {
      const candidateChar = getGyeokName(dayGan, yeogi);
     //console.log('보조격 후보-전기:', candidateChar, 'stem:', yeogi);

if (
  !['월비격', '월겁격', '건록격', '양인격'].some(type => candidateChar.startsWith(type))
) {
  return { char: candidateChar, stem: yeogi };
}

      // else: SKIP, 후반(정기)로!
    }
  }
  // 후반(정기)
  if (isSecondPeriod) {
    if (primaryStem !== jeonggi) {
      const candidateChar = getGyeokName(dayGan, jeonggi);
     // console.log('보조격 후보-후기:', candidateChar, 'stem:', junggi);
if (
  !['월비격', '월겁격', '건록격', '양인격'].some(type => candidateChar.startsWith(type))
) {
  return { char: candidateChar, stem: jeonggi };
}

    }
  }
  // 모든 후보가 4격이면 보조격 없음
  return null;
}


  // 기타 월령은 보조격 없음
  return null;
}







/////////////////////상신구신관련
/////////////////////상신구신관련
export function getUseGuByGyeok(gyeokChar) {
  return GYEOK_USE_GU_MAP[gyeokChar] || { use: '없음', seek: '없음' };
}




export function getStemForYukshin(dayGan, yukshinName) {
  const map = tenGodMap[dayGan];
  if (!map) return null;

  for (const [stem, tenGod] of Object.entries(map)) {
    if (tenGod === yukshinName) {
      return stem;
    }
  }
  return null;
}

// ✅ 천간 기준으로 육신 이름을 리턴
export function getYukshinNameFromStems(dayGan, otherStem) {
  const map = tenGodMap[dayGan];
  if (!map) return null;
  return map[otherStem] || null;
}

// 1. 천간과 지지에서 추출된 지장간을 태그를 붙여 저장
export function extractTaggedStems(saju) {
   // console.log('🟢 extractTaggedStems called with saju:', saju);
 const { yearGan, monthGan, hourGan, yearBranch, monthBranch, dayBranch, hourBranch } = saju;

 // ✅ 한글 → 한자로 변환
  const cheongans = [
    convertKorToHanStem(yearGan),
    convertKorToHanStem(monthGan),
    convertKorToHanStem(hourGan),
  ];

  const jijiList = [
    convertKorToHanBranch(yearBranch),
    convertKorToHanBranch(monthBranch),
    convertKorToHanBranch(dayBranch),
    convertKorToHanBranch(hourBranch),
  ];
  const gyeokjijiHiddenStems = jijiList.map(branch => gyeokjijiToSibganMap[branch] || []);

  const stemsFromSky = cheongans.map(stem => `${stem}(天)`);
  const stemsFromEarth = gyeokjijiHiddenStems.flat().map(stem => `${stem}(地)`);

  const taggedStems = [];

  //console.log('🔹 천간 기반(天):', stemsFromSky);
  //console.log('🔹 지지 기반(地):', stemsFromEarth);

  cheongans.forEach(stem => {
    taggedStems.push({ stem, tag: '天' });
  });

  gyeokjijiHiddenStems.forEach(hiddenGroup => {
    hiddenGroup.forEach(stem => {
      taggedStems.push({ stem, tag: '地' });
    });
  });

 // console.log('🔹 태그된 간지:', taggedStems);
  return taggedStems;
}

// 2. 태그된 천간/지장간에 육신 이름 부여
export function nameYukshinFromStems(taggedStems, dayGan) {
  
  dayGan = convertKorToHanStem(dayGan); // 변환 유지
  const namedStems = taggedStems.map(({ stem, tag }) => {
    const yukshin = getYukshinNameFromStems(dayGan, stem); // ✅ 수정된 함수 사용
    return {
      yukshin,
      stem,
      tag,
      label: `${yukshin}[${stem}(${tag})]`
    };
  });

  //console.log('🔹 육신 이름 지정된 간지 목록:', namedStems);
  return namedStems;
}


// 중복육신 모두 추출[3.analyzeGyeokRelations에서 사용]
function getYukshinItems(yukshinList, yukshinName) {
  if (!yukshinName) return [];
  const result = yukshinList.filter(item => item.yukshin === yukshinName);
  //console.log(`getYukshinItems: 찾는 육신명(${yukshinName}), 결과개수(${result.length})`);
  return result;
}







// 3. 격국에 따라 상신/구신/기신1/기신2/합신 찾기
export function analyzeGyeokRelations(gyeok, dayGan, saju) {
  const gyeokNameRaw = gyeok.char || '';
  const gyeokName = gyeokNameRaw.replace(/\(.*\)/, '').trim();
  //console.log('🛠️ analyzeGyeokRelations called');
  //console.log('격 이름:', gyeokName);
  const isGoodGyeok = 길신격_목록.includes(gyeokName);
  const isBadGyeok = 흉신격_목록.includes(gyeokName);

  if (!isGoodGyeok && !isBadGyeok) {
    //console.warn('⚠️ 알 수 없는 격국:', gyeokName);
    return null;
  }

  const tagged = extractTaggedStems(saju);
    //console.log('추출된 tagged stems:', tagged);
  const yukshinList = nameYukshinFromStems(tagged, dayGan);
   //console.log('전체 육신 목록 (label):', yukshinList.map(i => i.label));
    // ✅ 여기에 추가


  const map = GYEOK_YUKSHIN_MAP[gyeokName];
  if (!map) {
    //console.warn('⚠️ GYEOK_YUKSHIN_MAP에 정의되지 않은 격국:', gyeokName);
    return null;
  }

  const sangsinItems = getYukshinItems(yukshinList, map.sangsin);
  const gusinItems = getYukshinItems(yukshinList, map.gusin);
  const gisin1Items = getYukshinItems(yukshinList, map.gisin1);
  const gisin2Items = getYukshinItems(yukshinList, map.gisin2);
  const gyeokStems = getYukshinItems(yukshinList, map.gyeokname2);
 // console.log('격 이름에 해당하는 stems:', gyeokStems);



  console.log(`🔍 격국 분석 (${gyeokName})`);
  console.log('📌 일간:', dayGan);
  console.log('📌 전체 육신 목록:', yukshinList.map(i => i.label));
  console.log('✅ 상신:', sangsinItems.map(i => i.label));
  console.log('✅ 구신:', gusinItems.map(i => i.label));
  console.log('⚠️ 기신1:', gisin1Items.map(i => i.label));
  console.log('⚠️ 기신2:', gisin2Items.map(i => i.label));
  console.log('⚠️ 격:', gyeokStems.map(i => i.label));
console.log('gyeokName (type/length):', typeof gyeokName, gyeokName.length, `"${gyeokName}"`);

  return {
   gyeok: {
    char: gyeokName,         // ex: '정인격'
    dayGan,
    name: map.gyeokname2,     // ex: '정인' ← 이게 parseYukshinArray에 들어갈 이름
    items: gyeokStems,       // 육신 객체들 (stem, label, tag 등)
  },
    sangsin: sangsinItems,
    gusin: gusinItems,
    gisin1: gisin1Items,
    gisin2: gisin2Items,
    gyeokname2:gyeokStems,
    all: yukshinList,
  };
}




// 필요 함수: yukshin → 천간/지지에서 추출된 stem 한 쌍
function getStemsForYukshin(taggedStems, yukshinName) {
  const heavenObj = taggedStems.find(
    (item) => item.yukshin === yukshinName && item.tag === '天'
  );
  const earthObj = taggedStems.find(
    (item) => item.yukshin === yukshinName && item.tag === '地'
  );

  return {
    heaven: heavenObj?.stem || 'x',
    earth: earthObj?.stem || 'x',
  };
}



// 4. 시각화 도식///////////////////////////////////////////////////////////////////////////////////////////////////////////
export function renderGyeokFlowStyled(gyeok, saju, secondaryGyeok = null) {

  function _renderSingle(gyeokObj) {
 // console.log('[renderGyeokFlowStyled] 호출됨:', { gyeok, saju });
    if (!gyeokObj || !saju) return '정보 없음';

  function parseYukshinArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(({ label }) => {
      const match = label.match(/^(.+?)\[(.+?)\]$/);
      return match
        ? { yukshin: match[1], stemText: match[2] }
        : { yukshin: label, stemText: '' };
    });
  }

  // 수정: parsedList와 stemList 모두 받아서 2개까지 모두 출력
function formatParsedYukshinList(labelTitle, parsedArr, stemArr, labelColor) {
  const yukshinName = parsedArr?.[0]?.yukshin || '';

  // stemArr 가 없으면 빈 배열 처리
  const heavensRaw = stemArr?.map(s => s.heaven).filter(s => s !== 'x') || [];
  const earthsRaw = stemArr?.map(s => s.earth).filter(s => s !== 'x') || [];

  // 중복 제거: stemText 전체 기준
  const unique = (arr) => [...new Set(arr)];

  const heavens = unique(heavensRaw);
  const earths = unique(earthsRaw);

  // x가 있을 때 보라색으로 스타일 적용
  const formatStem = (stem) => stem === 'x' ? `<span style="color: red;">x</span>` : stem;

  const heavenStr = heavens.length > 0 ? heavens.map(formatStem).join('/') : formatStem('x');
  const earthStr = earths.length > 0 ? earths.map(formatStem).join('/') : formatStem('x');

  return `
    <div style="text-align:center;">
      <span style="color: ${labelColor}; font-weight: bold;">
        ${labelTitle}[${yukshinName}]
      </span><br/>
      <span>[${heavenStr}/${earthStr}]</span>
    </div>
  `;
}





  function resolveStemPosition(stemObj) {
    if (!stemObj) return { heaven: 'x', earth: 'x' };

    // stemText가 있을 경우 우선 파싱
    if (stemObj.stemText) {
      const match = stemObj.stemText.match(/^(.+?)\((천|지|天|地)\)$/);
      if (match) {
        const stem = match[1];         // 예: '甲'
        const tag = match[2];          // 예: '천' or '地'
        const fullStem = `${stem}(${tag})`;

        return {
          heaven: tag === '천' || tag === '天' ? fullStem : 'x',
          earth: tag === '지' || tag === '地' ? fullStem : 'x',
        };
      }
    }

    // fallback: stem/tag 기반 처리
    const tag = stemObj.tag === '천' || stemObj.tag === '天' ? '(天)'
              : stemObj.tag === '지' || stemObj.tag === '地' ? '(地)'
              : '';

    const fullStem = stemObj.stem + tag;

    return {
      heaven: stemObj.tag === '천' || stemObj.tag === '天' ? fullStem : 'x',
      earth: stemObj.tag === '지' || stemObj.tag === '地' ? fullStem : 'x',
    };
  }

  const gyeokNameRaw = gyeokObj.char || '';
  const gyeokName = gyeokNameRaw.replace(/\(.*\)/, '').trim();
  const stem = gyeokObj.stem || '';
  const { dayGan } = saju;
  const dayGanHan = convertKorToHanStem(dayGan);

  const analysis = analyzeGyeokRelations(gyeok, dayGanHan, saju);
  if (!analysis) return '필수 정보 부족';

  const { sangsin, gusin, gisin1, gisin2, gyeokname2 } = analysis;
 // console.log('[🧩] 분석결과:', { sangsin, gusin, gisin1, gisin2, gyeokname2 });

  if (!sangsin) return '상신 정보 없음';

  const gisin1ParsedArr = parseYukshinArray(gisin1);
  const gisin2ParsedArr = parseYukshinArray(gisin2);
  const gusinParsedArr = parseYukshinArray(gusin);
  const sangsinParsedArr = parseYukshinArray(sangsin);
const gyeokParsedArr = parseYukshinArray(gyeokname2); // '정인'
 // console.log('gyeokname2:', gyeokname2);
//console.log('✅ parseYukshinArray(gyeokname2):', gyeokParsedArr);


  const sangsinStems = sangsinParsedArr.map(resolveStemPosition);
  const gusinStems = gusinParsedArr.map(resolveStemPosition);
  const gisin1Stems = gisin1ParsedArr.map(resolveStemPosition);
  const gisin2Stems = gisin2ParsedArr.map(resolveStemPosition);
  const gyeokname2Stems = gyeokParsedArr.map(resolveStemPosition);

 // console.log('[📌] Stem 위치 정보:', {    sangsinStems,    gusinStems,    gisin1Stems,    gisin2Stems,    gyeokname2Stems  });

  const rel = GYEOK_RELATIONS[gyeokName];
  if (!rel) return '격국 관계 정보 없음';

  const relation = rel.use.relation;

if (relation === '생') {
  return `
    <div style="display: grid; grid-template-columns: auto 30px auto 30px auto; grid-template-rows: repeat(8, auto); justify-content: center; align-items: center; font-family: monospace; font-size: 0.9rem; gap: 4px;">
      <!-- 기신1 -->
      <div style="grid-column: 1 / 2; grid-row: 1; text-align: center;">
        ${formatParsedYukshinList('기신1', gisin1ParsedArr, gisin1Stems, 'red')}
      </div>
      <!-- 기신1 ↓ 상신 -->
   
<div style="grid-column: 1 / 2; grid-row: 4; text-align: center;">
  <svg width="25" height="28" style="vertical-align:middle; display:block; margin:0 auto;">
    <line x1="12.5" y1="4" x2="12.5" y2="18" stroke="red" stroke-width="4" stroke-linecap="round"/>
    <polygon points="7,18 12.5,24 18,18" fill="red"/>
  </svg>
</div>



      <!-- 상신 -->
      <div style="grid-column: 1 / 2; grid-row: 5; text-align: center;">
        ${formatParsedYukshinList('상신', sangsinParsedArr, sangsinStems, 'blue')}
      </div>
      <!-- 상신 → 격이름 -->
<div style="grid-column: 2 / 3; grid-row: 5; text-align: center;">
  <svg width="25" height="28" style="vertical-align:middle; display:block; margin:0 auto;">
    <!-- 선 (왼→오) -->
    <line x1="4" y1="14" x2="20" y2="14" stroke="blue" stroke-width="4" stroke-linecap="round"/>
    <!-- 화살촉(오른쪽) -->
    <polygon points="20,9 24,14 20,19" fill="blue"/>
  </svg>
</div>


<!-- 격이름[stem] -->
<div style="grid-column: 3 / 4; grid-row: 5; text-align: center;">

  ${formatParsedYukshinList(gyeokName, gyeokParsedArr, gyeokname2Stems, 'black', false)}
</div>
      <!-- 격이름 → 구신 -->
  <div style="grid-column: 4 / 5; grid-row: 5; text-align: center;">
  <svg width="25" height="28" style="vertical-align:middle; display:block; margin:0 auto;">
    <line x1="4" y1="14" x2="20" y2="14" stroke="blue" stroke-width="4" stroke-linecap="round"/>
    <polygon points="20,9 24,14 20,19" fill="blue"/>
  </svg>
</div>


      <!-- 구신 -->
      <div style="grid-column: 5 / 6; grid-row: 5; text-align: center;">
        ${formatParsedYukshinList('구신', gusinParsedArr, gusinStems, 'green')}
      </div>
      
      <!-- 격이름 ↑ 기신2 -->
     <div style="grid-column: 3 / 4; grid-row: 6; text-align: center;">
  <svg width="25" height="28" style="vertical-align:middle; display:block; margin:0 auto;">
    <!-- 선(아래→위) -->
    <line x1="12.5" y1="24" x2="12.5" y2="10" stroke="red" stroke-width="4" stroke-linecap="round"/>
    <!-- 화살촉(위쪽) -->
    <polygon points="7,10 12.5,4 18,10" fill="red"/>
  </svg>
</div>


      <div style="grid-column: 3 / 4; grid-row: 8; text-align: center;">
        ${formatParsedYukshinList('기신2', gisin2ParsedArr, gisin2Stems, 'red')}
      </div>
    </div>
  `;
}


  if (relation === '극') {
    return `
<div style="display: grid; grid-template-columns: auto 30px auto 30px auto; grid-template-rows: 38px 36px 36px auto auto auto; justify-content: center; align-items: center; font-family: monospace; font-size: 0.9rem; gap: 4px;">
  <div style="grid-column: 1 / 2; grid-row: 1; text-align: center;">
    ${formatParsedYukshinList('기신1', gisin1ParsedArr, gisin1Stems, 'red')}
  </div>
  <div style="grid-column: 2 / 3; grid-row: 1; text-align: center;">
    <svg width="25" height="28" style="vertical-align:middle; display:block; margin:0 auto;">
      <line x1="4" y1="14" x2="20" y2="14" stroke="red" stroke-width="4" stroke-linecap="round"/>
      <polygon points="20,9 24,14 20,19" fill="red"/>
    </svg>
  </div>
  <div style="grid-column: 3 / 4; grid-row: 1; text-align: center;">
    ${formatParsedYukshinList('상신', sangsinParsedArr, sangsinStems, 'blue')}
  </div>
  <div style="grid-column: 4 / 5; grid-row: 1; text-align: center;">
    <svg width="25" height="28" style="vertical-align:middle; display:block; margin:0 auto;">
      <line x1="4" y1="14" x2="20" y2="14" stroke="blue" stroke-width="4" stroke-linecap="round"/>
      <polygon points="20,9 24,14 20,19" fill="blue"/>
    </svg>
  </div>
  <div style="grid-column: 5 / 6; grid-row: 1; text-align: center;">
    ${formatParsedYukshinList('구신', gusinParsedArr, gusinStems, 'green')}
  </div>
  <!-- 2행: 상신↓, 구신↑(같은 행, 같은 svg height, y좌표) -->
  <div style="grid-column: 3 / 4; grid-row: 2; text-align: center;">
    <svg width="25" height="28" style="vertical-align:middle; display:block; margin:0 auto;">
      <line x1="12.5" y1="4" x2="12.5" y2="20" stroke="red" stroke-width="4" stroke-linecap="round"/>
      <polygon points="7,20 12.5,27 18,20" fill="red"/>
    </svg>
  </div>
  <div style="grid-column: 5 / 6; grid-row: 2; text-align: center;">
    <svg width="25" height="28" style="vertical-align:middle; display:block; margin:0 auto;">
      <line x1="12.5" y1="24" x2="12.5" y2="8" stroke="red" stroke-width="4" stroke-linecap="round"/>
      <polygon points="7,8 12.5,1 18,8" fill="red"/>
    </svg>
  </div>
  <!-- 3행: 격/기신2 같은 행에 나란히 -->
  <div style="grid-column: 3 / 4; grid-row: 3; text-align: center;">
    ${formatParsedYukshinList('격', gyeokParsedArr, gyeokname2Stems, 'black', false)}
  </div>
  <div style="grid-column: 5 / 6; grid-row: 3; text-align: center;">
    ${formatParsedYukshinList('기신2', gisin2ParsedArr, gisin2Stems, 'red')}
  </div>
</div>

    `;
  }

  return `[${gyeokName}(${stem})]`;
  }
 
// 2. 바깥쪽은 아래처럼!
let html = _renderSingle(gyeok);
document.getElementById('gyeok-flow').innerHTML = html;

}




//// 합신 테이블/////////////////////////////////////////////////////////////////////////////////
// 상신의 천간으로 합신을 구하는 함수

// 특정 육신의 합신을 구하는 일반 함수
function getGanForYukshin(dayGan, yukshinName) {
  const table = tenGodMap[dayGan];
  console.log("[getGanForYukshin] dayGan=", dayGan, "yukshinName=", yukshinName, "table=", table);

  if (!table) return null;

  for (const gan in table) {
    if (table[gan] === yukshinName) {
      console.log("[getGanForYukshin] FOUND:", yukshinName, "=>", gan);
      return gan;
    }
  }
  console.log("[getGanForYukshin] NOT FOUND:", yukshinName);
  return null;
}

// 합신 구하기 (천간 + 육신명 출력, 중복 제거)
function getHapshinByGan(dayGan, baseGan, saju) {
  if (!baseGan) return "X";

  const hapGan = 간합MAP[baseGan];
  if (!hapGan) return "X";

  const hapYukshin = tenGodMap[dayGan]?.[hapGan] || "?";

  const sources = [];

  // --- 1. 천간 검사 (⚡ 일간 제외) ---
  const cheonganList = [saju.yearGan, saju.monthGan, saju.hourGan].filter(Boolean);
  if (cheonganList.includes(hapGan)) {
    sources.push(`${hapGan}(天)`);
  }

  // --- 2. 지지 지장간 검사 (중기 제외) ---
  const jijiList = [saju.yearBranch, saju.monthBranch, saju.dayBranch, saju.hourBranch].filter(Boolean);
  for (const branch of jijiList) {
    const sibgans = jijiToSibganMap[branch] || [];
    const filtered = sibgans.filter(s => s && s.char && !s.isMiddle);

    if (filtered.some(s => s.char === hapGan)) {
      sources.push(`${hapGan}(地)`);
      break; // 한 지지만 잡으면 충분
    }
  }

  // --- 3. 중복 제거 ---
  const unique = [...new Set(sources)];

  return unique.length > 0 ? `${hapYukshin}[${unique.join(", ")}]` : "X";
}






  const ROLE_COLOR_MAP = {
  격: "black",
  상신: "blue",
  구신: "green",
  기신1: "red",
  기신2: "red",
};

export function renderhapshinTable(gyeokName, saju, dayGan, gyeokStem) {
  const normalizedName = (gyeokName || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/\(.*?\)/g, "");

  const map = GYEOK_YUKSHIN_MAP[normalizedName];
  if (!map) {
    return `<div>⚠ '${normalizedName}'에 대한 육신 매핑 없음</div>`;
  }

  // 육신(천간) 붙이기
  const withGan = (yukshin) => {
    if (!yukshin) return `${yukshin}(?)`;
    const baseGan = getGanForYukshin(dayGan, yukshin);
    return `${yukshin}(${baseGan || "?"})`;
  };

  // 윗줄 (각 항목에 색 적용)
  const headers = [
    `<span style="color:${ROLE_COLOR_MAP["상신"]}">상신[${withGan(map.sangsin)}]</span>`,
    `<span style="color:${ROLE_COLOR_MAP["구신"]}">구신[${withGan(map.gusin)}]</span>`,
    `<span style="color:${ROLE_COLOR_MAP["기신1"]}">기신1[${withGan(map.gisin1)}]</span>`,
    `<span style="color:${ROLE_COLOR_MAP["기신2"]}">기신2[${withGan(map.gisin2)}]</span>`
  ];

  // 합신 (격 포함 5개)
  const hapshinVals = [
    getHapshinByGan(dayGan, gyeokStem, saju),
    getHapshinByGan(dayGan, getGanForYukshin(dayGan, map.sangsin), saju),
    getHapshinByGan(dayGan, getGanForYukshin(dayGan, map.gusin), saju),
    getHapshinByGan(dayGan, getGanForYukshin(dayGan, map.gisin1), saju),
    getHapshinByGan(dayGan, getGanForYukshin(dayGan, map.gisin2), saju),
  ];

  return `
    <table style="border-collapse: collapse; width:100%; margin-top:0; font-size:0.75rem; text-align:center;">
      <tr>
        <td style="border:1px solid #ccc; padding:2px; width:6%;background:#e6f0ff;">기준</td>
        <td style="border:1px solid #ccc; padding:2px; width:14%; color:${ROLE_COLOR_MAP["격"]};font-weight:bold; background:#e6f0ff;">${gyeokName}[${gyeokStem}]</td>
        ${headers.map(h => `<td style="border:1px solid #ccc; padding:2px;background:#e6f0ff;">${h}</td>`).join("")}
      </tr>
      <tr>
        <td style="border:1px solid #ccc; padding:2px; background:#fff8dc;">합신</td>
        ${hapshinVals.map((h, i) => {
          const role = ["격","상신","구신","기신1","기신2"][i];
          const color = ROLE_COLOR_MAP[role] || "black";
          return `<td style="border:1px solid #ccc; padding:2px; color:${color};background:#fff8dc;">${h}</td>`;
        }).join("")}
      </tr>
    </table>
     <div style="text-align:center; margin-top:6px; font-size:12px; font-family:monospace;">
    * 아래 격도식에서  
    <span style="color:red; font-weight:">⮕</span>는 극의 관계, 
    <span style="color:blue; font-weight:">⮕</span>는 생의 관계
  </div>
  `;
}




//////격등급,성패,일간강약///////////////////////////////////////////////

///보조함수들 ///////////////////////

//격의 등급분류 상중하 + 2차 상중하
 /**
 * 일간 강약과 격을 표 형태로 출력하는 함수 (틀)
 * @param {Object} saju - 사주 데이터 (천간/지지 리스트 포함)
 * @returns {string} HTML 문자열
 */
export function renderIlganGyeokTable( saju, { gyeokName, secondaryGyeokResult } = {} ) {
  const { yearGan, monthGan, dayGan, hourGan, yearBranch, monthBranch, dayBranch, hourBranch } = saju;
const ganStrengthResults = {};

  // ✅ 한글 → 한자로 변환
  const cheongans = [
    convertKorToHanStem(yearGan),
    convertKorToHanStem(monthGan),
    convertKorToHanStem(dayGan),
    convertKorToHanStem(hourGan),
  ];

  const jijiList = [
    convertKorToHanBranch(yearBranch),
    convertKorToHanBranch(monthBranch),
    convertKorToHanBranch(dayBranch),
    convertKorToHanBranch(hourBranch),
  ];

  const ilgan = cheongans[2]; // 일간
  const wolji = jijiList[1];  // 월지
  // 시간 천간을 일간 기준으로 해석
const gwanCandidates = getGwanCandidates(ilgan, tenGodMap);

console.log("편관:", gwanCandidates.편관); // 예: 丁
console.log("정관:", gwanCandidates.정관); // 예: 丙

 //천간의 뿌리찾기 
const uncertainRoots = {
  "乙": ["寅"],
  "丁": ["巳"],
  "辛": ["申"],
  "癸": ["亥"]
};

///천간의 강약
/**
 * 천간 강약 점수 계산 (당령 보정 포함)
 * @param {string} targetGan - 강약을 판정할 천간 (예: "甲")
 * @param {string[]} chunganList - 사주 천간 리스트 [년, 월, 일, 시]
 * @param {string[]} jijiGanlists - 지지에서 뽑아낸 지장간 리스트
 * @param {Object} tenGodMap - 십신관계 맵
 * @param {Object} ganRootMap - 천간의 뿌리 매핑
 * @param {string[]} jijiList - 사주의 지지 배열
 * @param {string} dangryeongGan - 이번 달의 당령 천간 (예: "丙")
 * 
 * 
 */
function getSamhapSupportGans(jijiList) {
  const supportGans = [];

  for (let i = 0; i < jijiList.length; i++) {
    for (let j = i + 1; j < jijiList.length; j++) {
      const key = `${jijiList[i]}-${jijiList[j]}`;
      const supportGan = SAMHAP_SUPPORT[key];
      if (supportGan) {
        supportGans.push(supportGan);
        console.log(`▶ 삼합 성립: ${jijiList[i]}+${jijiList[j]} → ${supportGan} 추가`);
      }
    }
  }

  return supportGans;
}



function getGwanCandidates(ilgan, tenGodMap) {
  const result = { 편관: null, 정관: null };

  // tenGodMap[일간] 은 {천간: 십신명} 형태
  for (const [gan, yukshin] of Object.entries(tenGodMap[ilgan] || {})) {
    if (yukshin === "편관") result.편관 = gan;
    if (yukshin === "정관") result.정관 = gan;
  }

  return result;
}

function getGanStrengthScore(
  targetGan,
  chunganList,   // 원국 + 삼합 대표간
  jijiGanlists,  // 지지 천간
  tenGodMap,
  ganRootMap,
  jijiList,
  dangryeong
) {
  let score = 0;
  console.log(`\n===== [${targetGan}] 점수 계산 시작 =====`);

  // 1) 천간끼리 십신 관계 판정
  for (let gan of chunganList) {
    if (gan === targetGan) continue;
    const yukshin = tenGodMap[targetGan]?.[gan];
    if (["정인","편인","식신","상관"].includes(yukshin)) {
      score += 12.5;
      console.log(`천간관계: ${targetGan} vs ${gan} → ${yukshin} +12.5`);
    }
  }

  // 2) 지지 속 천간들과의 관계 판정
  for (let gan of jijiGanlists) {
    const yukshin = tenGodMap[targetGan]?.[gan];
    if (["정인","편인","식신","상관"].includes(yukshin)) {
      score += 12.5;
      console.log(`지지관계: ${targetGan} vs ${gan} → ${yukshin} +12.5`);
    }
  }

  // 3) 뿌리 여부 판정
// 3) 뿌리 여부 판정 (개수만큼 점수)
const roots = (ganRootMap[targetGan] || "").split(",");
let rootCount = roots.filter(root => jijiList.includes(root.replace("(?)",""))).length;

if (rootCount > 0) {
  score += rootCount * 12.5;
  console.log(`뿌리 존재: ${targetGan} → ${rootCount}개 → +${rootCount * 12.5}`);
}


  // 4) 당령 보정
  if (dangryeong && targetGan === dangryeong) {
    score += 100;
    console.log(`당령 보정: ${targetGan} → +100`);
  }

  const finalScore = score / 2;
  console.log(`▶ [${targetGan}] 최종 점수 = ${finalScore}`);
  return finalScore;
}




// 사주 데이터
const chunganList = [
  convertKorToHanStem(saju.yearGan),
  convertKorToHanStem(saju.monthGan),
  convertKorToHanStem(saju.dayGan),
  convertKorToHanStem(saju.hourGan),
];
const jijiList2 = [
  convertKorToHanBranch(saju.yearBranch),
  convertKorToHanBranch(saju.monthBranch),
  convertKorToHanBranch(saju.dayBranch),
  convertKorToHanBranch(saju.hourBranch),
];
const jijiGanlists = jijiList2.flatMap(branch => jijiToSibganMap3[branch] || []);

  // ✅ 당령 구하기 (외부 함수 활용)
  const dangryeong = getDangryeong(wolji, daeyunAge, daYunDirection);
  const extraGans = getSamhapSupportGans(jijiList);

// ✅ 천간 리스트에 삼합 대표간 추가
const extendedChunganList = [
  ...cheongans,
  ...(gwanCandidates.편관 ? [gwanCandidates.편관] : []),
  ...(gwanCandidates.정관 ? [gwanCandidates.정관] : [])
];

// 십신 관계용 = 원국 천간 + 삼합 대표간
const relationChunganList = [
  ...cheongans,
  ...extraGans
];
console.log("▶ jijiGanlists (지지 속 천간들):", jijiGanlists);
console.log("▶ extendedChunganList (점수 대상: 원국 + 가상 관성):", extendedChunganList);
console.log("▶ relationChunganList (십신 관계용: 원국 + 삼합대표간):", relationChunganList);



// 4개 천간 각각 강약 점수 계산
// 점수 계산
for (let gan of extendedChunganList) {
  const score = getGanStrengthScore(
    gan,
    relationChunganList,
    jijiGanlists,
    tenGodMap,
    ganRootMap,
    jijiList,
    dangryeong
  );
  ganStrengthResults[gan] = score;
  console.log(`=== ${gan} 최종 점수 저장: ${score} ===`);
}

// 가상의 편관, 정관도 계산

// 가상의 편관/정관 강약 점수 계산
// 가상의 편관/정관 강약 점수 계산
if (gwanCandidates.편관) {
  console.log(`\n=== [편관(${gwanCandidates.편관})] 강약 점수 계산 시작 ===`);

  let baseScore = getGanStrengthScore(
    gwanCandidates.편관,
    relationChunganList,  // ✅ 삼합 포함 리스트
    jijiGanlists,
    tenGodMap,
    ganRootMap,
    jijiList,
    dangryeong
  );

  console.log(`▶ [편관(${gwanCandidates.편관})] 기본 점수 = ${baseScore}`);

  // ✅ 실제 사주 천간에 편관이 존재하면 +50
  if (cheongans.includes(gwanCandidates.편관)) {
    baseScore += 50;
    console.log(`⚡ [편관(${gwanCandidates.편관})] 원국에 존재 → +50 보정 → ${baseScore}`);
  }

  ganStrengthResults[`편관(${gwanCandidates.편관})`] = baseScore;
  console.log(`✅ [편관(${gwanCandidates.편관})] 최종 저장 점수 = ${baseScore}`);
}

if (gwanCandidates.정관) {
  console.log(`\n=== [정관(${gwanCandidates.정관})] 강약 점수 계산 시작 ===`);

  let baseScore = getGanStrengthScore(
    gwanCandidates.정관,
    relationChunganList,  // ✅ 삼합 포함 리스트rkddir
    jijiGanlists,
    tenGodMap,
    ganRootMap,
    jijiList,
    dangryeong
  );

  console.log(`▶ [정관(${gwanCandidates.정관})] 기본 점수 = ${baseScore}`);

  // ✅ 실제 사주 천간에 정관이 존재하면 +50
  if (cheongans.includes(gwanCandidates.정관)) {
    baseScore += 50;
    console.log(`⚡ [정관(${gwanCandidates.정관})] 원국에 존재 → +50 보정 → ${baseScore}`);
  }

  ganStrengthResults[`정관(${gwanCandidates.정관})`] = baseScore;
  console.log(`✅ [정관(${gwanCandidates.정관})] 최종 저장 점수 = ${baseScore}`);
}



// 뿌리 찾기 + 실제 사주 존재 여부

function renderGanRootWithCheck(gan, branches) {
  const roots = (ganRootMap[gan] || "").split(",");

  // 실제 사주에 존재하는 뿌리만 남김
  let validRoots = roots.filter(branch => {
    const pureBranch = branch.replace("(?)", ""); // "(?)" 제거 후 비교
    return branches.includes(pureBranch);
  });

  // 모두 없으면 X
  if (validRoots.length === 0) {
    return "X";
  }

  // 애매한 뿌리 표시 유지
  return validRoots.map(branch => {
    if (uncertainRoots[gan]?.includes(branch.replace("(?)", ""))) {
      return `${branch.replace("(?)", "")}(?)`;
    }
    return branch;
  }).join(",");
}


  // cheongans: [년간, 월간, 일간, 시간]
const yearGanHan  = cheongans[0];
const monthGanHan = cheongans[1];
const dayGanHan   = cheongans[2];
const hourGanHan  = cheongans[3];

// 각 천간의 근 찾기
const yearRoots  = renderGanRootWithCheck(yearGanHan, jijiList);
const monthRoots = renderGanRootWithCheck(monthGanHan, jijiList);
const dayRoots   = renderGanRootWithCheck(dayGanHan, jijiList);
const hourRoots  = renderGanRootWithCheck(hourGanHan, jijiList);

// 격등급판정결과출력
// 주격 등급
// 주격 등급
// 1) 주격 / 보조격 원본 이름
const rawMainName = gyeokName;                           // 예: "정관격(壬)"
const rawSecondaryName = secondaryGyeokResult?.char || "X"; // 예: "정인격(癸)"
// 2) 판정용 정규화 이름
function normalizeKey(name) {
  return (name || "")
    .replace(/\(.*?\)/g, "")  // 괄호 제거
    .trim()                   // 앞뒤 공백 제거
    .normalize("NFC");        // 유니코드 정규화
}

const normalizedMainName = normalizeKey(rawMainName);
const normalizedSecondaryName = normalizeKey(rawSecondaryName);

console.log("▶ 주격 원본:", rawMainName, "정규화:", normalizedMainName);
const mainGrade = getGyeokGrade(saju, normalizedMainName, tenGodMap);
console.log("▶ 주격 등급 결과:", mainGrade);

// 보조격 등급
let secondaryGrade = null;
if (normalizedSecondaryName && GYEOK_YUKSHIN_MAP[normalizedSecondaryName]) {
  console.log("▶ 보조격 원본:", rawSecondaryName, "정규화:", normalizedSecondaryName);
  secondaryGrade = getGyeokGrade(saju, normalizedSecondaryName, tenGodMap);
  console.log("▶ 보조격 등급 결과:", secondaryGrade);
} else {
  console.log("▶ 보조격 없음:", rawSecondaryName);
}


//격의 성패조건 삽입


const mainRequired = GYEOK_SEONGPAE_MAP[normalizedMainName]?.required || "-";
const secondaryRequired = GYEOK_SEONGPAE_MAP[normalizedSecondaryName]?.required || "-";

console.log("▶ 최종 normalizedMainName:", JSON.stringify(normalizedMainName));
console.log("▶ mainRequired:", mainRequired);
  // HTML 테이블 출력
  let IlganGyeokTablehtml = `
<table border="1" 
       style="border-collapse: collapse; text-align:center; width: 100%; margin-bottom:0; font-size:14px;">
  <thead>
    <tr style="background:#fff8dc;">
      <th style="padding:3px;">구분</th>
      <th style="padding:3px;">격이름</th>
      <th style="padding:3px;">격등급</th>
      <th style="padding:3px;">격의 성패조건</th>
      <th style="padding:3px;">일간의 환경</th>
      <th style="padding:3px;">성패[최종]</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:3px;background:#e6f0ff;">주격</td>
      <td style="padding:3px;">${gyeokName || '-'}</td>
      <td style="padding:3px;">${mainGrade ? mainGrade.final : '-'}</td>
      <td style="padding:3px;">${mainRequired}</td>
      <td style="padding:3px;"></td>
      <td style="padding:3px;"></td>
    </tr>
    <tr>
      <td style="padding:3px;background:#e6f0ff;">보조격</td>
      <td style="padding:3px;">${secondaryGyeokResult?.char || 'X'}</td>
      <td style="padding:3px;">${secondaryGrade ? secondaryGrade.final : '-'}</td>
      <td style="padding:3px;">${secondaryRequired}</td>
      <td style="padding:3px;"></td>
      <td style="padding:3px;"></td>
    </tr>
    <tr>
      <td colspan="6" style="padding:3px; text-align:center;font-size:12px;">
        * 격등급은 "총점<span style="color:blue;">100점</span>"중의 환산점수임. <span style="color:red;">破</span>는 격이 성립되지 못함을 의미 
      </td>
    </tr>
  </tbody>
</table>

<table border="1" 
       style="border-collapse: collapse; text-align:center; width: 100%; font-size:14px; margin-top:1px;">
  <thead>
    <tr style="background:#fff8dc;">
  <th style="padding:3px; width:100px;">천간</th>
  <th style="padding:3px;">${convertKorToHanStem(saju.hourGan)} (시)</th>
  <th style="padding:3px;"><span style="color:red;">${convertKorToHanStem(saju.dayGan)} (일간)</span></th>
  <th style="padding:3px;">${convertKorToHanStem(saju.monthGan)} (월)</th>
  <th style="padding:3px;">${convertKorToHanStem(saju.yearGan)} (년)</th>
   <th colspan="2" style="padding:3px; width:100px;">관성</th>

</tr>
    </tr>
  </thead>
  <tbody>
      <tr>
        <td style="padding:3px;background:#e6f0ff;">천간의 근</td>
        <td style="padding:3px;">${hourRoots}</td>
        <td style="padding:3px;"><span style="color:blue;">${dayRoots}</span></td>
        <td style="padding:3px;">${monthRoots}</td>
        <td style="padding:3px;">${yearRoots}</td>
      
  <td style="padding:3px;background:#fff8dc;">편관(${gwanCandidates.편관 || '-'})</td>
  <td style="padding:3px;background:#fff8dc;">정관(${gwanCandidates.정관 || '-'})</td>


      </tr>
  <tr>
  <td style="padding:3px;background:#e6f0ff;">왕쇠강약</td>
  <td style="padding:3px;">${ganStrengthResults[hourGanHan] || "-"}</td>
  <td style="padding:3px;"><span style="color:blue;">${ganStrengthResults[dayGanHan] || "-"}</span></td>
  <td style="padding:3px;">${ganStrengthResults[monthGanHan] || "-"}</td>
  <td style="padding:3px;">${ganStrengthResults[yearGanHan] || "-"}</td>
    <!-- ✅ 편관 강약 -->
<td style="padding:3px;">
  ${ganStrengthResults[`편관(${gwanCandidates.편관})`] 
    ? `<span style="color:red;">${ganStrengthResults[`편관(${gwanCandidates.편관})`]}</span>` 
    : "-"}
</td>
<td style="padding:3px;">
  ${ganStrengthResults[`정관(${gwanCandidates.정관})`] 
    ? `<span style="color:red;">${ganStrengthResults[`정관(${gwanCandidates.정관})`]}</span>` 
    : "-"}
</td>


</tr>
  </tbody>
</table>
  `;

  return IlganGyeokTablehtml;
}


////격등급구하기///////////
/**
 * 격 등급 계산 함수 (1차+2차+3차)
 * @param {Object} options
 * @param {boolean} options.hasSangsin  상신 존재 여부
 * @param {boolean} options.hasGusin    구신 존재 여부
 * @param {boolean} options.hasGishin1  기신1 존재 여부
 * @param {boolean} options.hasGishin2  기신2 존재 여부
 * @param {string}  options.sangsinPos  상신 위치 ("천간"|"삼합"|"지지"|null)
 * @param {string}  options.gusinPos    구신 위치 ("천간"|"삼합"|"지지"|null)
 * @param {string}  options.gishinPos   기신 위치 ("천간"|"삼합"|"지지"|null)
 * @returns {Object} { grade1, grade2, grade3, final }
 */
export function getGyeokGrade(saju, gyeokName, tenGodMap) {


// 정규화된 이름 (판정용)
 const normalizedName = (gyeokName || "").replace(/\(.*?\)/g, "");

  // ---------------------
  // 0. 사주 기본 데이터 추출
  // ---------------------
  const { yearGan, monthGan, dayGan, hourGan,
          yearBranch, monthBranch, dayBranch, hourBranch } = saju;

  // 1) 천간 리스트
  const chunganList = [
    convertKorToHanStem(yearGan),
    convertKorToHanStem(monthGan),
    
    convertKorToHanStem(hourGan),
  ];

  // 일간
  const ilgan = convertKorToHanStem(dayGan);

  // 2) 지지 리스트
  const branches = [
    convertKorToHanBranch(yearBranch),
    convertKorToHanBranch(monthBranch),
    convertKorToHanBranch(dayBranch),
    convertKorToHanBranch(hourBranch),
  ];
console.log("branches:", branches);
for (let branch of branches) {
  console.log("branch:", branch, "→", jijiToSibganMap3[branch]);
}
  // 3) 지지 속 천간 (중기 제거한 버전 사용)
 const jijiGanlists = branches.flatMap(branch =>
  (jijiToSibganMap3[branch] || []).filter(Boolean)
);

  console.log("천간:", chunganList);
  console.log("일간:", ilgan);
  console.log("지장간:", jijiGanlists);

  // ---------------------
  // 1. 육신 판별 함수
  // ---------------------
  function getYukshin(dayGan, targetGan) {
    return tenGodMap[dayGan]?.[targetGan] || null;
  }

  function findYukshinPosition(yukshinName) {
    if (!yukshinName) return null;

    // 1. 천간 검사
    for (let gan of chunganList) {
      if (getYukshin(ilgan, gan) === yukshinName) return "천간";
    }
    // 2. 지지 검사
    for (let gan of jijiGanlists) {
      if (getYukshin(ilgan, gan) === yukshinName) return "지지";
    }
    return null;
  }

  // ---------------------
  // 2. 격별 상신~기신 로딩
  // ---------------------
  const { sangsin, gusin, gisin1, gisin2 } = GYEOK_YUKSHIN_MAP[gyeokName] || {};

  const sangsinPos = findYukshinPosition(sangsin);
  const gusinPos   = findYukshinPosition(gusin);
  const gisin1Pos  = findYukshinPosition(gisin1);
  const gisin2Pos  = findYukshinPosition(gisin2);

  const hasSangsin  = !!sangsinPos;
  const hasGusin    = !!gusinPos;
  const hasGishin1  = !!gisin1Pos;
  const hasGishin2  = !!gisin2Pos;

// 2) 격의 기준 천간 (예: "정관격(壬)" → "壬")

  // ---------------------
  // 3. 등급 판정 (기존 로직 그대로)
  // ---------------------
  // ✅ 점수 계산
  const GILSIN_GYEOKS = ["식신격","편재격","정재격","정관격","정인격","편인격"];
  const HYUNGSIN_GYEOKS = ["상관격","편관격","건록격","양인격","월비격","월겁격"];


  let total = 0;

if (!sangsinPos) {
  console.log("❌ 상신 없음 → 파격");
  return { final: "破", score: 0 };
}

// ---------------------
// 상신 점수
// ---------------------
if (sangsinPos === "천간") {
  total += 50;
  console.log("▶ 상신(천간) +50");
}
if (sangsinPos === "지지") {
  total += 15;
  console.log("▶ 상신(지지) +15");
}

// ---------------------
// 구신 점수
// ---------------------
if (gusinPos === "천간") {
  total += 30;
  console.log("▶ 구신(천간) +30");
}
if (gusinPos === "지지") {
  total += 9;
  console.log("▶ 구신(지지) +9");
}

// ---------------------
// 기신1 점수
// ---------------------
if (gisin1Pos === "천간") {
  total += 15;
  console.log("▶ 기신1(천간) +15");
}
if (gisin1Pos === "지지") {
  total += 5;
  console.log("▶ 기신1(지지) +5");
}

// ---------------------
// 기신2 점수
// ---------------------
if (gisin2Pos === "천간") {
  total += 15;
  console.log("▶ 기신2(천간) +15");
}
if (gisin2Pos === "지지") {
  total += 5;
  console.log("▶ 기신2(지지) +5");
}

// ---------------------
// 감점 규칙
// ---------------------
if (GILSIN_GYEOKS.includes(normalizedName)) {
  if (!gusinPos && gisin2Pos) {
    if (gisin2Pos === "천간") {
      total -= 15;
      console.log("⚠️ 길신격 감점: 구신 없음 + 기신2(천간) -15");
    }
    if (gisin2Pos === "지지") {
      total -= 5;
      console.log("⚠️ 길신격 감점: 구신 없음 + 기신2(지지) -5");
    }
  }
}
if (HYUNGSIN_GYEOKS.includes(normalizedName)) {
  if (!gusinPos && gisin1Pos) {
    if (gisin1Pos === "천간") {
      total -= 15;
      console.log("⚠️ 흉신격 감점: 구신 없음 + 기신1(천간) -15");
    }
    if (gisin1Pos === "지지") {
      total -= 5;
      console.log("⚠️ 흉신격 감점: 구신 없음 + 기신1(지지) -5");
    }
  }
}

// ---------------------
// 격이 천간에 있으면 +10
// ---------------------
// 격이름에서 괄호 안의 천간 추출
// 격 기준 육신 (예: 정인격 → "정인")
// 기준 육신 (예: 정관격 → 정관, 건록격 → 비견, 양인격 → 겁재)
const baseYukshin = GYEOK_YUKSHIN_MAP[normalizedName]?.gyeokname2;

let hasBaseYukshinInCheongan = false;
if (baseYukshin) {
  for (let gan of chunganList) {
    const yukshin = getYukshin(ilgan, gan);
    if (yukshin === baseYukshin) {
      hasBaseYukshinInCheongan = true;
      console.log(`▶ 격(${normalizedName}) 기준육신 ${baseYukshin} 천간 투출 (${gan})`);
      break;
    }
  }
}

if (hasBaseYukshinInCheongan) {
  total += 10;
  console.log(`▶ 기준육신(${baseYukshin}) 천간 존재 +10`);
}


// ---------------------
// 삼합 보정
// ---------------------
const wolji = convertKorToHanBranch(monthBranch);
let samhapBonus = 0;

for (let branch of branches) {
  const key = `${wolji}-${branch}`;
  const supportGan = SAMHAP_SUPPORT[key];

  if (supportGan) {
    const yukshin = getYukshin(ilgan, supportGan);
    console.log(`▶ 삼합 성립: 월지=${wolji}, 지지=${branch}, 대표간=${supportGan}, 십신=${yukshin}`);

    if (yukshin === sangsin) {
      samhapBonus += 10;
      console.log(`   ✅ 삼합 상신 +10 (${supportGan})`);
    }
    if (yukshin === gusin) {
      samhapBonus += 5;
      console.log(`   ✅ 삼합 구신 +5 (${supportGan})`);
    }
    if (yukshin === gisin1 || yukshin === gisin2) {
      samhapBonus += 2;
    } else if (yukshin === baseYukshin) {  
      // ⚡ 기준 육신(격)과 같을 경우
      samhapBonus += 4;
      console.log(`   ✅ 삼합 격(${baseYukshin}) +4 (${supportGan})`);
    }
  }
}

total += samhapBonus;
console.log("▶ 삼합 보정 합계:", samhapBonus);


// ---------------------
// 합신 보정
// ---------------------
let hapshinBonus = 0;

// (1) 천간끼리 합
const checked = new Set();

for (let gan of chunganList) {
  const pair = 간합MAP[gan];
  if (pair && chunganList.includes(pair)) {
    const key = [gan, pair].sort().join("-");
    if (checked.has(key)) continue; // 중복 방지
    checked.add(key);

    const hapList = [gan, pair];
    console.log(`▶ 합신(천간) 성립: ${hapList.join("+")}`);

    const hapYukshins = hapList.map(g => getYukshin(ilgan, g));
    console.log("   ▶ 합신 육신:", hapYukshins);

    if (hapYukshins.includes(sangsin)) {
      hapshinBonus += 15;
      console.log("   ✅ 합신에 상신 포함 +15");
    }
    if (hapYukshins.includes(gusin)) {
      hapshinBonus += 7;
      console.log("   ✅ 합신에 구신 포함 +7");
    }
    if (hapYukshins.includes(gisin1) || hapYukshins.includes(gisin2)) {
      hapshinBonus -= 10;
      console.log("   ⚠️ 합신에 기신 포함 -10");
    }

    // ⚡ 격 육신 포함 보정
    if (baseYukshin && hapYukshins.includes(baseYukshin)) {
      hapshinBonus += 10;
      console.log(`   ⭐ 합신(천간) 격(${baseYukshin}) 포함 +10`);
    }
  }
}


// (2) 지지끼리 합 (지장간 기준)
const checkedJiji = new Set();

for (let branch of branches) {
  const ganList = jijiToSibganMap3[branch] || [];
  for (let gan of ganList) {
    const pair = 간합MAP[gan];
    if (pair && jijiGanlists.includes(pair)) {
      const key = [gan, pair].sort().join("-");
      if (checkedJiji.has(key)) continue;
      checkedJiji.add(key);

      const hapList = [gan, pair];
      console.log(`▶ 합신(지지) 성립: ${hapList.join("+")}`);

      const hapYukshins = hapList.map(g => getYukshin(ilgan, g));
      console.log("   ▶ 합신(지지) 육신:", hapYukshins);

      if (hapYukshins.includes(sangsin)) {
        hapshinBonus += 5;
        console.log("   ✅ 합신(지지) 상신 +5");
      }
      if (hapYukshins.includes(gusin)) {
        hapshinBonus += 2;
        console.log("   ✅ 합신(지지) 구신 +2");
      }
      if (hapYukshins.includes(gisin1) || hapYukshins.includes(gisin2)) {
        hapshinBonus -= 3;
        console.log("   ⚠️ 합신(지지) 기신 -3");
      }

      // ⚡ 격 육신 포함 보정
      if (baseYukshin && hapYukshins.includes(baseYukshin)) {
        hapshinBonus += 4;
        console.log(`   ⭐ 합신(지지) 격(${baseYukshin}) 포함 +4`);
      }
    }
  }
}


// (3) 천간–지지 합 (교차 합)
const checkedPairs = new Set();

// (1) 천간→지지 합신
for (let gan of chunganList) {
  const pair = 간합MAP[gan];
  if (pair && jijiGanlists.includes(pair)) {
    const key = [gan, pair].sort().join("-");
    if (checkedPairs.has(key)) continue;
    checkedPairs.add(key);

    const hapList = [gan, pair];
    const hapYukshins = hapList.map(g => getYukshin(ilgan, g));
    console.log(`▶ 합신(천간-지지) 성립: ${hapList.join("+")} → 육신=${hapYukshins}`);

    if (hapYukshins.includes(sangsin)) {
      hapshinBonus += 10;
      console.log("   ✅ 상신(천간 기준) +10");
    }
    if (hapYukshins.includes(gusin)) {
      hapshinBonus += 5;
      console.log("   ✅ 구신(천간 기준) +5");
    }
    if (hapYukshins.includes(gisin1) || hapYukshins.includes(gisin2)) {
      hapshinBonus -= 5;
      console.log("   ⚠️ 기신(천간 기준) -5");
    }

    // ⚡ 격 육신 포함 보정
    if (baseYukshin && hapYukshins.includes(baseYukshin)) {
      hapshinBonus += 8;
      console.log(`   ⭐ 합신(천간-지지, 천간격) 격(${baseYukshin}) 포함 +8`);
    }
  }
}

// (2) 지지→천간 합신
for (let gan of jijiGanlists) {
  const pair = 간합MAP[gan];
  if (pair && chunganList.includes(pair)) {
    const key = [gan, pair].sort().join("-");
    if (checkedPairs.has(key)) {
      console.log(`⚠️ 합신(지지-천간) ${gan}+${pair} → 천간기준으로 이미 반영, 무시`);
      continue;
    }
    checkedPairs.add(key);

    const hapList = [gan, pair];
    const hapYukshins = hapList.map(g => getYukshin(ilgan, g));
    console.log(`▶ 합신(지지-천간) 성립: ${hapList.join("+")} → 육신=${hapYukshins}`);

    if (hapYukshins.includes(sangsin)) {
      hapshinBonus += 7;
      console.log("   ✅ 상신(지지 기준) +7");
    }
    if (hapYukshins.includes(gusin)) {
      hapshinBonus += 3;
      console.log("   ✅ 구신(지지 기준) +3");
    }
    if (hapYukshins.includes(gisin1) || hapYukshins.includes(gisin2)) {
      hapshinBonus -= 3;
      console.log("   ⚠️ 기신(지지 기준) -3");
    }

    // ⚡ 격 육신 포함 보정
    if (baseYukshin && hapYukshins.includes(baseYukshin)) {
      hapshinBonus += 6;
      console.log(`   ⭐ 합신(지지-천간, 지지격) 격(${baseYukshin}) 포함 +6`);
    }
  }
}

total += hapshinBonus;
console.log("▶ 합신 보정 합계:", hapshinBonus);


// ---------------------
// 최종 점수
// ---------------------
const percentage = Math.floor(((total / 169) * 100)+20);
console.log(`✅ 최종 점수: ${total}/169 → ${percentage}+20점`);

return { final: `${percentage}점`, score: percentage };

}

////천간의 강약구분.//////////
///보조 천간의 뿌리 유무확인
//1.각 천간의 통근
//2.천간과 지지별 생극에 따른 강약
