// gyeokUtils.js


import { stemOrder, 
         branchOrder,
         elementMap,
         saryeongMap,
         DANGRYEONGSHIK_MAP,
         yukshinToKey,
         jijiToSibganMap2,
         firstHeesinMap, 
         tenGodMap,
         GYEOKGUK_TYPES,
         samhapGroups,
         isYangStem,
         GYEOK_USE_GU_MAP,
         GYEOK_RELATIONS
        } from './constants.js';

import { hanToKorStem
        } from './sajuUtils.js';


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
export function getUseGuByGyeok(gyeokChar) {
  return GYEOK_USE_GU_MAP[gyeokChar] || { use: '없음', seek: '없음' };
}


export function renderGyeokFlow(gyeok) {
  if (!gyeok || !gyeok.char || !gyeok.stem) return '격국 정보 없음';

  const relationInfo = GYEOK_RELATIONS[gyeok.char];
  if (!relationInfo) return `[${gyeok.char}(${gyeok.stem})]`;

  const { use, seek } = relationInfo;

  return `${use.char}(${use.relation}) → [${gyeok.char}(${gyeok.stem})] → ${seek.char}(${seek.relation})`;
}

export function renderGyeokFlowStyled(gyeok, useStem, seekStem) {
  if (!gyeok || !gyeok.char || !gyeok.stem) return '격국 정보 없음';

  const charRaw = gyeok.char;
  const char = gyeok.char.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const stem = gyeok.stem;
  const relationInfo = GYEOK_RELATIONS[char];

  console.log("정제된 char =", char);
  console.log("GYEOK_RELATIONS[char] =", relationInfo);
  if (!relationInfo) return `[${charRaw}(${stem})]`;

  const { use, seek } = relationInfo;
  const relation = use.relation?.trim();
// ✅ 길신격 도식 (상신이 격을 생함)
if (relation === '생') {
  return `
    <div style="
      display: grid;
      grid-template-columns: auto 30px auto 30px auto;
      grid-template-rows: auto auto auto auto auto auto auto auto;
      justify-content: center;
      align-items: center;
      font-family: monospace;
      font-size: 0.9rem;
      gap: 4px;
    ">

      <!-- 기신1(甲) -->
      <div style="grid-column: 1 / 2; grid-row: 1; color: red;">기신1(甲)</div>
      <div style="grid-column: 1 / 2; grid-row: 4;">↓</div>

      <!-- 상신 -->
      <div style="grid-column: 1 / 2; grid-row: 5; color: blue;"><strong>상신(${use.char})</strong></div>

      <!-- 상신 → 격 -->
      <div style="grid-column: 2 / 3; grid-row: 5;">→</div>

      <!-- 격 -->
      <div style="grid-column: 3 / 4; grid-row: 5;"><strong>${char}[${stem}]</strong></div>

      <!-- 격 → 구신 -->
      <div style="grid-column: 4 / 5; grid-row: 5;">→</div>

      <!-- 구신 -->
      <div style="grid-column: 5 / 6; grid-row: 5; color: green;"><strong>구신(${seek.char})</strong></div>

      <!-- 기신2(丙) -->
      <div style="grid-column: 3 / 4; grid-row: 6;">↑</div>
      <div style="grid-column: 3 / 4; grid-row: 8; color: red;">기신2(丙)</div>

    </div>
  `;
}

// ✅ 흉신격 도식 (상신이 격을 극함)
if (relation === '극') {
  return `
    <div style="
      display: grid;
      grid-template-columns: auto 30px auto 30px auto;
      grid-template-rows: auto auto auto auto auto auto;
      justify-content: center;
      align-items: center;
      font-family: monospace;
      font-size: 0.9rem;
      gap: 4px;
    ">

      <!-- 기신1(壬) -->
      <div style="grid-column: 1 / 2; grid-row: 2; color: red;">기신1(壬)</div>
      <div style="grid-column: 2 / 3; grid-row: 2;">→</div>

      <!-- 상신 -->
      <div style="grid-column: 3 / 4; grid-row: 2; color: blue;"><strong>상신(${use.char})</strong></div>

      <!-- 상신 → 구신 -->
      <div style="grid-column: 4 / 5; grid-row: 2;">→</div>
      <div style="grid-column: 5 / 6; grid-row: 2; color: green;"><strong>구신(${seek.char})</strong></div>

      <!-- 상신 ↓ 격 -->
      <div style="grid-column: 3 / 4; grid-row: 3;">│</div>
      <div style="grid-column: 3 / 4; grid-row: 4;">↓</div>

      <!-- 격 -->
      <div style="grid-column: 3 / 4; grid-row: 5;"><strong>${char}[${stem}]</strong></div>

      <!-- 기신2(甲) -->
      <div style="grid-column: 5 / 6; grid-row: 3;">↑</div>
      <div style="grid-column: 5 / 6; grid-row: 4;">│</div>
      <div style="grid-column: 5 / 6; grid-row: 5; color: red;">기신2(甲)</div>

    </div>
  `;
}


  // 기타 예외
  return `[${charRaw}(${stem})]`;
}





