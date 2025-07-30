// gyeokUtils.js


import { stemOrder, 
         branchOrder,
         elementMap,
         saryeongMap,
         DANGRYEONGSHIK_MAP,
         yukshinToKey,
         jijiToSibganMap2,
         gyeokjijiToSibganMap,
         firstHeesinMap, 
         tenGodMap,
         GYEOKGUK_TYPES,
         samhapGroups,
         isYangStem,
         GYEOK_USE_GU_MAP,
         GYEOK_RELATIONS,
         길신격_목록,
         흉신격_목록,
         YUKSHIN_COUNTERS
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






// 1. 격국 종류 상수 정의 
// 천간한글 → 한자
export function getYukshin(dayGan, targetGan) {
  const result = tenGodMap[dayGan]?.[targetGan];
  return result ? result + '격' : '판별불가';
}
// 격국 이름 반환 함수
export function getGyeokName(dayGanHanja, gyeokGanHanja) {
  console.log(`dayGanHanja: ${dayGanHanja}, gyeokGanHanja: ${gyeokGanHanja}`);
  console.log('tenGodMap[dayGanHanja]:', tenGodMap[dayGanHanja]);
  console.log('tenGodMap[dayGanHanja][gyeokGanHanja]:', tenGodMap[dayGanHanja]?.[gyeokGanHanja]);

  let yukshin = tenGodMap[dayGanHanja]?.[gyeokGanHanja];
    console.log('yukshin (육신):', yukshin, `(${typeof yukshin})`);
  console.log('yukshinToKey keys:', Object.keys(yukshinToKey));
  console.log('yukshinToKey[yukshin]:', yukshinToKey[yukshin]);
  if (!yukshin) return `판별불가(육신불가:${gyeokGanHanja})`;

  // 배열일 경우 첫번째 요소로 사용
  if (Array.isArray(yukshin)) {
    yukshin = yukshin[0];
  }

  const key = yukshinToKey[yukshin];
  if (!key) return `판별불가(미정의:${yukshin})(${gyeokGanHanja})`;

  return `${GYEOKGUK_TYPES[key]}(${gyeokGanHanja})`;
}


// 격국 판별 함수 (조건은 샘플이므로 나중에 사주 구조에 맞게 수정 필요)

export function hasSamhap(monthJi) {
  return samhapGroups.some(group => group.includes(monthJi));
}

export function getGyeokForMonth({ monthJi, saryeong, chunganList, dayGan, daeyunAge, daYunDirection }) {
  const jijiSibgans = jijiToSibganMap2[monthJi];
  if (!jijiSibgans || jijiSibgans.length === 0) return null;

  // 0. 건록격 / 양인격 판단
  if (!['戊', '己'].includes(dayGan)) { // 무기토 제외
    const lastStem = jijiSibgans[jijiSibgans.length - 1];

    if (lastStem === dayGan) {
      const dayIsYang = isYangStem(dayGan);
      const lastIsYang = isYangStem(lastStem);

      if (dayIsYang === lastIsYang) {
        return { char: GYEOKGUK_TYPES.BIGYEON, stem: lastStem, wrap: false };
      } else {
        return { char: GYEOKGUK_TYPES.GEOBJAE, stem: lastStem, wrap: false };
      }
    }
  }

  // 1. 인신사해월
  if (['寅', '申', '巳', '亥'].includes(monthJi)) {
    const third = jijiSibgans[2] || jijiSibgans[jijiSibgans.length - 1];
    const second = jijiSibgans[1];
    const hasSamhapValue = hasSamhap(monthJi);
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

  // 2. 자오묘유월
  if (['子', '午', '卯', '酉'].includes(monthJi)) {
    const filtered = jijiSibgans.filter(g => chunganList.includes(g));
    if (filtered.length === 1) {
      const gyeokChar = getGyeokName(dayGan, filtered[0]);
      return { char: gyeokChar, stem: filtered[0] };
    }
    if (filtered.length > 1) {
      const gyeokChar = getGyeokName(dayGan, saryeong);
      return { char: gyeokChar, stem: saryeong };
    }
    const last = jijiSibgans[jijiSibgans.length - 1];
    const gyeokChar = getGyeokName(dayGan, last);
    return { char: gyeokChar, stem: last };
  }

  // 3. 진술축미월
  if (['辰', '戌', '丑', '未'].includes(monthJi)) {
    const hasSamhapValue = hasSamhap(monthJi);
    const stems = jijiToSibganMap2[monthJi]; // [앞, 중간, 뒤]
    const [first, mid, last] = stems;

    if (hasSamhapValue) {
      const midElement = elementMap[mid];
      const hasInChungan = chunganList.some(g => elementMap[g] === midElement);
      const finalStem = hasInChungan ? chunganList.find(g => elementMap[g] === midElement) : mid;
      const gyeokChar = getGyeokName(dayGan, finalStem);
      return { char: gyeokChar, stem: finalStem };
    }

    // 삼합 없음 → 대운수 기준으로 전/후반 판정
    const value = daeyunAge * 3;
    const isSecondHalf =
      (daYunDirection === -1 && value >= 4) ||
      (daYunDirection === 1 && value < 4);

    const candidateStem = isSecondHalf ? last : first;
    const candidateElement = elementMap[candidateStem];

    const matchingChungans = chunganList.filter(
      g => elementMap[g] === candidateElement
    );

    if (matchingChungans.length >= 1) {
      if (isSecondHalf && last) {
        const firstElement = elementMap[first];
        const firstInChungan = chunganList.some(g => elementMap[g] === firstElement);

        if (firstInChungan) {
          const gyeokChar = getGyeokName(dayGan, first);
          return { char: gyeokChar, stem: first };
        } else {
          const gyeokChar = getGyeokName(dayGan, last);
          return { char: gyeokChar, stem: last };
        }
      } else {
        const gyeokChar = getGyeokName(dayGan, candidateStem);
        return { char: gyeokChar, stem: candidateStem };
      }
    }

    return { char: '판별불가', stem: null };
  }

  return { char: '판별불가', wrap: false };
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
  const { yearGan, monthGan, dayGan, hourGan, yearBranch, monthBranch, dayBranch, hourBranch } = saju;

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
  const gyeokjijiHiddenStems = jijiList.map(branch => gyeokjijiToSibganMap[branch] || []);

  const stemsFromSky = cheongans.map(stem => `${stem}(天)`);
  const stemsFromEarth = gyeokjijiHiddenStems.flat().map(stem => `${stem}(地)`);

  const taggedStems = [];

  console.log('🔹 천간 기반(天):', stemsFromSky);
  console.log('🔹 지지 기반(地):', stemsFromEarth);

  cheongans.forEach(stem => {
    taggedStems.push({ stem, tag: '天' });
  });

  gyeokjijiHiddenStems.forEach(hiddenGroup => {
    hiddenGroup.forEach(stem => {
      taggedStems.push({ stem, tag: '地' });
    });
  });

  console.log('🔹 태그된 간지:', taggedStems);
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

  console.log('🔹 육신 이름 지정된 간지 목록:', namedStems);
  return namedStems;
}
// 3. 격국에 따라 상신/구신/기신1/기신2/합신 찾기
export function analyzeGyeokRelations(gyeok, dayGan, saju) {
    const gyeokNameRaw = gyeok.char || '';
  const gyeokName = gyeokNameRaw.replace(/\(.*\)/, '').trim();

  const isGoodGyeok = 길신격_목록.includes(gyeokName);
  const isBadGyeok = 흉신격_목록.includes(gyeokName);

  if (!isGoodGyeok && !isBadGyeok) {
    console.warn('알 수 없는 격국:', gyeokName);
    return null;
  }

  const tagged = extractTaggedStems(saju);
  const yukshinList = nameYukshinFromStems(tagged, dayGan);

  const rel = GYEOK_RELATIONS[gyeokName];
  if (!rel) return null;

  const useChar = rel.use.char;
  const seekChar = rel.seek.char;
  console.log('🔍 useChar:', useChar, 'seekChar:', seekChar);
  console.log('🔍 yukshinList 육신 이름들:', yukshinList.map(i => i.yukshin));

  let sangsin, gusin, gisin1, gisin2;

  // 격국 이름 기준 음양 비교 필터 (격국 이름 → 천간으로 변환)
const gyeokStem = gyeok.stem;
const sameYinYangFilter = (item) => sameYinYang(item.stem, gyeokStem);



sangsin = yukshinList.find(item => item.yukshin === useChar);
gusin = yukshinList.find(item => item.yukshin === seekChar);


if (isGoodGyeok) {
gisin1 = yukshinList.find((item) => {
  const cond1 = (item.yukshin !== useChar && item.yukshin !== seekChar);
  const cond2 = sangsin?.yukshin != null;
  const cond3 = isCountering(item.yukshin, sangsin.yukshin);
  const result = cond1 && cond2 && cond3;
  console.log('기신1 조건:', { itemYukshin: item.yukshin, sangsin: sangsin?.yukshin, cond1, cond2, cond3, result });
  return result;
});

  console.log('🔹 기신1(gisin1):', gisin1);

  gisin2 = yukshinList.find(
    (item) =>
      item.yukshin !== useChar &&
      item.yukshin !== seekChar &&
      item.yukshin !== gisin1?.yukshin &&
      isCountering(item.yukshin, gyeokName)
  );
  console.log('🔹 기신2(gisin2):', gisin2);
}

if (isBadGyeok) {
  gisin1 = yukshinList.find((item) => {
    const cond1 = (item.yukshin !== useChar && item.yukshin !== seekChar);
    const cond2 = sangsin?.yukshin != null;
    const cond3 = isCountering(item.yukshin, sangsin.yukshin); // 상신을 극하는 기신1
    const result = cond1 && cond2 && cond3;
    console.log('기신1 조건 (흉신):', { itemYukshin: item.yukshin, sangsin: sangsin?.yukshin, cond1, cond2, cond3, result });
    return result;
  });
  console.log('🔹 기신1(gisin1) 흉신격:', gisin1);

  gisin2 = yukshinList.find((item) => {
    const cond1 = (item.yukshin !== useChar && item.yukshin !== seekChar && item.yukshin !== gisin1?.yukshin);
    const cond2 = gusin?.yukshin != null;
    const cond3 = isCountering(item.yukshin, gusin.yukshin); // 구신을 극하는 기신2
    const result = cond1 && cond2 && cond3;
    console.log('기신2 조건 (흉신):', { itemYukshin: item.yukshin, gusin: gusin?.yukshin, cond1, cond2, cond3, result });
    return result;
  });
  console.log('🔹 기신2(gisin2) 흉신격:', gisin2);

}

  return {
    gyeok: { char: gyeokName, dayGan },
    sangsin,
    gusin,
    gisin1,
    gisin2,
    all: yukshinList,
  };
}


// 4. 시각화 도식
export function renderGyeokFlowStyled(gyeok, saju) {
  if (!gyeok || !saju) return '정보 없음';

  const gyeokNameRaw = gyeok.char || '';
  const gyeokName = gyeokNameRaw.replace(/\(.*\)/, '').trim();
  const stem = gyeok.stem || '';

  const { dayGan } = saju;
  const dayGanHan = convertKorToHanStem(dayGan);

  const analysis = analyzeGyeokRelations(gyeok, dayGanHan, saju);
  if (!analysis) return '필수 정보 부족';

    const { sangsin, gusin, gisin1, gisin2 } = analysis;
const gisin1Label = analysis.gisin1?.label || '';
const gisin2Label = analysis.gisin2?.label || '';
const sangsinLabel = analysis.sangsin?.label || '';
const gusinLabel = analysis.gusin?.label || '';
  if (!sangsin) return '상신 정보 없음';

  const useStem = getStemForYukshin(dayGanHan, sangsin.yukshin);
  const seekStem = gusin ? getStemForYukshin(dayGanHan, gusin.yukshin) : '?';

  const rel = GYEOK_RELATIONS[gyeokName];
  if (!rel) return '격국 관계 정보 없음';

  const relation = rel.use.relation;
  const { use, seek } = rel;

  const gisin1Stem = gisin1 ? gisin1.stem : '';
  const gisin2Stem = gisin2 ? gisin2.stem : '';

if (relation === '생') {
  return `
    <div style="display: grid; grid-template-columns: auto 30px auto 30px auto; grid-template-rows: repeat(8, auto); justify-content: center; align-items: center; font-family: monospace; font-size: 0.9rem; gap: 4px;">
      <div style="grid-column: 1 / 2; grid-row: 1;">
        <span style="color: red;">기신1</span><span>(${gisin1Label})</span>
      </div>
      <div style="grid-column: 1 / 2; grid-row: 4;">
        <span style="color: red;">↓</span>
      </div>
      <div style="grid-column: 1 / 2; grid-row: 5;">
        <strong><span style="color: blue;">상신</span></strong><span>(${sangsinLabel})</span>
      </div>
      <div style="grid-column: 2 / 3; grid-row: 5;">
        <span style="color: blue;">→</span>
      </div>
      <div style="grid-column: 3 / 4; grid-row: 5;"><strong>${gyeokName}[${stem}]</strong></div>
      <div style="grid-column: 4 / 5; grid-row: 5;">
        <span style="color: blue;">→</span>
      </div>
      <div style="grid-column: 5 / 6; grid-row: 5;">
        <strong><span style="color: green;">구신</span></strong><span>(${gusinLabel})</span>
      </div>
      <div style="grid-column: 3 / 4; grid-row: 6;">
        <span style="color: red;">↑</span>
      </div>
      <div style="grid-column: 3 / 4; grid-row: 8;">
        <span style="color: red;">기신2</span><span>(${gisin2Label})</span>
      </div>
    </div>
  `;
}

if (relation === '극') {
  return `
    <div style="display: grid; grid-template-columns: auto 30px auto 30px auto; grid-template-rows: repeat(6, auto); justify-content: center; align-items: center; font-family: monospace; font-size: 0.9rem; gap: 4px;">
      <div style="grid-column: 1 / 2; grid-row: 2;">
        <span style="color: red;">기신1</span><span>(${gisin1Label})</span>
      </div>
      <div style="grid-column: 2 / 3; grid-row: 2;">
        <span style="color: red;">--→</span>
      </div>
      <div style="grid-column: 3 / 4; grid-row: 2;">
        <strong><span style="color: blue;">상신</span></strong><span>(${sangsinLabel})</span>
      </div>
      <div style="grid-column: 4 / 5; grid-row: 2;">
        <span style="color: blue;">→</span>
      </div>
      <div style="grid-column: 5 / 6; grid-row: 2;">
        <strong><span style="color: green;">구신</span></strong><span>(${gusinLabel})</span>
      </div>
      <div style="grid-column: 3 / 4; grid-row: 3;">
        <span style="color: red;">│</span>
      </div>
      <div style="grid-column: 3 / 4; grid-row: 4;">
        <span style="color: red;">↓</span>
      </div>
      <div style="grid-column: 3 / 4; grid-row: 5;"><strong>${gyeokName}[${stem}]</strong></div>
      <div style="grid-column: 5 / 6; grid-row: 3;">
        <span style="color: red;">↑</span>
      </div>
      <div style="grid-column: 5 / 6; grid-row: 4;">
        <span style="color: red;">│</span>
      </div>
      <div style="grid-column: 5 / 6; grid-row: 5;">
        <span style="color: red;">기신2</span><span>(${gisin2Label})</span>
      </div>
    </div>
  `;
}



  return `[${gyeokName}(${stem})]`;
}


