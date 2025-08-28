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
         GYEOKGUK_TYPES,
         samhapGroups,
         isYangStem,
         GYEOK_USE_GU_MAP,
         GYEOK_RELATIONS,
         길신격_목록,
         흉신격_목록,
         YUKSHIN_COUNTERS,
         GYEOK_YUKSHIN_MAP, jijiToSibganMap
        } from './constants.js';

import { hanToKorStem,
        convertKorToHanStem,
        convertKorToHanBranch
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
    <table style="border-collapse: collapse; width:100%; margin-top:4px; font-size:0.75rem; text-align:center;">
      <tr>
        <td style="border:1px solid #ccc; padding:2px; width:6%;"></td>
        <td style="border:1px solid #ccc; padding:2px; width:14%; color:${ROLE_COLOR_MAP["격"]};font-weight:bold;">${gyeokName}[${gyeokStem}]</td>
        ${headers.map(h => `<td style="border:1px solid #ccc; padding:2px;">${h}</td>`).join("")}
      </tr>
      <tr>
        <td style="border:1px solid #ccc; padding:2px;">합신</td>
        ${hapshinVals.map((h, i) => {
          const role = ["격","상신","구신","기신1","기신2"][i];
          const color = ROLE_COLOR_MAP[role] || "black";
          return `<td style="border:1px solid #ccc; padding:2px; color:${color};">${h}</td>`;
        }).join("")}
      </tr>
    </table>
     <div style="text-align:center; margin-top:6px; font-size:0.7rem; font-family:monospace;">
    * 아래 격도식의 
    <span style="color:red; font-weight:">빨강색 화살표(→)</span>는 극의 관계, 
    <span style="color:blue; font-weight:">파랑색 화살표(→)</span>는 생의 관계
  </div>
  `;
}









