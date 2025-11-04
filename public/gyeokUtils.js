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
         SANGSAENG_MAP,
         SANGGEUK_MAP,
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

  // 2. 상신명 추출
  const map = GYEOK_YUKSHIN_MAP[gyeokName] || GYEOK_RELATIONS[gyeokName];
  if (!map || (!map.sangsin && !map.use)) return false;
  const sangsinName = map.sangsin || map.use.char;

  // 3. 천간에서 상신 찾기
  for (const stem of cheongans) {
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

export function hasSamhap() {
  const monthJi = window.monthJi;
  // 월지를 제외한 지지 배열
  const otherJijiArr = (window.sajuJijiArray || []).filter(j => j !== monthJi);

  if (!Array.isArray(otherJijiArr)) {
    console.warn("⚠️ otherJijiArr가 배열이 아님:", otherJijiArr);
    return false;
  }

  const group = samhapGroups.find(group => group.includes(monthJi));
  if (!group) return false;

  const result = group
    .filter(ji => ji !== monthJi)
    .some(ji => otherJijiArr.includes(ji));

  console.log("🟢 hasSamhap 판정:", { monthJi, otherJijiArr, result });
  return result;
}



// 주격 판별함수////////////////////////////////////////////////////

export function getGyeokForMonth() {
  const saju          = window.saju;
  const monthJi       = window.monthJi;
  const saryeong      = window.saryeong;
  const chunganList   = window.sajuStemList?.map(x => x.value) || [];
  const dayGan        = saju.dayGan;
  const daeyunAge     = window.daeyunAge;
  const daYunDirection= window.daYunDirection;
// 월지를 제외한 지지 배열
const otherJijiArr = (window.sajuJijiArray || []).filter(j => j !== window.monthJi);


  const jijiSibgans = jijiToSibganMap2[monthJi];
  if (!jijiSibgans || jijiSibgans.length === 0) {
    console.warn("⚠️ jijiSibgans 없음:", monthJi);
    window.gyeokName = null;
    window.gyeokStem = null;
    window.gyeokWrap = null;
    return null;
  } 

  let result = null;

  ///////////////////////////////////////////////////////////////////////
  // 1. 인신사해월
  if (['寅', '申', '巳', '亥'].includes(monthJi)) {
    const lastStem = jijiSibgans[jijiSibgans.length - 1];
    const yukshin = getYukshinNameFromStems(dayGan, lastStem);

    if (yukshin === '비견') {
      if (YIN_STEMS.includes(dayGan)) {
        const hasUse = isSangsinInCheonganOrJijiHidden(saju, dayGan, '건록격');
        if (!hasUse) {
          result = { char: '월비격', stem: lastStem, wrap: false };
        }
      }
      if (!result) result = { char: GYEOKGUK_TYPES.BIGYEON, stem: lastStem, wrap: false };
    }
    else if (yukshin === '겁재') {
      if (YIN_STEMS.includes(dayGan)) {
        const hasUse = isSangsinInCheonganOrJijiHidden(saju, dayGan, '양인격');
        if (!hasUse) {
          result = { char: '월겁격', stem: lastStem, wrap: false };
        }
      }
      if (!result) result = { char: GYEOKGUK_TYPES.GEOBJAE, stem: lastStem, wrap: false };
    }
    else {
      const second = jijiSibgans[0]; // 중기
      const third  = jijiSibgans[1]; // 정기
      const hasSamhapValue = hasSamhap(monthJi, otherJijiArr);
      const secondInChungan = chunganList.includes(second);
      const thirdInChungan  = chunganList.includes(third);

      if (saryeong === second && hasSamhapValue && secondInChungan && !thirdInChungan) {
        result = { char: getGyeokName(dayGan, second), stem: second };
      } else {
        result = { char: getGyeokName(dayGan, third), stem: third };
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 2. 자오묘유월
  if (!result && ['子', '午', '卯', '酉'].includes(monthJi)) {
    const lastStem = jijiSibgans[jijiSibgans.length - 1];
    const yukshin = getYukshinNameFromStems(dayGan, lastStem);

    if (yukshin === '비견') {
      if (YIN_STEMS.includes(dayGan)) {
        const hasUse = isSangsinInCheonganOrJijiHidden(saju, dayGan, '건록격');
        if (!hasUse) {
          result = { char: '월비격', stem: lastStem, wrap: false };
        }
      }
      if (!result) result = { char: GYEOKGUK_TYPES.BIGYEON, stem: lastStem, wrap: false };
    }
    else if (yukshin === '겁재') {
      if (YIN_STEMS.includes(dayGan)) {
        const hasUse = isSangsinInCheonganOrJijiHidden(saju, dayGan, '양인격');
        if (!hasUse) {
          result = { char: '월겁격', stem: lastStem, wrap: false };
        }
      }
      if (!result) result = { char: GYEOKGUK_TYPES.GEOBJAE, stem: lastStem, wrap: false };
    }
    else {
      const first = jijiSibgans[0];
      const last  = jijiSibgans[1]; // 정기
      const kingElements = jijiSibgans.map(g => elementMap[g]);
      const cheonganWithKingElement = chunganList.filter(gan => kingElements.includes(elementMap[gan]));

      if (cheonganWithKingElement.length === 0) {
        result = { char: getGyeokName(dayGan, last), stem: last };
      } else {
        const cheonganElementSet = new Set(cheonganWithKingElement.map(gan => elementMap[gan]));
        if (cheonganElementSet.size === 1) {
          result = { char: getGyeokName(dayGan, cheonganWithKingElement[0]), stem: cheonganWithKingElement[0] };
        } else {
          const saryeongElement = elementMap[saryeong];
          const saryeongInCheongan = cheonganWithKingElement.find(gan => elementMap[gan] === saryeongElement);
          result = { char: getGyeokName(dayGan, saryeongInCheongan), stem: saryeongInCheongan };
        }
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 3. 진술축미월
  if (!result && ['辰', '戌', '丑', '未'].includes(monthJi)) {
    const [yeogi, junggi, jeonggi] = jijiSibgans;
    const hasSamhapValue = hasSamhap(monthJi, otherJijiArr);

    if (hasSamhapValue) {
      const junggiElement = elementMap[junggi];
      const junggiInCheongan = chunganList.find(g => elementMap[g] === junggiElement);
      const samhapGyeokStem = junggiInCheongan || junggi;
      if (elementMap[samhapGyeokStem] !== elementMap[dayGan]) {
        result = { char: getGyeokName(dayGan, samhapGyeokStem), stem: samhapGyeokStem };
      }
    }

    if (!result) {
      let isFirstPeriod, isSecondPeriod;
      if (daYunDirection === 1) {
        isFirstPeriod = daeyunAge > 6;
        isSecondPeriod = daeyunAge <= 6;
      } else {
        isFirstPeriod = daeyunAge <= 4;
        isSecondPeriod = daeyunAge > 4;
      }

      if (isSecondPeriod) {
        const jeonggiElement = elementMap[jeonggi];
        const jeonggiInCheonganList = chunganList.filter(g => elementMap[g] === jeonggiElement);
        const jeonggiFirstCandidate =
          jeonggiInCheonganList.length === 1 ? jeonggiInCheonganList[0] : jeonggi;
        if (elementMap[jeonggiFirstCandidate] !== elementMap[dayGan]) {
          result = { char: getGyeokName(dayGan, jeonggiFirstCandidate), stem: jeonggiFirstCandidate };
        } else {
          const yeogiElement = elementMap[yeogi];
          const yeogiInCheonganList = chunganList.filter(g => elementMap[g] === yeogiElement);
          const yeogiSecondCandidate =
            yeogiInCheonganList.length === 1 ? yeogiInCheonganList[0] : yeogi;
          if (elementMap[yeogiSecondCandidate] !== elementMap[dayGan]) {
            result = { char: getGyeokName(dayGan, yeogiSecondCandidate), stem: yeogiSecondCandidate };
          } else {
            result = { char: '판별불가', wrap: false };
          }
        }
      } else if (isFirstPeriod) {
        const yeogiElement = elementMap[yeogi];
        const yeogiInCheonganList = chunganList.filter(g => elementMap[g] === yeogiElement);
        const yeogiFirstCandidate =
          yeogiInCheonganList.length === 1 ? yeogiInCheonganList[0] : yeogi;
        if (elementMap[yeogiFirstCandidate] !== elementMap[dayGan]) {
          result = { char: getGyeokName(dayGan, yeogiFirstCandidate), stem: yeogiFirstCandidate };
        } else {
          const jeonggiElement = elementMap[jeonggi];
          const jeonggiInCheonganList = chunganList.filter(g => elementMap[g] === jeonggiElement);
          const jeonggiSecondCandidate =
            jeonggiInCheonganList.length === 1 ? jeonggiInCheonganList[0] : jeonggi;
          if (elementMap[jeonggiSecondCandidate] !== elementMap[dayGan]) {
            result = { char: getGyeokName(dayGan, jeonggiSecondCandidate), stem: jeonggiSecondCandidate };
          } else {
            result = { char: '판별불가', wrap: false };
          }
        }
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 최종 전역 등록
  if (result) {
        // ✅ 건록격·양인격·월겁격·월비격 → 천간 붙이기
    if (["건록격","양인격","월겁격","월비격"].includes(result.char)) {
      result.char = `${result.char}(${result.stem})`;
    }
    window.gyeokName = result.char;
    window.gyeokStem = result.stem || null;
    window.gyeokWrap = result.wrap ?? null;
    console.log("▶ 격 판정 완료:", result);
  } else {
    window.gyeokName = null;
    window.gyeokStem = null;
    window.gyeokWrap = null;
    console.warn("⚠️ 격 판정 결과 없음");
  }

  return result;
}










//////보조격 구하는 함수
 export function getSecondaryGyeok() {
  const saju          = window.saju;
  const monthJi       = window.monthJi;
  const saryeong      = window.saryeong;
  const jijiSibgans   = jijiToSibganMap2[monthJi] || [];
  const chunganList   = window.sajuStemList?.map(x => x.value) || [];
  const dayGan        = saju.dayGan;
  const primaryStem   = window.gyeokStem;
  const primaryChar   = window.gyeokName;
  const daeyunAge     = window.daeyunAge;
  const daYunDirection= window.daYunDirection;
 // 월지를 제외한 지지 배열
const otherJijiArr = (window.sajuJijiArray || []).filter(j => j !== window.monthJi);


  let result = null;

  // 1. 생지(寅申巳亥) 보조격 판별
  if (['寅', '申', '巳', '亥'].includes(monthJi)) {
    if (
      primaryChar === '양인격' ||
      primaryChar === '건록격' ||
      primaryChar === '월비격' ||
      primaryChar === '월겁격'
    ) {
      result = null;
    } else {
      const junggi = jijiSibgans[0];
      const jeonggi = jijiSibgans[1];
      const isSamhap = hasSamhap(monthJi, otherJijiArr);
      const isJunggiSaryeong = saryeong === junggi;
      const junggiInChungan = chunganList.includes(junggi);
      const jeonggiInChungan = chunganList.includes(jeonggi);

      if (isSamhap && isJunggiSaryeong && junggiInChungan) {
        if (jeonggiInChungan) {
          result = {
            primary: { char: getGyeokName(dayGan, jeonggi), stem: jeonggi },
            secondary: { char: getGyeokName(dayGan, junggi), stem: junggi }
          };
        } else {
          result = {
            primary: { char: getGyeokName(dayGan, junggi), stem: junggi },
            secondary: { char: getGyeokName(dayGan, jeonggi), stem: jeonggi }
          };
        }
      }
    }
  }

  // 2. 왕지(子午卯酉) 보조격 판별
  if (!result && ['子', '午', '卯', '酉'].includes(monthJi)) {
    if (
      primaryChar === '양인격' ||
      primaryChar === '건록격' ||
      primaryChar === '월비격' ||
      primaryChar === '월겁격'
    ) {
      result = null;
    } else {
      if (primaryStem && primaryStem !== saryeong) {
        result = { char: getGyeokName(dayGan, saryeong), stem: saryeong };
      }
    }
  }

  // 3. 고지(辰戌丑未) 보조격 판별
  if (!result && ['辰', '戌', '丑', '未'].includes(monthJi)) {
    const [yeogi, junggi, jeonggi] = jijiSibgans;

    if (hasSamhap(monthJi, otherJijiArr)) {
      if (primaryStem !== junggi) {
        const candidateChar = getGyeokName(dayGan, junggi);
        if (
          !['월비격', '월겁격', '건록격', '양인격'].some(type => candidateChar.startsWith(type))
        ) {
          result = { char: candidateChar, stem: junggi };
        }
      }
    }

    if (!result) {
      let isFirstPeriod, isSecondPeriod;
      if (daYunDirection === 1) {
        isFirstPeriod = daeyunAge > 6;
        isSecondPeriod = daeyunAge <= 6;
      } else {
        isFirstPeriod = daeyunAge <= 4;
        isSecondPeriod = daeyunAge > 4;
      }

      if (isFirstPeriod) {
        if (primaryStem !== yeogi) {
          const candidateChar = getGyeokName(dayGan, yeogi);
          if (
            !['월비격', '월겁격', '건록격', '양인격'].some(type => candidateChar.startsWith(type))
          ) {
            result = { char: candidateChar, stem: yeogi };
          }
        }
      }
      if (!result && isSecondPeriod) {
        if (primaryStem !== jeonggi) {
          const candidateChar = getGyeokName(dayGan, jeonggi);
          if (
            !['월비격', '월겁격', '건록격', '양인격'].some(type => candidateChar.startsWith(type))
          ) {
            result = { char: candidateChar, stem: jeonggi };
          }
        }
      }
    }
  }

  // === 최종 전역 등록 ===
  if (result) {
    if (result.primary && result.secondary) {
      window.secondaryGyeok = {
        primaryChar: result.primary.char,
        primaryStem: result.primary.stem,
        secondaryChar: result.secondary.char,
        secondaryStem: result.secondary.stem
      };
      console.log("▶ 보조격 판정 완료:", window.secondaryGyeok);
    } else {
      window.secondaryGyeok = {
        primaryChar: result.char,
        primaryStem: result.stem
      };
      console.log("▶ 보조격 판정 완료:", window.secondaryGyeok);
    }
  } else {
    window.secondaryGyeok = null;
    console.warn("⚠️ 보조격 없음");
  }

  return result;
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



  //console.log(`🔍 격국 분석 (${gyeokName})`);
 // console.log('📌 일간:', dayGan);
  //console.log('📌 전체 육신 목록:', yukshinList.map(i => i.label));
 // console.log('✅ 상신:', sangsinItems.map(i => i.label));
 // console.log('✅ 구신:', gusinItems.map(i => i.label));
 // console.log('⚠️ 기신1:', gisin1Items.map(i => i.label));
 // console.log('⚠️ 기신2:', gisin2Items.map(i => i.label));
 // console.log('⚠️ 격:', gyeokStems.map(i => i.label));
//console.log('gyeokName (type/length):', typeof gyeokName, gyeokName.length, `"${gyeokName}"`);

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
    <div style="text-align:center; margin-top:6px; font-size:12px; font-family:monospace;">
      <br><br>* 위의 격도식에서  
      <span style="color:red; font-weight:">⮕</span>는 극의 관계, 
      <span style="color:blue; font-weight:">⮕</span>는 생의 관계
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
    <div style="text-align:center; margin-top:6px; font-size:12px; font-family:monospace;">
      <br><br>* 위의 격도식에서  
      <span style="color:red; font-weight:">⮕</span>는 극의 관계, 
      <span style="color:blue; font-weight:">⮕</span>는 생의 관계
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
 // console.log("[getGanForYukshin] dayGan=", dayGan, "yukshinName=", yukshinName, "table=", table);

  if (!table) return null;

  for (const gan in table) {
    if (table[gan] === yukshinName) {
    //  console.log("[getGanForYukshin] FOUND:", yukshinName, "=>", gan);
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

// 합신 테이블 렌더링 (전역변수 버전)
export function renderhapshinTable() {
  // 🔹 기존 인자 제거, 전역변수로 대체


  const saju      = window.saju;
  const dayGan    = window.saju?.dayGan;
  const gyeokName = window.gyeokName;
  const gyeokStem = window.gyeokStem;

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
        <td style="border:1px solid #ccc; padding:2px; width:14%; color:${ROLE_COLOR_MAP["격"]};font-weight:bold; background:#e6f0ff;">${gyeokName}</td>
        ${headers.map(h => `<td style="border:1px solid #ccc; padding:2px;background:#e6f0ff;">${h}</td>`).join("")}
      </tr>

     <tr>
  <td style="border:1px solid #ccc; padding:2px; background:#fff8dc;">命</td>
  ${["격","상신","구신","기신1","기신2"].map((role) => {
    const color = ROLE_COLOR_MAP[role] || "black";

    // 역할별 기준 천간
    let baseGan = null;
    if (role === "격") baseGan = gyeokStem;
    if (role === "상신") baseGan = getGanForYukshin(dayGan, map.sangsin);
    if (role === "구신") baseGan = getGanForYukshin(dayGan, map.gusin);
    if (role === "기신1") baseGan = getGanForYukshin(dayGan, map.gisin1);
    if (role === "기신2") baseGan = getGanForYukshin(dayGan, map.gisin2);

    console.log(`▶ [${role}] baseGan =`, baseGan);

    if (!baseGan) {
      console.log(`❌ [${role}] 기준 천간 없음 → X`);
      return `<td style="border:1px solid #ccc; padding:2px; background:#fff8dc;">X/X</td>`;
    }

    let cheonganMatch = "x";
    let jijiMatch = "x";

    // --- 1. 천간 검사 (⚡ 일간 제외)
    const cheonganList = [saju.yearGan, saju.monthGan, saju.hourGan].filter(Boolean);
  //  console.log(`🔎 [${role}] 천간 리스트 =`, cheonganList);
    if (cheonganList.includes(baseGan)) {
   //   console.log(`✅ [${role}] ${baseGan} → 천간 매칭`);
      cheonganMatch = `${baseGan}(天)`;
    }

    // --- 2. 지지 지장간 검사 (중기 제외)
    const jijiList = [saju.yearBranch, saju.monthBranch, saju.dayBranch, saju.hourBranch].filter(Boolean);
  //  console.log(`🔎 [${role}] 지지 리스트 =`, jijiList);

    for (const branch of jijiList) {
      const sibgans = jijiToSibganMap[branch] || [];
      const filtered = sibgans.filter(s => s?.char && !s.isMiddle);
//console.log(`   • [${role}] ${branch} 지장간 =`, filtered.map(s => s.char));

      if (filtered.some(s => s.char === baseGan)) {
    //    console.log(`✅ [${role}] ${baseGan} → ${branch} 지장간 매칭`);
        jijiMatch = `${baseGan}(地)`;
        break;
      }
    }

    const displayVal = `${cheonganMatch} / ${jijiMatch}`;
    console.log(`▶ [${role}] 결과 =`, displayVal);

    return `<td style="border:1px solid #ccc; padding:2px; color:${color}; ">${displayVal}</td>`;
  }).join("")}
</tr>





<tr>
  <td style="border:1px solid #ccc; padding:2px; background:#fff8dc;">運</td>
  ${["격","상신","구신","기신1","기신2"].map((role) => {
    const color = ROLE_COLOR_MAP[role] || "black";

    // 역할별 기준 천간
    let baseGan = null;
    if (role === "격") baseGan = window.gyeokStem;
    if (role === "상신") baseGan = getGanForYukshin(window.saju.dayGan, map.sangsin);
    if (role === "구신") baseGan = getGanForYukshin(window.saju.dayGan, map.gusin);
    if (role === "기신1") baseGan = getGanForYukshin(window.saju.dayGan, map.gisin1);
    if (role === "기신2") baseGan = getGanForYukshin(window.saju.dayGan, map.gisin2);

   //console.group(`運행 [${role}]`);
    //console.log("▶ 기준 baseGan =", baseGan);

    if (!baseGan) {
      console.warn("❌ 기준 천간 없음 → X/X 반환");
      console.groupEnd();
      return `<td style="border:1px solid #ccc; padding:2px; background:#fff8dc;">x / x</td>`;
    }

    // 십신명 구하기 (일간 기준)
    const yukshinName = tenGodMap[window.saju.dayGan]?.[baseGan] || "십신?";

    // 천간/지지 결과 (기본 x)
    let cheonganMatch = "x";
    let jijiMatch = "x";

    // --- 1. 대운 검사 ---
    if (window.selectedDaewoon) {
      const d = window.selectedDaewoon;
      if (d.stem === baseGan) {
        cheonganMatch = `${baseGan}(天·大)`;
      }
      const sibgans = jijiToSibganMap[d.branch] || [];
      const found = sibgans.find(s => s?.char === baseGan && !s.isMiddle);
      if (found) {
        jijiMatch = `${baseGan}(地·大)`;
      }
    }

    // --- 2. 세운 검사 ---
    if (window.selectedSewoon) {
      const s = window.selectedSewoon;
      if (s.stem === baseGan) {
        cheonganMatch = `${baseGan}(天·世)`;
      }
      const sibgans = jijiToSibganMap[s.branch] || [];
      const found = sibgans.find(sb => sb?.char === baseGan && !sb.isMiddle);
      if (found) {
        jijiMatch = `${baseGan}(地·世)`;
      }
    }

    const displayVal = `${cheonganMatch} / ${jijiMatch}`;
    //console.log(`🎯 최종 displayVal = ${displayVal}`);
    //console.groupEnd();

    return `<td style="border:1px solid #ccc; padding:2px; color:${color}; ">${displayVal}</td>`;
  }).join("")}
</tr>







<tr>
  <td style="border:1px solid #ccc; padding:2px; background:#fff8dc;">天合</td>
  ${["격","상신","구신","기신1","기신2"].map((role, i) => {
    const color = ROLE_COLOR_MAP[role] || "black";

    // 역할별 기준 천간
    let baseGan = null;
    if (role === "격") baseGan = window.gyeokStem;
    if (role === "상신") baseGan = getGanForYukshin(window.saju.dayGan, map.sangsin);
    if (role === "구신") baseGan = getGanForYukshin(window.saju.dayGan, map.gusin);
    if (role === "기신1") baseGan = getGanForYukshin(window.saju.dayGan, map.gisin1);
    if (role === "기신2") baseGan = getGanForYukshin(window.saju.dayGan, map.gisin2);

    //console.group(`🔎 합신 검사 [${role}]`);
    //console.log("기준 baseGan =", baseGan);

    if (!baseGan) {
      console.warn("❌ 기준 천간 없음 → X");
      console.groupEnd();
      return `<td style="border:1px solid #ccc; padding:2px; background:#fff8dc;">X</td>`;
    }

    // --- 합신 対象 찾기 ---
    const hapTarget = 간합MAP[baseGan];
    if (!hapTarget) {
      //console.warn(`⚠ ${baseGan}는 합신 対象 없음`);
      //console.groupEnd();
      return `<td style="border:1px solid #ccc; padding:2px; color:${color}; background:#fff8dc;">X</td>`;
    }
    //console.log(`합신 対象(${baseGan}) =`, hapTarget);

    // --- 비교 목록 준비 ---
    const cheonganList = [window.saju.yearGan, window.saju.monthGan, window.saju.hourGan]
      .filter(Boolean)
      .filter(gan => gan !== window.saju.dayGan); // 일간 제외
    if (window.selectedDaewoon?.stem) cheonganList.push(window.selectedDaewoon.stem);
    if (window.selectedSewoon?.stem) cheonganList.push(window.selectedSewoon.stem);

   // console.log("비교 목록 =", cheonganList);

    // --- 매칭 검사 ---
    const sources = [];
    if (cheonganList.includes(hapTarget)) {
      const yukshinName = tenGodMap[window.saju.dayGan]?.[hapTarget] || "십신?";
      const idxDaewoon = window.selectedDaewoon?.stem === hapTarget;
      const idxSewoon = window.selectedSewoon?.stem === hapTarget;

      if (idxDaewoon) {
        sources.push(`${yukshinName}[${hapTarget}(天·大)]`);
      }
      if (idxSewoon) {
        sources.push(`${yukshinName}[${hapTarget}(天·世)]`);
      }
      // 원국 천간에서 잡혔는데 大/世가 아니면 그냥 기본 합신
      if (!idxDaewoon && !idxSewoon) {
        sources.push(`${yukshinName}[${hapTarget}]`);
      }
    }

    const displayVal = sources.length > 0 ? sources.join(" / ") : "X";
   // console.log("🎯 최종 displayVal =", displayVal);
    //console.groupEnd();

    return `<td style="border:1px solid #ccc; padding:2px; color:${color}; ">${displayVal}</td>`;
  }).join("")}
</tr>





<tr>
  <td style="border:1px solid #ccc; padding:2px; background:#fff8dc;">地合</td>
  ${["격","상신","구신","기신1","기신2"].map((role, i) => {
    const color = ROLE_COLOR_MAP[role] || "black";

    // 역할별 기준 천간
    let baseGan = null;
    if (role === "격") baseGan = window.gyeokStem;
    if (role === "상신") baseGan = getGanForYukshin(window.saju.dayGan, map.sangsin);
    if (role === "구신") baseGan = getGanForYukshin(window.saju.dayGan, map.gusin);
    if (role === "기신1") baseGan = getGanForYukshin(window.saju.dayGan, map.gisin1);
    if (role === "기신2") baseGan = getGanForYukshin(window.saju.dayGan, map.gisin2);

  //  console.group(`🔎 암합 검사 [${role}]`);
   // console.log("기준 baseGan =", baseGan);

    if (!baseGan) {
   //   console.warn("❌ 기준 천간 없음 → X");
   //   console.groupEnd();
      return `<td style="border:1px solid #ccc; padding:2px; background:#fff8dc;">X</td>`;
    }

    // --- 합신 対象 찾기 ---
    const hapTarget = 간합MAP[baseGan];
    if (!hapTarget) {
   //   console.warn(`⚠ ${baseGan}는 암합 対象 없음`);
   //   console.groupEnd();
      return `<td style="border:1px solid #ccc; padding:2px; color:${color}; background:#fff8dc;">X</td>`;
    }
   // console.log(`암합 対象(${baseGan}) =`, hapTarget);

    // --- 비교 지지 목록 준비 ---
    const branchList = [
      window.saju.yearBranch,
      window.saju.monthBranch,
      window.saju.dayBranch,
      window.saju.hourBranch,
      window.selectedDaewoon?.branch,
      window.selectedSewoon?.branch
    ].filter(Boolean);

    //console.log("비교 branchList =", branchList);

    const sourcesSet = new Set();

    branchList.forEach(branch => {
      const sibgans = jijiToSibganMap[branch] || [];
      sibgans.forEach(s => {
        if (s?.char === hapTarget) {
          const yukshinName = tenGodMap[window.saju.dayGan]?.[hapTarget] || "십신?";
          const middleMark = s.isMiddle ? "中" : "";

          let tag = "地"; // ✅ 기본은 地
          if (branch === window.selectedDaewoon?.branch) tag = "地·大";
          if (branch === window.selectedSewoon?.branch) tag = "地·世";

          sourcesSet.add(`${yukshinName}[${hapTarget}(${middleMark}${tag}])`);
          console.log(`✅ 암합 매칭: ${hapTarget} in ${branch} (${yukshinName})`);
        }
      });
    });

    const sources = Array.from(sourcesSet); // 중복 제거
    const displayVal = sources.length > 0 ? sources.join(" / ") : "X";
    console.log("🎯 최종 displayVal =", displayVal);
    console.groupEnd();

    return `<td style="border:1px solid #ccc; padding:2px; color:${color}; ">${displayVal}</td>`;
  }).join("")}
</tr>





    </table>

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
export function renderIlganGyeokTable({ gyeokName, secondaryGyeokResult } = {}) {
  const saju = window.saju;

  if (!saju) {
    console.warn("⚠️ window.saju 가 아직 준비되지 않았습니다.");
    return "";
  }

  const { yearGan, monthGan, dayGan, hourGan,
          yearBranch, monthBranch, dayBranch, hourBranch } = saju;
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

  console.log("▶ 일간:", ilgan, "월지:", wolji, "gyeokName:", gyeokName);
  // 시간 천간을 일간 기준으로 해석


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
 // console.log(`\n===== [${targetGan}] 점수 계산 시작 =====`);

  // 1) 천간끼리 십신 관계 판정
  for (let gan of chunganList) {
    if (gan === targetGan) continue;
    const yukshin = tenGodMap[targetGan]?.[gan];
    if (["정인","편인","식신","상관"].includes(yukshin)) {
      score += 12.5;
    //  console.log(`천간관계: ${targetGan} vs ${gan} → ${yukshin} +12.5`);
    }
  }

  // 2) 지지 속 천간들과의 관계 판정
  for (let gan of jijiGanlists) {
    const yukshin = tenGodMap[targetGan]?.[gan];
    if (["정인","편인","식신","상관"].includes(yukshin)) {
      score += 12.5;
   //   console.log(`지지관계: ${targetGan} vs ${gan} → ${yukshin} +12.5`);
    }
  }

  // 3) 뿌리 여부 판정 (개수만큼 점수)
  const roots = (ganRootMap[targetGan] || "").split(",");
  let rootCount = roots.filter(root => jijiList.includes(root.replace("(?)",""))).length;

  if (rootCount > 0) {
    score += rootCount * 12.5;
 //   console.log(`뿌리 존재: ${targetGan} → ${rootCount}개 → +${rootCount * 12.5}`);
  }

  // 4) 당령 보정
  if (dangryeong) {
    const targetElement = elementMap[targetGan];
    const dangElement = elementMap[dangryeong];

    if (targetElement === dangElement) {
      score += 100;
   //   console.log(`당령 보정: ${targetGan}(${targetElement}) 동일 → +100`);
    } 
    else if (SANGSAENG_MAP[dangElement] === targetElement) {
      score += 80;
   //   console.log(`당령 보정: ${dangElement} → ${targetElement} (당령이 생) → +80`);
    } 
    else if (SANGSAENG_MAP[targetElement] === dangElement) {
      score += 60;
  //    console.log(`당령 보정: ${targetElement} → ${dangElement} (target이 생) → +60`);
    } 
    else if (SANGGEUK_MAP[targetElement] === dangElement) {
      score += 30;
  //    console.log(`당령 보정: ${targetElement} → ${dangElement} (target이 극) → +30`);
    } 
    else if (SANGGEUK_MAP[dangElement] === targetElement) {
      score += 10;
   //   console.log(`당령 보정: ${dangElement} → ${targetElement} (당령이 극) → +10`);
    }
  }

  const finalScore = score / 2;
  const yukshin = tenGodMap[ilganHan]?.[targetGan] || null;  // 일간 기준 십신
  console.log(`▶ [${targetGan}] 최종 점수 = ${finalScore}, 십신=${yukshin}`);

  return { score: finalScore, yukshin };
}

// ================== 사주 데이터 준비 ==================
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

// ✅ 당령 구하기
const dangryeong = getDangryeong(wolji, daeyunAge, daYunDirection);
// ✅ 삼합 대표간 구하기
const extraGans = getSamhapSupportGans(jijiList);

// 십신 관계용 = 원국 천간 + 삼합 대표간
const relationChunganList = [
  ...cheongans,
  ...extraGans
];
//console.log("▶ jijiGanlists (지지 속 천간들):", jijiGanlists);
//console.log("▶ relationChunganList (십신 관계용: 원국 + 삼합대표간):", relationChunganList);


// ================== 전체 10천간 강약 점수 계산 ==================
const ilganHan = convertKorToHanStem(saju.dayGan);
const allTenGans = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];

for (let gan of allTenGans) {
  const result = getGanStrengthScore(
    gan,
    relationChunganList,
    jijiGanlists,
    tenGodMap,
    ganRootMap,
    jijiList,
    dangryeong,
    ilganHan
  );
  ganStrengthResults[gan] = result;  // {score, yukshin

 }
// ✅ 여기서 합산 검사
for (let [gan, info] of Object.entries(ganStrengthResults)) {
  if (!info) continue;
  console.log(`합산 검사: ${gan}, 점수=${info.score}, 십신=${info.yukshin}`);
}

//일간, 관성 총점구하기////////////////
// ================== 합산 점수 계산 함수 ==================
const GAN_BONUS_MAP = {
  "戊": 100,
  "丙": 80, "壬": 80,
  "甲": 60, "庚": 60,
  "己": 40, "丁": 40, "癸": 40,
  "乙": 20, "辛": 20
};

// ================== 일간총점 ==================
function calculateIlganTotal(ilganHan, ganStrengthResults, cheongans, jijiGanlists) {
  let total = 0;
  console.log("\n=== ▶ 일간 총합 계산 시작 ===");

  // 1) 일간 점수
  const ilganScore = ganStrengthResults[ilganHan]?.score || 0;
  console.log(`일간값: ${ilganHan} = ${ilganScore}`);
  total += ilganScore;

  // 🔹 일간 가산점
  const ilganBonus = GAN_BONUS_MAP[ilganHan] || 0;
  if (ilganBonus > 0) {
    console.log(`일간 가산점: ${ilganHan} → +${ilganBonus}`);
    total += ilganBonus;
  }

  // 2) 비견, 겁재, 식신, 상관, 편인, 정인
  for (let type of ["비견", "겁재", "식신", "상관", "편인", "정인"]) {
    let ganSubtotal = 0;
    let jijiSubtotal = 0;

    for (let [gan, info] of Object.entries(ganStrengthResults)) {
      if (!info || info.yukshin !== type) continue;

      // 천간 점수
      if (cheongans.includes(gan)) {
        ganSubtotal += info.score;
      }

      // 지지 점수 (1/10)
      const countInJiji = jijiGanlists.filter(g => g === gan).length;
      if (countInJiji > 0) {
        jijiSubtotal += (info.score * 0.1) * countInJiji;
      }
    }

    console.log(`${type}천간 = ${ganSubtotal}`);
    console.log(`${type}지지 = ${jijiSubtotal}`);

    total += ganSubtotal + jijiSubtotal;
  }

  // ✅ 보정값: 식신·상관 투간 → 개수만큼 100점씩 추가
  let bojeong = 0;
  for (let type of ["식신", "상관"]) {
    const count = Object.entries(ganStrengthResults).filter(
      ([gan, info]) => info.yukshin === type && cheongans.includes(gan)
    ).length;

    if (count > 0) {
      bojeong += count * 100;
      console.log(`보정: ${type} 투간 ${count}개 → +${count * 100}`);
    } else {
      console.log(`보정: ${type} 투간 없음 → +0`);
    }
  }

  total += bojeong;

  console.log(`보정값 = ${bojeong}`);
  console.log(`▶ 일간총합 (raw) = ${total}`);

  // ✅ 700으로 나누고 최종값은 백분율
  const normalized = (total / 800) * 100;
  console.log(`▶ 일간총합 (백분율) = ${normalized.toFixed(1)}%`);
  return normalized;
}

// ================== 관성총점 ==================
function calculateGwanTotal(ganStrengthResults, cheongans, jijiGanlists) {
  let total = 0;
  console.log("\n=== ▶ 관성 총합 계산 시작 ===");

  // 편관, 정관, 편재, 정재, 편인, 정인
  for (let type of ["편관", "정관", "편재", "정재", "편인", "정인"]) {
    let ganSubtotal = 0;
    let jijiSubtotal = 0;

    for (let [gan, info] of Object.entries(ganStrengthResults)) {
      if (!info || info.yukshin !== type) continue;

      // 천간 점수
      if (cheongans.includes(gan)) {
        ganSubtotal += info.score;

        // 🔹 관성 가산점 (천간일 때만)
        const bonus = GAN_BONUS_MAP[gan] || 0;
        if (bonus > 0) {
          console.log(`관성 가산점: ${gan}(${type}) → +${bonus}`);
          ganSubtotal += bonus;
        }
      }

      // 지지 점수 (1/10)
      const countInJiji = jijiGanlists.filter(g => g === gan).length;
      if (countInJiji > 0) {
        jijiSubtotal += (info.score * 0.1) * countInJiji;
      }
    }

    console.log(`${type}천간 = ${ganSubtotal}`);
    console.log(`${type}지지 = ${jijiSubtotal}`);

    total += ganSubtotal + jijiSubtotal;
  }

  // ✅ 보정값: 편관·정관·편인·정인 투간 개수 × 100
  let bojeong = 0;
  for (let type of ["편관", "정관", "편인", "정인"]) {
    const count = Object.entries(ganStrengthResults).filter(
      ([gan, info]) => info.yukshin === type && cheongans.includes(gan)
    ).length;

    if (count > 0) {
      bojeong += count * 100;
      console.log(`보정: ${type} 투간 ${count}개 → +${count * 100}`);
    } else {
      console.log(`보정: ${type} 투간 없음 → +0`);
    }
  }

  total += bojeong;

  console.log(`보정값 = ${bojeong}`);
  console.log(`▶ 관성총합 (raw) = ${total}`);

  // ✅ 700으로 나누고 최종값은 백분율
  const normalized = (total / 600) * 100;
  console.log(`▶ 관성총합 (백분율) = ${normalized.toFixed(1)}%`);
  return normalized;
}



// ================== 실제 계산 ==================


// 일간총점 (일간 + 비견, 겁재, 식신, 상관)
// 일간총점
const ilganTotal = calculateIlganTotal(
  ilganHan,           // ✅ 일간(한자)만 넘겨야 함
  ganStrengthResults,
  chunganList,
  jijiGanlists
);

// 관성총점
const gwanTotal = calculateGwanTotal(
  ganStrengthResults,
  chunganList,
  jijiGanlists
);

//console.log(`▶ 일간 총점 = ${ilganTotal}`);
//console.log(`▶ 관성 총점 = ${gwanTotal}`);


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
const rawSecondaryName = secondaryGyeokResult?.char 
  || window.secondaryGyeok?.secondaryChar 
  || "X";



console.log("📌 [격 판정 원본] 주격 =", rawMainName, "보조격 =", rawSecondaryName);

// 2) 판정용 정규화 이름
function normalizeKey(name) {
  return (name || "")
    .replace(/\(.*?\)/g, "")  // 괄호 제거
    .trim()                   // 앞뒤 공백 제거
    .normalize("NFC");        // 유니코드 정규화
}

const normalizedMainName = normalizeKey(rawMainName);
const normalizedSecondaryName = normalizeKey(rawSecondaryName);

console.log("📌 [격 판정 정규화] 주격 =", normalizedMainName, "보조격 =", normalizedSecondaryName);

//격에 따른 격 강도 계산
// 주격 천간 찾기 (사주에 있든 없든 무조건 찾음)
// === 주격 강도 계산 ===
if (normalizedMainName && normalizedMainName !== "X") {
  const targetYuksin = GYEOK_YUKSHIN_MAP[normalizedMainName]?.gyeokname2;
  if (targetYuksin) {
    const mapping = tenGodMap[dayGanHan];
    const mainGan = Object.keys(mapping).find(gan => mapping[gan] === targetYuksin);

    if (mainGan) {
      console.log(`\n📌 주격천간 ${normalizedMainName} → 육신(${targetYuksin}) → 천간(${mainGan})`);

      let score = getGanStrengthScore(
        mainGan,
        relationChunganList,
        jijiGanlists,
        tenGodMap,
        ganRootMap,
        jijiList,
        dangryeong
      );

      // ✅ 객체 형태로 저장
      ganStrengthResults[normalizedMainName] = { score, yukshin: targetYuksin };

      console.log(`✅ 주격 ${normalizedMainName} 강도 점수 = ${score}`);
    }
  }
}

// === 보조격 강도 계산 ===
if (normalizedSecondaryName && normalizedSecondaryName !== "X") {
  const targetYuksin = GYEOK_YUKSHIN_MAP[normalizedSecondaryName]?.gyeokname2;
  if (targetYuksin) {
    const mapping = tenGodMap[dayGanHan];
    const secondaryGan = Object.keys(mapping).find(gan => mapping[gan] === targetYuksin);

    if (secondaryGan) {
      console.log(`\n📌 보조격천간 ${normalizedSecondaryName} → 육신(${targetYuksin}) → 천간(${secondaryGan})`);

      let score = getGanStrengthScore(
        secondaryGan,
        relationChunganList,
        jijiGanlists,
        tenGodMap,
        ganRootMap,
        jijiList,
        dangryeong
      );

      // ✅ 객체 형태로 저장
      ganStrengthResults[normalizedSecondaryName] = { score, yukshin: targetYuksin };

      console.log(`✅ 보조격 ${normalizedSecondaryName} 강도 점수 = ${score}`);
    }
  }
} else {
  console.warn("⚠️ 보조격 조건 불충족:", normalizedSecondaryName);
}

// ✅ 점수만 추출해서 별도 맵 생성
const ganStrengthScores = {};
for (let [key, value] of Object.entries(ganStrengthResults)) {
  ganStrengthScores[key] = (typeof value === "object") ? value.score : value;
}

// ▶ 주격 등급
console.log("▶ 주격 원본:", rawMainName, "정규화:", normalizedMainName);
const mainGrade = getGyeokGrade(
  saju,
  normalizedMainName,
  tenGodMap,
  ganStrengthScores,   // ✅ 점수만 넘김
  normalizedSecondaryName,
  secondaryGyeokResult
);
console.log("▶ 주격 등급 결과:", mainGrade);

// ▶ 보조격 등급
let secondaryGrade = null;
if (normalizedSecondaryName && GYEOK_YUKSHIN_MAP[normalizedSecondaryName]) {
  console.log("▶ 보조격 원본:", rawSecondaryName, "정규화:", normalizedSecondaryName);
  secondaryGrade = getGyeokGrade(
    saju,
    normalizedSecondaryName,
    tenGodMap,
    ganStrengthScores,   // ✅ 점수만 넘김
    normalizedSecondaryName,
    secondaryGyeokResult
  );
  console.log("▶ 보조격 등급 결과:", secondaryGrade);
} else {
  console.log("▶ 보조격 없음:", rawSecondaryName);
}



// ✅ 일간의 환경 계산 (천간/지지 구분 적용 + 근旺 마지막 표기)
// ✅ 일간의 환경 계산 (mainRequired 비교 포함, 일지 포함)
function getEnvironmentText(saju) {
  const dayGanHan = convertKorToHanStem(saju.dayGan);
  const envSet = new Set();

  // 1) 천간 (일간 제외)
  const otherChungans = [saju.yearGan, saju.monthGan, saju.hourGan].map(convertKorToHanStem);
  for (let gan of otherChungans) {
    const yukshin = tenGodMap[dayGanHan]?.[gan];
    if (yukshin === "비견") envSet.add("비");
    if (yukshin === "겁재") envSet.add("겁");
    if (yukshin === "정인") envSet.add("정인");   // ✅ 천간은 정인 그대로
    if (yukshin === "편인") envSet.add("편인");   // ✅ 천간은 편인 그대로
  }

  // 2) 지지 속 지장간 (일지 포함!)
  const otherBranches = [saju.yearBranch, saju.monthBranch, saju.dayBranch, saju.hourBranch].map(convertKorToHanBranch);
  for (let branch of otherBranches) {
    const sibgans = jijiToSibganMap3[branch] || [];
    for (let gan of sibgans) {
      const yukshin = tenGodMap[dayGanHan]?.[gan];
      if (["정인","편인"].includes(yukshin)) envSet.add("相");  // ✅ 지지는 상으로 통합
      // 지지 비견/겁재는 무시
    }
  }

  // 3) 근 여부
  const roots = (ganRootMap[dayGanHan] || "").split(",");
  const hasRoot = roots.some(root => otherBranches.includes(root.replace("(?)","")));
  if (hasRoot) envSet.add("근");

  // 배열로 변환
  let envArr = [...envSet];

  // ✅ 마지막 요소에 旺 붙이기
  if (envArr.length > 0) {
    envArr[envArr.length - 1] = envArr[envArr.length - 1] + "旺";
  }

  return envArr.join(",");
}




// ✅ 요구조건 텍스트 안에서 일간환경과 겹치는 글자만 빨강 표시
function highlightRequired(requiredText, environmentText) {
  if (!requiredText || requiredText === "-") return requiredText;

  const envParts = environmentText.split(",").map(p => p.replace("旺", ""));
  const reqParts = requiredText.split(",");

  return reqParts.map(part => {
    const base = part.replace("旺", ""); // 旺 제거
    if (envParts.some(env => env.startsWith(base))) {
      // 글자는 빨강, 旺은 그대로
      if (part.endsWith("旺")) {
        return `<span style="color:red;">${base}</span>旺`;
      } else {
        return `<span style="color:red;">${base}</span>`;
      }
    }
    return part;
  }).join(",");
}


// ✅ 일간환경 텍스트 안에서 요구조건과 겹치는 글자만 빨강 표시
function highlightEnvironment(environmentText, requiredText) {
  if (!environmentText) return "-";
  if (!requiredText || requiredText === "-") return environmentText;

  const reqParts = requiredText.split(",");
  const reqBase = reqParts.map(p => p.replace("旺", ""));

  return environmentText.split(",").map(part => {
    const base = part.replace("旺", "");  // 旺 제거한 비교용
    if (reqBase.some(r => base.startsWith(r))) {
      if (part.endsWith("旺")) {
        // 앞 글자만 빨강, 旺은 그대로
        return `<span style="color:red;">${base}</span>旺`;
      } else {
        return `<span style="color:red;">${part}</span>`;
      }
    }
    return part;
  }).join(",");
}



//격의 성패조건 삽입


const rawMainRequired = GYEOK_SEONGPAE_MAP[normalizedMainName]?.required || "-";
const rawSecondaryRequired = GYEOK_SEONGPAE_MAP[normalizedSecondaryName]?.required || "-";

const environmentTextMain = getEnvironmentText(saju);
const environmentTextSecondary = getEnvironmentText(saju);
const mainRequired = highlightRequired(rawMainRequired, environmentTextMain);
const secondaryRequired = highlightRequired(rawSecondaryRequired, environmentTextSecondary);

const mainEnvironment = highlightEnvironment(environmentTextMain, rawMainRequired);
const secondaryEnvironment = highlightEnvironment(environmentTextSecondary, rawSecondaryRequired);





//세력비교
// ✅ 세력 비교 문자열
// ✅ 세력 비교 문자열 + 색상
let powerCompare = "";
const diff = Math.abs(ilganTotal - gwanTotal);

if (diff <= 5) {
  powerCompare = `<span style="color:orange;">身≈官</span>`;
} else if (ilganTotal > gwanTotal) {
  powerCompare = `<span style="color:red;">身>官</span>`;
} else {
  powerCompare = `<span style="color:blue;">身<官</span>`;
}

//격의 성패조건 삽입


// ✅ 성패 판정
// ----------------------
// 주격 성패판정
// ----------------------
// 요구조건 하이라이트 결과에 빨강색이 있는지 확인
function hasRed(text) {
  return /<span style="color:red;">/.test(text);
}

// ----------------------
// 주격 성패판정
// ----------------------
let seongpaeMain = `<span style="color:red;">破</span>`;
const sangsinMain = GYEOK_YUKSHIN_MAP[normalizedMainName]?.sangsin || null;
const sangsinMainInChungan = sangsinMain && relationChunganList.some(
  gan => tenGodMap[dayGanHan]?.[gan] === sangsinMain
);
if (
  (sangsinMainInChungan || hasRed(mainRequired)) && 
  (powerCompare.includes("身<官") || powerCompare.includes("身≈官"))
) {
  seongpaeMain = `<span style="color:blue;">成</span>`;
}

// ----------------------
// 보조격 성패판정
// ----------------------
let seongpaeSecondary;

if (!normalizedSecondaryName || normalizedSecondaryName.trim() === "X") {
  // 보조격 이름 자체가 없거나 공백이면 '-'
  seongpaeSecondary = `<span style="color:gray;">-</span>`;
} else if (GYEOK_YUKSHIN_MAP[normalizedSecondaryName]) {
  seongpaeSecondary = `<span style="color:red;">破</span>`; // 기본값을 여기로 이동

  const sangsinSecondary = GYEOK_YUKSHIN_MAP[normalizedSecondaryName]?.sangsin || null;
  const sangsinSecondaryInChungan =
    sangsinSecondary && relationChunganList.some(
      gan => tenGodMap[dayGanHan]?.[gan] === sangsinSecondary
    );

  if (
    (sangsinSecondaryInChungan || hasRed(secondaryRequired)) && 
    (powerCompare.includes("身<官") || powerCompare.includes("身≈官"))
  ) {
    seongpaeSecondary = `<span style="color:blue;">成</span>`;
  }
} else {
  // 이름은 있는데 GYEOK_YUKSHIN_MAP에 없는 경우 → 파
  seongpaeSecondary = `<span style="color:red;">破</span>`;
}





  let IlganGyeokTablehtml = `
  <div style="text-align:left; margin:8px 0; color:#0077cc;">
  06] 격의 등급(성패) & 육신의 왕쇠강약
</div>
<table border="1" 
       style="border-collapse: collapse; text-align:center; width: 100%; margin-bottom:0; font-size:14px;">
  <thead>
    <tr style="background:#fff8dc;">
      <th style="padding:3px;">구분</th>
      <th style="padding:3px;">격이름</th>
      <th style="padding:3px;">격등급</th>
      <th style="padding:3px;">격의 요구조건</th>
      <th style="padding:3px;">일간의 환경</th>
      <th style="padding:3px;">勢비교</th>
      <th style="padding:3px;">성패[최종]</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:3px;background:#e6f0ff;">주격</td>
      <td style="padding:3px;">${gyeokName || '-'}</td>
      <td style="padding:3px;">${mainGrade ? mainGrade.final : '-'}</td>
    <td style="padding:3px;">${mainRequired}</td>
<td style="padding:3px;">${mainEnvironment || "-"}</td>

      <td style="padding:3px;">${powerCompare}</td>
      <td style="padding:3px;">${seongpaeMain}</td>
    </tr>
    <tr>
      <td style="padding:3px;background:#e6f0ff;">보조격</td>
        <td style="padding:3px;">${rawSecondaryName}</td>
  <td style="padding:3px;">${secondaryGrade ? secondaryGrade.final : '-'}</td>
<td style="padding:3px;">${secondaryRequired}</td>
<td style="padding:3px;">${secondaryEnvironment || "-"}</td>
 <td style="padding:3px;">${powerCompare}</td>
     <td style="padding:3px;">${seongpaeSecondary}</td>
    
    </tr>
    <tr>
      <td colspan="7" style="padding:3px; text-align:center;font-size:12px;">
        * 점수 "총점<span style="color:blue;">100점</span>"중의 환산점수를 의미함. <span style="color:red;">破</span>는 격이 성립되지 못함을 의미 
      </td>
    </tr>
  </tbody>
</table>

<table border="1" 
       style="border-collapse: collapse; text-align:center; width: 100%; font-size:14px; margin-top:1px;">
  <thead>
    <tr style="background:#fff8dc;">
  <th style="padding:3px; width:100px;">천간</th>
<th style="padding:3px;">
  ${convertKorToHanStem(saju.hourGan)} 
  (${tenGodMap[convertKorToHanStem(saju.dayGan)][convertKorToHanStem(saju.hourGan)]})
</th>
<th style="padding:3px;">
  <span style="color:red;">
    ${convertKorToHanStem(saju.dayGan)} (일간)
  </span>
</th>
<th style="padding:3px;">
  ${convertKorToHanStem(saju.monthGan)} 
  (${tenGodMap[convertKorToHanStem(saju.dayGan)][convertKorToHanStem(saju.monthGan)]})
</th>
<th style="padding:3px;">
  ${convertKorToHanStem(saju.yearGan)} 
  (${tenGodMap[convertKorToHanStem(saju.dayGan)][convertKorToHanStem(saju.yearGan)]})
</th>

   <th colspan="2" style="padding:3px; width:100px;">일간&관성</th>

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
      

<td style="padding:3px;background:#fff8dc;">
  일간[${convertKorToHanStem(saju.dayGan)}]
</td>


<td style="padding:3px;background:#fff8dc;">
  관[
    ${
      Object.entries(tenGodMap[convertKorToHanStem(saju.dayGan)] || {})
        .filter(([gan, yukshin]) => yukshin === "편관" || yukshin === "정관")
        .map(([gan]) => gan)
        .join(" ")
    }
  ]
</td>



      </tr>
  <tr>
  <td style="padding:3px;background:#e6f0ff;">왕쇠강약</td>
<td style="padding:3px;">${ganStrengthResults[hourGanHan]?.score.toFixed(1) || "-"}</td>
<td style="padding:3px;"><span style="color:blue;">${ganStrengthResults[dayGanHan]?.score.toFixed(1) || "-"}</span></td>
<td style="padding:3px;">${ganStrengthResults[monthGanHan]?.score.toFixed(1) || "-"}</td>
<td style="padding:3px;">${ganStrengthResults[yearGanHan]?.score.toFixed(1) || "-"}</td>

    <!-- ✅ 편관 강약 -->
<td style="padding:3px;">${ilganTotal.toFixed(1)}</td>
<td style="padding:3px;">${gwanTotal.toFixed(1)}</td>

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



export function getGyeokGrade(
  saju,
  gyeokName,
  tenGodMap,
  ganStrengthResults,
  secondaryGyeokName = "",
  secondaryGyeokResult = null   // ✅ 보조격 결과 객체도 추가
) {

  // ---------------------
  // 0. 사주 기본 데이터 추출
  // ---------------------
  const { yearGan, monthGan, dayGan, hourGan,
          yearBranch, monthBranch, dayBranch, hourBranch } = saju;

  // 1) 천간 리스트 (일간 제외)
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

  // 3) 지지 속 천간 (중기 제거한 버전 사용)
  const jijiGanlists = branches.flatMap(branch =>
    (jijiToSibganMap3[branch] || []).filter(Boolean)
  );

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
  const { sangsin, gusin, gisin1, gisin2, gyeokname2: baseYukshin } = GYEOK_YUKSHIN_MAP[gyeokName] || {};


  const sangsinPos = findYukshinPosition(sangsin);
  const gusinPos   = findYukshinPosition(gusin);
  const gisin1Pos  = findYukshinPosition(gisin1);
  const gisin2Pos  = findYukshinPosition(gisin2);

  // ---------------------
  // 합신 보조함수
  // ---------------------
  function checkHapshinForGan(chunganList, targetGan) {
    if (!targetGan) return false;
    const pair = 간합MAP[targetGan];
    return pair && chunganList.includes(pair);
  }

  // ---------------------
  // 1. 격 점수
  // ---------------------
let gyeokScore = 0;

// 상신 점수
if (sangsinPos === "천간") {
  gyeokScore += 50;
  console.log(`💡 상신(${sangsin}) 천간 위치 → +50`);
} else {
  console.log(`💡 상신(${sangsin}) 위치 = ${sangsinPos || "없음"} → 점수 없음`);
}

// 구신 점수
if (gusinPos === "천간") {
  gyeokScore += 30;
  console.log(`💡 구신(${gusin}) 천간 위치 → +30`);
} else {
  console.log(`💡 구신(${gusin}) 위치 = ${gusinPos || "없음"} → 점수 없음`);
}

// 격의 기본 육신
if (baseYukshin && chunganList.some(gan => getYukshin(ilgan, gan) === baseYukshin)) {
  gyeokScore += 50;
  console.log(`💡 격 기본 육신(${baseYukshin}) 천간에 존재 → +50`);
} else {
  console.log(`💡 격 기본 육신(${baseYukshin}) → 점수 없음`);
}

// 합신
let hapApplied = false;
for (let gan of [sangsin, gusin, baseYukshin]) {
  if (!gan || hapApplied) continue;
  if (checkHapshinForGan(chunganList, gan)) {
    gyeokScore += 20;
    hapApplied = true;
    console.log(`💡 합신 성립 (${gan}) → +20`);
  }
}

// 상신 + 기신1
if (gisin1Pos === "천간") {
  if (sangsinPos === "천간") {
    gyeokScore += 20;
    console.log(`💡 상신+기신1(${gisin1}) 함께 천간 → +20`);
    if (checkHapshinForGan(chunganList, gisin1)) {
      gyeokScore += 10;
      console.log(`💡 기신1(${gisin1}) 합신 → +10`);
    }
  } else {
    gyeokScore -= 20;
    console.log(`⚠️ 기신1(${gisin1}) 천간 but 상신 없음 → -20`);
    if (checkHapshinForGan(chunganList, gisin1)) {
      gyeokScore -= 10;
      console.log(`⚠️ 기신1(${gisin1}) 합신 but 상신 없음 → -10`);
    }
  }
}

// 구신 + 기신2
if (gisin2Pos === "천간") {
  if (gusinPos === "천간") {
    gyeokScore += 20;
    console.log(`💡 구신+기신2(${gisin2}) 함께 천간 → +20`);
    if (checkHapshinForGan(chunganList, gisin2)) {
      gyeokScore += 10;
      console.log(`💡 기신2(${gisin2}) 합신 → +10`);
    }
  } else {
    gyeokScore -= 20;
    console.log(`⚠️ 기신2(${gisin2}) 천간 but 구신 없음 → -20`);
    if (checkHapshinForGan(chunganList, gisin2)) {
      gyeokScore -= 10;
      console.log(`⚠️ 기신2(${gisin2}) 합신 but 구신 없음 → -10`);
    }
  }
}

// 상신 + 구신 같이 있으면
if (sangsinPos === "천간" && gusinPos === "천간") {
  gyeokScore += 20;
  console.log(`💡 상신+구신 동시 천간 존재 → +20`);
}

console.log("▶ 격 점수 최종 합계:", gyeokScore);







  // ---------------------
// 2. 강약 점수 (격의 강도)
// ---------------------
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

// ✅ 디버깅 로그 추가
console.log("📌 rawMainName:", rawMainName, "➡ normalizedMainName:", normalizedMainName);
console.log("📌 rawSecondaryName:", rawSecondaryName, "➡ normalizedSecondaryName:", normalizedSecondaryName);


let strengthScore = 0;
console.log("📌 ganStrengthResults keys:", Object.keys(ganStrengthResults || {}));
console.log("📌 찾으려는 key:", normalizedMainName, normalizedSecondaryName);

// 주격 강도 불러오기
// 주격 강도 불러오기


// 주격 강도 점수 가져오기
if (ganStrengthResults[normalizedMainName]) {
  strengthScore = ganStrengthResults[normalizedMainName].score || 0;  // ✅ score만
  console.log(`💪 ${normalizedMainName} 강도 점수 = ${strengthScore}`);
}
// 보조격 강도 점수 가져오기
else if (ganStrengthResults[normalizedSecondaryName]) {
  strengthScore = ganStrengthResults[normalizedSecondaryName].score || 0;  // ✅ score만
  console.log(`💪 ${normalizedSecondaryName} 강도 점수 = ${strengthScore}`);
}


console.log("📌 강도 저장:", normalizedMainName, strengthScore);
console.log("📌 현재 ganStrengthResults:", ganStrengthResults);

  // ---------------------
  // 3. 최종 합계
  // ---------------------
// 격 점수 → 백분율 환산
const normalizedGyeok = (gyeokScore / 110) * 100;
console.log(`📌 원본 격 점수: ${gyeokScore}, 정규화 후: ${normalizedGyeok.toFixed(2)}`);

// 강도 점수 그대로
const normalizedStrength = strengthScore;
console.log(`📌 강도 점수: ${normalizedStrength}`);

// 두 값 평균
const finalScore = Math.round((normalizedGyeok + normalizedStrength) / 2);
console.log(`📌 최종 점수 계산식: ( ${normalizedGyeok.toFixed(2)} + ${normalizedStrength} ) / 2 = ${finalScore}`);

return { final: `${finalScore}점`, score: finalScore };

}
