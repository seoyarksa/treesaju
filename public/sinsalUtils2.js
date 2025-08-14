// sinsalUtils.js

import { samhapGroups, UNSEONG_LIST, unseongMap12, sinsal_LIST, sinsalMap12,
         cheonEulMap, BAEKHO_SAL_GANJI_MAP,형충회합Map,원진육해Map,간여지동Map,효신살Map,소실살Map,재고귀인Map,
         홍염Map, 도화살MAP,귀문살MAP, 낙정관살Map,격각살MAP,합방_공방살MAP,
         GWAIGANG_SAL_GANJI, 건록_암록_금여록MAP,천덕_월덕MAP,

       } from './constants.js';




///////////기타 신살류 명칭 등록//////////////////
const etcSinsalList = ['형충회합', '원진/육해','간여지동', '효신살', '소실살','백호살',  '천을귀인', '재고귀인',
                      '도화살','홍염살', '귀문살', '격각살', '낙정관살', '합방/공방살', 
                      '공망살',  '건록/암록/금여록', '천덕/월덕', '괴강살','문창귀인', '학당귀인', '급각살', '상문살', '조객살','암록살','비인살',
                      '천의성', '음양차착살', '고란살', '태극귀인', '천라지망', '병부살', '사부살','현침살', '십악대패살', '단교관살'
                      ];
//////////////////////////////////////////////////////////////////////////////////////////////
 //'천덕귀인', '월덕귀인', '문창귀인', '학당귀인', '급각살', '상문살', '조객살','암록살','비인살',
//     '천의성', '음양차착살', '고란살', '태극귀인', '천라지망', '병부살', '사부살','현침살', '십악대패살', '단교관살'
//////
// ////////////////////////////////////////////////////////////////////////////////////////
// 신살 표시 구역 타입 분류
const GAN_SINSAL   = new Set(['천을귀인', '홍염살', '낙정관살', '건록/암록/금여록' ]);    // 필요 시 추가
const JIJI_SINSAL  = new Set(['형충회합', '원진/육해', '도화살', '귀문살', '격각살','합방/공방살','천덕/월덕']); // 필요 시 추가
const GANJI_SINSAL = new Set(['간여지동', '백호살', '괴강살', '효신살', '소실살', '재고귀인','공망살']);                         // 필요 시 추가

function getSinsalType(name) {
  if (name === '천덕/월덕')    return 'mixed'; // ← 이 줄이 반드시 위 조건들보다 먼저 실행되게
  if (GAN_SINSAL.has(name))   return 'gan';
  if (JIJI_SINSAL.has(name))  return 'jiji';
  if (GANJI_SINSAL.has(name)) return 'ganji';
 
}

// saju: { dayGan, yearBranch, monthBranch, dayBranch, hourBranch }
// samhapKey: getSamhapKeyByJiji(saju.yearBranch) 등에서 추출

export function renderSinsalTable({ sajuGanArr, samhapKey, sajuJijiArr }) {
  const ganList = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const samhapNames = ['申子辰', '亥卯未', '寅午戌', '巳酉丑'];
  const jijiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const sajuGanjiArr = sajuGanArr.map((gan, idx) => gan + sajuJijiArr[idx]);

  // ✅ 추가: 같은 지지 '열' 인덱스 계산(첫 칸이 <th>라서 +2 사용)
  const norm = v => (v ?? '').toString().trim();
  const highlightIdx = new Set(
    (sajuJijiArr || []).map(norm).map(v => jijiArr.indexOf(v)).filter(i => i >= 0)
  );
// ...
// 해당 열 인덱스에 대한 CSS
const colCss = [...highlightIdx].map(i => `
  /* 지지, 12운성, 12신살 모두 같은 열 칠하기 */
  #sinsal-box table.sinsal-bottom tr#jiji-row     td:nth-child(${i + 2}),
  #sinsal-box table.sinsal-bottom tr#unseong-row td:nth-child(${i + 2}),
  #sinsal-box table.sinsal-bottom tr#sinsal-row  td:nth-child(${i + 2}) {
    background:rgb(240, 204, 245) !important;
    box-shadow: inset 0 0 0 9999px rgba(248, 245, 248, 0.18);
  }
`).join('');
// ...


  // 1. 상단 헤더
  const headerRows = `
    <tr>
      <th colspan="10">12운성</th>
      <th colspan="4">12신살</th>
    </tr>
    <tr>
      ${ganList.map(gan =>
        `<td class="clickable${sajuGanArr.includes(gan) ? ' saju-blue' : ''}" data-type="unseong" data-gan="${gan}" style="cursor:pointer;">${gan}</td>`
      ).join('')}
      ${samhapNames.map(key =>
        `<td class="clickable${key === samhapKey ? ' saju-blue' : ''}" data-type="sinsal" data-samhap="${key}" style="cursor:pointer;">${key}</td>`
      ).join('')}
    </tr>
  `;

  // 2. 아래쪽 12지지
const jijiRow = `<tr id="jiji-row">
  <th>지지</th>
  ${jijiArr.map(jj =>
    `<td class="jiji-clickable${(sajuJijiArr || []).map(norm).includes(jj) ? ' saju-blue' : ''}" data-jiji="${jj}" style="cursor:pointer;">${jj}</td>`
  ).join('')}
</tr>`;

  // 운성/신살 행은 동적 갱신이므로, 클래스 없이 빈칸으로!
 const unseongRow = `<tr id="unseong-row"><th>12운성</th>${jijiArr.map(() => `<td></td>`).join('')}</tr>`;
const sinsalRow  = `<tr id="sinsal-row"><th>12신살</th>${jijiArr.map(() => `<td></td>`).join('')}</tr>`;

  const guide = `
    <tr>
      <td colspan="13" style="font-size:13px; text-align:left; padding:5px;">
        해당<span style="color:orange;">천간,삼합</span>을 클릭 or 아래 <span style="color:orange;">지지</span> 클릭시 해당 12운성[신살]을 확인가능[
        <span style="color:red;">戊,己</span>는 제외, <span style="color:blue;">파란색 간지</span>는 내 사주팔자의 간지]
      </td>
    </tr>
  `;

  const centerStyle = `
    <style>
      #sinsal-box table, #sinsal-box th, #sinsal-box td {
        text-align: center !important;
        vertical-align: middle !important;
      }
      .saju-blue {
        color: #1976d2 !important;
        font-weight: bold;
        text-shadow: 0 1px 0 #e6f3ff;
      }
            /* ✅ 녹색 표시 스타일 */
    .green-mark {
     /* background-color: #d4f5d4 !important;  은은한 녹색 배경 */
      color: #0b5e0b !important;            /* 진한 녹색 글씨 */
      font-weight: bold;
    }


      ${colCss} /* 🔸 동적으로 생성된 열 강조 CSS */
    </style>
  `;

  return `
    ${centerStyle}
    <table border="1" style="border-collapse:collapse; margin:auto; font-size:15px;">
      <tbody>
        ${headerRows}
      </tbody>
    </table>
    <!-- 🔸 아래 표에만 식별 클래스(sinsal-bottom) 추가 -->
    <table class="sinsal-bottom" border="1" style="border-collapse:collapse; margin:auto; font-size:14px; margin-top:8px;">
      <tbody>
        ${guide}
        ${jijiRow}
        ${unseongRow}
        ${sinsalRow}
        <tr id="mini-unseong-row" style="display:none;"><td colspan="13" style="padding:6px;"></td></tr>
      </tbody>
    </table>
  `;
}


/////12운성/신살 장생,제왕, 묘....등 강조//////////////////////////////

// ✅ 녹색 대상 목록(파일 어디든 상단에 한 번만)
const GREEN = {
  unseong: ['장생', '제왕', '묘'],
  sinsal:  ['지살', '장성살', '화개살'],
};

// ✅ 단일 셀 채우기
export function setCellValue(rowId, colIndex, value) {
  const row = document.getElementById(rowId);
  if (!row) return;
  // row는 <th> + 12개 <td> 구조 → td 인덱스 보정 필요 X (NodeList가 td만 반환됨)
  const tds = row.querySelectorAll('td');
  const td = tds[colIndex];
  if (!td) return;

  // 값 세팅
  td.textContent = value ?? '';

  // 녹색 클래스 토글
  td.classList.remove('green-mark');
  if (
    (rowId === 'unseong-row' && GREEN.unseong.includes(value)) ||
    (rowId === 'sinsal-row'   && GREEN.sinsal.includes(value))
  ) {
    td.classList.add('green-mark');
  }
}

// ✅ 한 행 전체를 한 번에 채우기 (배열 길이 12 권장)
export function setRowValues(rowId, values) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const tds = row.querySelectorAll('td');
  for (let i = 0; i < tds.length; i++) {
    const v = values?.[i] ?? '';
    tds[i].textContent = v;
    tds[i].classList.remove('green-mark');
    if (
      (rowId === 'unseong-row' && GREEN.unseong.includes(v)) ||
      (rowId === 'sinsal-row'   && GREEN.sinsal.includes(v))
    ) {
      tds[i].classList.add('green-mark');
    }
  }
}



/////12운성/신살 장생,제왕, 묘....등 강조  끝//////////////////////////////




// 12운성 매칭
export function getUnseong(gan, jiji) {
  // gan: 일간(甲,乙,丙,丁,庚,辛,壬,癸)
  // jiji: 대상 지지(子~亥)
  const jijiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  // 戊, 己는 운성이 없음
  if (gan === '戊' || gan === '己') {
    return '없음';
  }
  const idx = jijiArr.indexOf(jiji);
  if (unseongMap12[gan] && idx !== -1) {
    return unseongMap12[gan][idx];
  }
  return ''; // 없는 경우 빈값
}


// 12신살 매칭
export function getSinsal(samhapKey, jiji) {
  // samhapKey: '亥卯未', '寅午戌', '巳酉丑', '申子辰' 중 하나
  // jiji: 대상 지지(子~亥)
  const jijiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const idx = jijiArr.indexOf(jiji);
  if (sinsalMap12[samhapKey] && idx !== -1) {
    return sinsalMap12[samhapKey][idx];
  }
  return '';
}

/// 삼합국으로 12신살 찾기
export function getSamhapKeyByJiji(jiji) {
  for (const group of samhapGroups) {
    if (group.includes(jiji)) {
      return group.join('');
    }
  }
  return '';
}

// 기타 신살류표
//////////////////////////////////////////////////////////////////////////////////////////////

// ////////////////////////////////////////////////////////////////////////////////////////

export function renderEtcSinsalTable({ sajuGanArr, sajuJijiArr, sajuGanjiArr, context = {} }) {
  const MONTH_INDEX = 2;
  const monthJiji = sajuJijiArr?.[MONTH_INDEX];

  // ① 폴백 맵
  const KOR_HAN_STEM   = { 갑:'甲', 을:'乙', 병:'丙', 정:'丁', 무:'戊', 기:'己', 경:'庚', 신:'辛', 임:'壬', 계:'癸' };
  const KOR_HAN_BRANCH = { 자:'子', 축:'丑', 인:'寅', 묘:'卯', 진:'辰', 사:'巳', 오:'午', 미:'未', 신:'申', 유:'酉', 술:'戌', 해:'亥' };

  const toHanStem = (v='') => {
    v = v.trim();
    if (!v) return '';
    if (/[甲乙丙丁戊己庚辛壬癸]/.test(v)) return v;
    try { const r = convertKorToHanStem?.(v); if (r) return r; } catch {}
    return KOR_HAN_STEM[v] || '';
  };
  const toHanBranch = (v='') => {
    v = v.trim();
    if (!v) return '';
    if (/[子丑寅卯辰巳午未申酉戌亥]/.test(v)) return v;
    try { const r = convertKorToHanBranch?.(v); if (r) return r; } catch {}
    return KOR_HAN_BRANCH[v] || '';
  };

  // ---------- 대운 ----------
  let dGan = (context.daeyun?.stem || '').trim();
  let dJiji = (context.daeyun?.branch || '').trim();

  if (!dGan || !dJiji) {
    if (window.daeyunPairs && Number.isInteger(window.currentDaeyunIndex)) {
      const pair = window.daeyunPairs[window.currentDaeyunIndex] || {};
      dGan  = dGan  || (pair.stem   || '');
      dJiji = dJiji || (pair.branch || '');
      console.log('[신살] 대운 from window:', window.currentDaeyunIndex, dGan, dJiji);
    } else {
      const tds = document.querySelectorAll('.daeyun-table-container .daeyun-table tbody tr:nth-child(2) td');
      const selTd = Array.from(tds).find(td => td.classList.contains('daeyun-selected'));
      if (selTd && window.daeyunPairs?.length) {
        const idx = Array.from(tds).indexOf(selTd);
        const trueIdx = tds.length - 1 - idx;
        const pair = window.daeyunPairs[trueIdx] || {};
        dGan  = dGan  || (pair.stem   || '');
        dJiji = dJiji || (pair.branch || '');
        console.log('[신살] 대운 from DOM:', { idx, trueIdx, dGan, dJiji });
      } else {
        console.warn('[신살] 대운 미확정: context/window/DOM 모두 값 없음');
      }
    }
  } else {
    console.log('[신살] 대운 from context:', dGan, dJiji);
  }

 // ---------- 세운 ----------
let sGan = (context.sewoon?.stem || '').trim();
let sJiji = (context.sewoon?.branch || '').trim();

if (!sGan || !sJiji) {
  let seSel = document.querySelector('.sewoon-cell.selected');

  if (seSel) {
    sGan  = sGan  || seSel.dataset.stem   || '';
    sJiji = sJiji || seSel.dataset.branch || '';
    console.log('[신살] 세운 stem/branch:', sGan, sJiji, 'year=', seSel?.dataset.year);
  } else {
    // 🔹 선택된 세운이 없으면 무조건 '無'
    sGan = '無';
    sJiji = '無';
    console.warn('[신살] 세운 미확정 → 無 처리');
  }
} else {
  console.log('[신살] 세운 from context:', sGan, sJiji);
}

// ---------- 한자 정규화 ----------
const dGanHan  = toHanStem(dGan);
const dJijiHan = toHanBranch(dJiji);

// 세운이 없으면 '無' 처리
const sGanHan  = sGan ? toHanStem(sGan) : '無';
const sJijiHan = sJiji ? toHanBranch(sJiji) : '無';

console.log('[신살] 대운(한자):', dGanHan, dJijiHan);
console.log('[신살] 세운(한자):', sGanHan, sJijiHan);

// ---------- 간지 조합 ----------
const dGanjiHan = (dGanHan && dJijiHan) ? dGanHan + dJijiHan : '';
const sGanjiHan = (sGan && sJiji) ? (sGanHan + sJijiHan) : '無';

console.log('[신살] 대운 간지(한자):', dGanjiHan);
console.log('[신살] 세운 간지(한자):', sGanjiHan);

// ---------- 확장 배열 ----------
const extGanArr   = [...sajuGanArr,   dGanHan,   sGanHan];
const extJijiArr  = [...sajuJijiArr,  dJijiHan,  sJijiHan];
const extGanjiArr = [...sajuGanjiArr, dGanjiHan, sGanjiHan];

console.log('[신살] 확장 GanArr  :', extGanArr);
console.log('[신살] 확장 JijiArr :', extJijiArr);
console.log('[신살] 확장 GanjiArr:', extGanjiArr);


  // ▲▲▲ ADD 끝 ▲▲▲

  const sinsalRows = etcSinsalList.map(sinsalName => {
  console.log('[천덕/월덕 type 체크]', sinsalName, getSinsalType(sinsalName));


    // ========= 1) 천간 신살 (6칸) =========///////////////////////////////////////////////////////////////////////////////////
    // 기존: 사주간 4칸만 → 변경: extGanArr(6칸) 기준으로 계산
const ganResults = extGanArr.map((gan, idx) => {
  // 천을귀인: jiji + (양/음) 표기
  if (sinsalName === '천을귀인') {
    const rels = getSinsalForGan(gan, '천을귀인') || []; // ['子'] 또는 [{ jiji, yinYang }]
    const hits = rels.filter(r => extJijiArr.includes(typeof r === 'object' ? r.jiji : r));
    if (!hits.length) return 'X';
    return hits.map(r => {
      if (typeof r === 'object') {
        const yy = r.yinYang === '+' ? '(양)' : '(음)'; // +면 양, 그 외는 음
        return r.jiji + (r.yinYang ? yy : '');
      }
      return r; // 문자열 후보면 그대로
    }).join(',');
  }

  // 홍염살: jiji만 출력
  if (sinsalName === '홍염살') {
    const rels = getSinsalForGan(gan, '홍염살') || []; // ['午'] 또는 [{ jiji, tags }]
    const hits = rels.filter(r => extJijiArr.includes(typeof r === 'object' ? r.jiji : r));
    return hits.length ? hits.map(r => (typeof r === 'object' ? r.jiji : r)).join(',') : 'X';
  }

// 건록/암록/금여록: jiji[태그] 형식 출력
if (sinsalName === '건록/암록/금여록') {
  const rels = 건록_암록_금여록MAP[gan] || []; // [{ target, tags }]
  
  // 현재 사주 전체 지지(extJijiArr)에 포함되는 타겟만 필터
  const hits = rels.filter(r => extJijiArr.includes(r.target));

  return hits.length
    ? hits.map(r => `${r.target}[${r.tags?.[0] || ''}]`).join(',')
    : 'X';
}
if (sinsalName === '천덕/월덕') {
  if (!monthJiji) return 'X';
  const rels = 천덕_월덕MAP[monthJiji] || [];
  const hit = rels.find(r => r.target === gan); // 천간만 비교
  return hit ? `${hit.target}[${hit.tags?.[0] || ''}]` : 'X';
}



  // 기본: getSinsalForGan 결과에서 현재 판에 존재하는 지지만 출력
  const rels = getSinsalForGan(gan, sinsalName) || []; // ['子'] 또는 [{ jiji, ... }]
  const hits = rels.filter(r => extJijiArr.includes(typeof r === 'object' ? r.jiji : r));
  return hits.length ? hits.map(r => (typeof r === 'object' ? r.jiji : r)).join(',') : 'X';
});


    // ========= 2) 지지 신살 (6칸) =========///////////////////////////////////////////////////////////////////////////////////
    // 기존: 사주지지 4칸만 → 변경: extJijiArr(6칸) 기준으로 계산
    const jijiResults = extJijiArr.map((jiji, idx) => {
      if (sinsalName === '형충회합') {
        const rels = 형충회합Map[monthJiji] || []; // [{target, tags}]
        // 월지 자신은 제외 (사주 4칸 중 월지 칸만 제외 의미, 대운/세운 칸은 그냥 검사)
        const isSajuMonthCell = (jiji === monthJiji);
        if (isSajuMonthCell) return 'X';
        const hit = rels.find(r => r.target === jiji);
        return hit ? `${monthJiji}${jiji}(${hit.tags?.[0] || ''})` : 'X';
      }
      if (sinsalName === '원진/육해') {
        const rels = (원진육해Map[monthJiji] || []); // [{target, tags}]
        const hit = rels.find(r => r.target === jiji);
        return hit ? `${hit.tags?.[0] || ''}` : 'X';
      }
      if (sinsalName === '도화살') {
        const label = 도화살MAP[jiji];
        return label ? `${label}` : 'X';
   }
 if (sinsalName === '귀문살') {
  const rels = 귀문살MAP[jiji] || [];
  const hit = rels.find(r => extJijiArr.includes(r.target));
  return hit ? `${jiji}[${hit.tags?.[0] || ''}]` : 'X';
}
if (sinsalName === '격각살') {
  const rels = 격각살MAP[jiji] || [];
  const hit = rels.find(r => extJijiArr.includes(r.target));
  return hit ? `${hit.target}` : 'X';
}
if (sinsalName === '합방/공방살') {
  const dayJiji = sajuJijiArr[1]; // 기준: 일지
  const gender = context.gender;

  // 일지 칸은 그냥 빈 칸으로 표시
  if (idx === 1) {

    return 'X';
}
  const rels = 합방_공방살MAP[dayJiji] || [];
  const hits = rels.filter(r => r.gender === gender && jiji === r.target);
  return hits.length
    ? `${jiji}[${hits[0].tags?.[0] || ''}]`
    : 'X';
}


if (sinsalName === '천덕/월덕') {
  if (!monthJiji) return 'X';
  const rels = 천덕_월덕MAP[monthJiji] || [];
  const hit = rels.find(r => r.target === jiji); // 지지만 비교
  return hit ? `${hit.target}[${hit.tags?.[0] || ''}]` : 'X';
}






      const candidates = getSinsalForJiji(jiji, sinsalName, { monthJiji }) || [];
      const exists = candidates.some(t => extJijiArr.includes(t));
      return exists ? candidates.filter(t => extJijiArr.includes(t)).join(',') : 'X';
    });

    // ========= 3) 간지 신살 (6칸) =========///////////////////////////////////////////////////////////////////////////////////
    // 기존: 사주간지 4칸만 → 변경: extGanjiArr(6칸) 기준으로 계산

    const ganjiResults = extGanjiArr.map(ganji => {
  if (sinsalName === '공망살') {
    const dayGan  = sajuGanArr?.[1];
    const dayJiji = sajuJijiArr?.[1];
    const r = getSinsalForGanji(ganji, '공망살', { dayGan, dayBranch: dayJiji });
    return r.length ? r[0] : 'X'; // r[0]에 "공망[辰,巳]" 같은 완성 문자열이 들어 있음
  }


      const candidates = getSinsalForGanji(ganji, sinsalName) || [];
      const stripTag = s => s.replace(/\(.*\)/, '');
      const exists = candidates.some(gj => extGanjiArr.includes(stripTag(gj)));
      return exists
        ? candidates.filter(gj => extGanjiArr.includes(stripTag(gj))).join(',')
        : 'X';
    });

    // 모두 X면 생략
const type = getSinsalType(sinsalName);

// 타입과 다른 구역은 전부 빈칸으로 마스킹 (X도 숨김)
const maskedGan   = (type === 'gan'   || type === 'mixed') ? ganResults   : ganResults.map(() => '');
const maskedJiji  = (type === 'jiji'  || type === 'mixed') ? jijiResults  : jijiResults.map(() => '');
const maskedGanji = (type === 'ganji' || (type === 'mixed' && sinsalName !== '천덕/월덕'))
                    ? ganjiResults
                    : ganjiResults.map(() => '');

// 모두 비거나 X면 행 생략 (빈칸도 생략 판정에 포함)
const allX = [...maskedGan, ...maskedJiji, ...maskedGanji].every(v => !v || v === 'X');
if (allX) return '';

    // ▼ 데이터 행도 6칸씩 맞춰 출력 (천간/지지/간지 블록)
return `
  <tr>
    <td style="text-align:center;">${sinsalName}</td>
    ${maskedGan.map(v   => `<td>${v || ''}</td>`).join('')}
    ${maskedJiji.map(v  => `<td>${v || ''}</td>`).join('')}
    ${maskedGanji.map(v => `<td>${v || ''}</td>`).join('')}
  </tr>
`;
  }).filter(Boolean).join('');

  if (!sinsalRows) {
    return `<table style="margin:auto; margin-top:10px;"><tr><td>해당 기타 신살 없음</td></tr></table>`;
  }

  // ▼ 표 렌더링: 헤더/제목/기준간지도 6칸에 맞춰 출력 (사주 4 + 대운 + 세운)
  return `
<table border="1" style="text-align:center; border-collapse:collapse; margin:auto; margin-top:16px; font-size:14px; min-width:600px;">
<tr>
  <th style="background:#efefef;" rowspan="2">신살류</th>
  <th colspan="6" style="background:#cfebfd;">천간</th>
  <th colspan="6" style="background:#efcffd;">지지</th>
  <th colspan="6" style="background:#fdebcf;">간지(동주)</th>
</tr>
<tr>
  <!-- 사주천간(6칸) -->
  <td style="background:#cfebfd;">시</td>
  <td style="background:#cfebfd;">일</td>
  <td style="background:#cfebfd;">월</td>
  <td style="background:#cfebfd;">년</td>
  <td style="background:#cfebfd;">대운</td>
  <td style="background:#cfebfd;">세운</td>

  <!-- 사주지지(6칸) -->
  <td style="background:#efcffd;">시</td>
  <td style="background:#efcffd;">일</td>
  <td style="background:#efcffd;">월</td>
  <td style="background:#efcffd;">년</td>
  <td style="background:#efcffd;">대운</td>
  <td style="background:#efcffd;">세운</td>

  <!-- 사주간지(동주)(6칸) -->
  <td style="background:#fdebcf;">시주</td>
  <td style="background:#fdebcf;">일주</td>
  <td style="background:#fdebcf;">월주</td>
  <td style="background:#fdebcf;">년주</td>
  <td style="background:#fdebcf;">대운</td>
  <td style="background:#fdebcf;">세운</td>
</tr>

<tr>
<td style="background:#efefef; color:red;">기준간지</td>

  ${extGanArr.map(g  => `<td style="color:blue; background:#cfebfd;">${g  || '-'}</td>`).join('')}
  ${extJijiArr.map(j  => `<td style="color:blue; background:#efcffd;">${j  || '-'}</td>`).join('')}
  ${extGanjiArr.map(gj => `<td style="color:blue; background:#fdebcf;">${gj || '-'}</td>`).join('')}
</tr>


${sinsalRows
  .split('</tr>')
  .filter(row => row.trim())
  .map(row => {
    let tdIdx = -1;
    return row.replace(/<td(\s*[^>]*)?>/g, (m, attrs='') => {
      tdIdx++;

      // 기존 style 추출 & attrs에서 제거(중복 방지)
      let baseStyle = '';
      const mStyle = attrs.match(/\sstyle="([^"]*)"/i);
      if (mStyle) {
        baseStyle = (mStyle[1] || '').trim();
        attrs = attrs.replace(/\sstyle="[^"]*"/i, '');
      }

      // 블록 기준 색상: 월(노랑), 세운(파랑)
      const YELLOW = [2, 8, 14];
      const BLUE   = [4, 10, 16];

      // ✅ 대운·세운(연두/녹색)
      const GREEN  = [5, 6, 11, 12, 17, 18];

      // 순서 주의: 마지막에 설정한 background가 우선됨
      if (YELLOW.includes(tdIdx)) baseStyle += 'background:#fff59d;';
      if (BLUE.includes(tdIdx))   baseStyle += 'background:#90caf9;';
      if (GREEN.includes(tdIdx))  baseStyle += 'background:#c8e6c9;'; // 연녹(#c8e6c9) 톤

      return `<td${attrs} style="${baseStyle}">`;
    }) + '</tr>';
  }).join('')}

  
</table>
<div class="note-box" style="text-align:center">
  ※ 일간,일지,일주 / 년간,년지,년주 / 대운,세운 칸들은 각각 노랑, 파랑, 초록 색깔로 구분함. 기준간지를 기준으로 신살적용됨.
</div>
`;

}










/////천간기준 신살류///////////
//주의!!   신살은 모두 배열 [ ]로 넘겨줘야 함[천을귀인편 참고]///////////

export function getSinsalForGan(gan, sinsalName) {
  //천을귀인
  if (sinsalName === '천을귀인') {
    // 천을귀인 해당 지지 2개 반환 (없으면 빈배열)
    return cheonEulMap[gan] || [];
  }
  //홍염살
    if (sinsalName === '홍염살') {
    return 홍염Map[gan] || [];
  }
    //낙정관살
    if (sinsalName === '낙정관살') {
    return 낙정관살Map[gan] || [];
  }
if (sinsalName === '건록/암록/금여록') {
  const rels = 건록_암록_금여록MAP[gan] || [];
  const hits = rels.filter(r => r.target === jiji); // 현재 칸 지지와 target 매칭

  return hits.length
    ? hits.map(h => `${jiji}[${h.tags?.[0] || ''}]`).join(',')
    : 'X';
}

  return [];
}



/////지지기준 신살류///////////
// 
// 
export function getSinsalForJiji(jiji, sinsalName, { monthJiji } = {}) {
  //형충회합
  if (sinsalName === '형충회합') {
    if (!monthJiji) return []; // 안전망
    // 월지를 기준으로 target만 추출 → 문자열 배열
    return (형충회합Map[monthJiji] || []).map(item =>
      typeof item === 'string' ? item : item.target
    );
  }
  //원진/육해
    if (sinsalName === '원진/육해') {
    if (!monthJiji) return []; // 안전망
    // 월지를 기준으로 target만 추출 → 문자열 배열
    return (원진육해Map[monthJiji] || []).map(item =>
      typeof item === 'string' ? item : item.target
    );
  }
  //도화살
    if (sinsalName === '도화살') {
    return 도화살Map[jiji] ? [`${jiji}(${도화살Map[jiji]})`] : [];
  }
    //귀문살
    if (sinsalName === '귀문살') {
    return 귀문살Map[jiji] ? [`${jiji}(${귀문살Map[jiji]})`] : [];
  }
      //격각살
    if (sinsalName === '격각살') {
    return 격각살Map[jiji] ? [`${jiji}(${격각살Map[jiji]})`] : [];
  }
if (sinsalName === '합방/공방살') {
  const gender = context?.gender; // context에서 성별 받기
  const rels = 합방_공방살MAP[jiji] || [];
  // 성별에 맞는 항목만 추출
  const hits = rels.filter(r => r.gender === gender);

  // 출력: target(태그) 형식
  return hits.length
    ? hits.map(r => `${r.target}[${r.tags?.[0] || ''}]`)
    : [];
}
//천덕월덕
if (sinsalName === '천덕/월덕') {
  if (!monthJiji) return '';
  const rels = 천덕_월덕MAP[monthJiji] || [];
  const currentValue = jiji; // gan 참조 제거
  const hit = rels.find(r => r.target === currentValue);
  return hit ? `${hit.target}[${hit.tags?.[0] || ''}]` : '';
}


  //// 기타 신살은 빈 배열 반환
  return [];
}


/////간지기준 신살류///////////

export function getSinsalForGanji(ganji, sinsalName, context = {}) {
  // 내부 유틸
  const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

  const gan = ganji?.[0] || '';
  const ji  = ganji?.[1] || '';

 //백호살
  if (sinsalName === '백호살') {
    // ganji가 백호살 간지에 해당하면 해당 간지 반환, 아니면 빈 배열
    return BAEKHO_SAL_GANJI_MAP[ganji] ? [ganji] : [];
  }
  //괴강살
    if (sinsalName === '괴강살') {
    return GWAIGANG_SAL_GANJI[ganji] ? [ganji] : [];
  }
  //간여지동
  if (sinsalName === '간여지동') {
    // 간여지동에 해당하면 "간지(불통살)" 형태로 반환
    return 간여지동Map[ganji] ? [`${ganji}(${간여지동Map[ganji]})`] : [];
  }
  //효신살
      if (sinsalName === '효신살') {
    return 효신살Map[ganji] ? [ganji] : [];
  }
  //소실살
      if (sinsalName === '소실살') {
    return 소실살Map[ganji] ? [ganji] : [];
  }
    //재고귀인
      if (sinsalName === '재고귀인') {
    return 재고귀인Map[ganji] ? [ganji] : [];
  }
// === 공망살 (일주 기준) ===
if (sinsalName === '공망살') {
  const dayGan    = context.dayGan    || context.dayGanji?.[0] || context.sajuGanArr?.[1]  || '';
  const dayBranch = context.dayBranch || context.dayGanji?.[1] || context.sajuJijiArr?.[1] || '';

  const sIdx = STEMS.indexOf(dayGan);
  const bIdx = BRANCHES.indexOf(dayBranch);
  if (sIdx < 0 || bIdx < 0) return [];

  // 거리 계산
  const k = sIdx; // 乙=1, 丙=2, ...
  const startIdx = (bIdx - k + 1200) % 12;
  const prev1 = (startIdx - 1 + 12) % 12;
  const prev2 = (startIdx - 2 + 12) % 12;
  const voidBranches = [BRANCHES[prev2], BRANCHES[prev1]]; // 공망 지지 2개

  // 현재 간지의 지지가 공망이면 '공망[지지,지지]' 출력
  if (voidBranches.includes(ji)) {
    return [`공망[${voidBranches.join(',')}]`];
  }
  return [];
}


    return [];
  }
