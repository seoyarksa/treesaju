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
         isYangStem
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
  const yukshin = tenGodMap[dayGanHanja]?.[gyeokGanHanja];
  if (!yukshin) return `판별불가(육신불가:${gyeokGanHanja})`;

  const key = yukshinToKey[yukshin];
  if (!key) return `판별불가(미정의:${yukshin})(${gyeokGanHanja})`;

  return `${GYEOKGUK_TYPES[key]}(${gyeokGanHanja})`;
}

// 2. 예시: 격국 판별 함수 (조건은 샘플이므로 나중에 사주 구조에 맞게 수정 필요)

export function hasSamhap(monthJi) {
  return samhapGroups.some(group => group.includes(monthJi));
}

export function getGyeokForMonth({ monthJi, saryeong, chunganList, dayGan, daeyunAge, daYunDirection }) {
  const jijiSibgans = jijiToSibganMap2[monthJi];
  if (!jijiSibgans || jijiSibgans.length === 0) return null;

  // ✅ 0. 건록격 / 양인격 판단
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

  // ✅ 1. 인신사해월
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
      return { char: getGyeokName(second), stem: second };
    }
    return { char: getGyeokName(third), stem: third };
  }

  // ✅ 2. 자오묘유월
  if (['子', '午', '卯', '酉'].includes(monthJi)) {
    const filtered = jijiSibgans.filter(g => chunganList.includes(g));
    if (filtered.length === 1) return { char: getGyeokName(filtered[0]), stem: filtered[0] };
    if (filtered.length > 1) return { char: getGyeokName(saryeong), stem: saryeong };
    const last = jijiSibgans[jijiSibgans.length - 1];
    return { char: getGyeokName(last), stem: last };
  }

  // ✅ 3. 진술축미월
 if (['辰', '戌', '丑', '未'].includes(monthJi)) {
  const hasSamhapValue = hasSamhap(monthJi);
  const stems = jijiToSibganMap2[monthJi]; // [앞, 중간, 뒤]
  const [first, mid, last] = stems;

  if (hasSamhapValue) {
    const midElement = elementMap[mid];
    const hasInChungan = chunganList.some(g => elementMap[g] === midElement);
    const finalStem = hasInChungan ? chunganList.find(g => elementMap[g] === midElement) : mid;
    return { char: getGyeokName(dayGan, finalStem), stem: finalStem };
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
    // 세 번째 지장간인 경우 특례 규칙 적용
    if (isSecondHalf && last) {
      const firstElement = elementMap[first];
      const firstInChungan = chunganList.some(g => elementMap[g] === firstElement);

      if (firstInChungan) {
        return { char: getGyeokName(dayGan, first), stem: first };
      } else {
        return { char: getGyeokName(dayGan, last), stem: last };
      }
    } else {
      return { char: getGyeokName(dayGan, candidateStem), stem: candidateStem };
    }
  }

  return { char: '판별불가', stem: null };
}


  return { char: '판별불가', wrap: false };
}

