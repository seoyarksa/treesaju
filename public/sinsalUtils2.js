// sinsalUtils.js

import { samhapGroups, UNSEONG_LIST, unseongMap12, sinsal_LIST, sinsalMap12,
         cheonEulMap, BAEKHO_SAL_GANJI_MAP,형충회합Map,원진육해Map,간여지동Map,효신살Map,소실살Map,재고귀인Map,
         
         GWAIGANG_SAL_GANJI, 

       } from './constants.js';




///////////기타 신살류 명칭 등록//////////////////
const etcSinsalList = ['형충회합', '원진/육해','간여지동', '효신살', '소실살','백호살',  '천을귀인', '재고귀인',
                      '도화살','홍염살', '귀문살', '격각살', '낙정관살',
                      '공망살',  '금여록', '천덕귀인', '월덕귀인', '괴강살','문창귀인', '학당귀인', '급각살', '상문살', '조객살','암록살','비인살',
                      '천의성', '음양차착살', '고란살', '태극귀인', '천라지망', '병부살', '사부살','현침살', '십악대패살', '단교관살'
                      ];


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
        아래 표는 해당 천간이나 삼합국을 클릭시 생성되는 12운성,12신살내용입니다[
        <span style="color:red;">戊,己는 제외</span>]<br>아래 "지지"에 <span style="color:orange;">마우스오버</span>시 천간에 따른 12운성 확인가능/
        <span style="color:blue;">파란색 간지</span>는 내 사주팔자 간지들</br>
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
//     '도화살','홍염살', '귀문살', '격각살', '낙정관살',
 //       '공망살',
 //   '금여록', '천덕귀인', '월덕귀인', '문창귀인', '학당귀인', '급각살', '상문살', '조객살','암록살','비인살',
//     '천의성', '음양차착살', '고란살', '태극귀인', '천라지망', '병부살', '사부살','현침살', '십악대패살', '단교관살'
//////
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
    if (!seSel) {
      const y = new Date().getFullYear();
      const cells = Array.from(document.querySelectorAll('.sewoon-cell[data-year]'));
      seSel = cells.find(c => parseInt(c.dataset.year, 10) === y) || null;
      if (!seSel && cells.length) {
        const cand = cells
          .map(c => ({ el: c, diff: Math.abs(parseFloat(c.dataset.year) - y) }))
          .sort((a, b) => a.diff - b.diff)[0];
        seSel = cand?.el || null;
      }
      if (seSel) console.log('[신살] 세운 fallback cell:', seSel.dataset.year);
    }
    if (seSel) {
      sGan  = sGan  || seSel.dataset.stem   || '';
      sJiji = sJiji || seSel.dataset.branch || '';
      console.log('[신살] 세운 stem/branch:', sGan, sJiji, 'year=', seSel?.dataset.year);
    } else {
      console.warn('[신살] 세운 미확정: context/DOM 모두 값 없음');
    }
  } else {
    console.log('[신살] 세운 from context:', sGan, sJiji);
  }

  // ---------- 한자 정규화 ----------
  const dGanHan  = toHanStem(dGan);
  const dJijiHan = toHanBranch(dJiji);
  const sGanHan  = toHanStem(sGan);
  const sJijiHan = toHanBranch(sJiji);
  console.log('[신살] 대운(한자):', dGanHan, dJijiHan);
  console.log('[신살] 세운(한자):', sGanHan, sJijiHan);

  // ---------- 간지 조합 ----------
  const dGanjiHan = (dGanHan && dJijiHan) ? dGanHan + dJijiHan : '';
  const sGanjiHan = (sGanHan && sJijiHan) ? sGanHan + sJijiHan : '';
  console.log('[신살] 대운 간지(한자):', dGanjiHan);
  console.log('[신살] 세운 간지(한자):', sGanjiHan);

  // ---------- 확장 배열 ----------
  const extGanArr   = [...sajuGanArr,   dGanHan,   sGanHan  ];
  const extJijiArr  = [...sajuJijiArr,  dJijiHan,  sJijiHan ];
  const extGanjiArr = [...sajuGanjiArr, dGanjiHan, sGanjiHan];
  console.log('[신살] 확장 GanArr  :', extGanArr);
  console.log('[신살] 확장 JijiArr :', extJijiArr);
  console.log('[신살] 확장 GanjiArr:', extGanjiArr);

  // ▲▲▲ ADD 끝 ▲▲▲

  const sinsalRows = etcSinsalList.map(sinsalName => {

    // ========= 1) 천간 신살 (6칸) =========
    // 기존: 사주간 4칸만 → 변경: extGanArr(6칸) 기준으로 계산
    const ganResults = extGanArr.map(gan => {
      const candidates = getSinsalForGan(gan, sinsalName) || [];
      // 후보가 지지(문자 or {jiji})이므로 비교셋은 지지 확장배열 사용
      const present = candidates.filter(obj =>
        typeof obj === 'object'
          ? extJijiArr.includes(obj.jiji)
          : extJijiArr.includes(obj)
      );
      return present.length
        ? present.map(obj =>
            typeof obj === 'object'
              ? obj.jiji + (obj.yinYang === '+' ? '(양)' : '(음)')
              : obj
          ).join(',')
        : 'X';
    });

    // ========= 2) 지지 신살 (6칸) =========
    // 기존: 사주지지 4칸만 → 변경: extJijiArr(6칸) 기준으로 계산
    const jijiResults = extJijiArr.map(jiji => {
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
      const candidates = getSinsalForJiji(jiji, sinsalName, { monthJiji }) || [];
      const exists = candidates.some(t => extJijiArr.includes(t));
      return exists ? candidates.filter(t => extJijiArr.includes(t)).join(',') : 'X';
    });

    // ========= 3) 간지 신살 (6칸) =========
    // 기존: 사주간지 4칸만 → 변경: extGanjiArr(6칸) 기준으로 계산
    const ganjiResults = extGanjiArr.map(ganji => {
      const candidates = getSinsalForGanji(ganji, sinsalName) || [];
      const stripTag = s => s.replace(/\(.*\)/, '');
      const exists = candidates.some(gj => extGanjiArr.includes(stripTag(gj)));
      return exists
        ? candidates.filter(gj => extGanjiArr.includes(stripTag(gj))).join(',')
        : 'X';
    });

    // 모두 X면 생략
    const allX = [...ganResults, ...jijiResults, ...ganjiResults].every(v => !v || v === 'X');
    if (allX) return '';

    // ▼ 데이터 행도 6칸씩 맞춰 출력 (천간/지지/간지 블록)
    return `
      <tr>
        <td>${sinsalName}</td>
        ${ganResults.map(v => `<td>${v || 'X'}</td>`).join('')}
        ${jijiResults.map(v => `<td>${v || 'X'}</td>`).join('')}
        ${ganjiResults.map(v => `<td>${v || 'X'}</td>`).join('')}
      </tr>
    `;
  }).filter(Boolean).join('');

  if (!sinsalRows) {
    return `<table style="margin:auto; margin-top:10px;"><tr><td>해당 기타 신살 없음</td></tr></table>`;
  }

  // ▼ 표 렌더링: 헤더/제목/기준간지도 6칸에 맞춰 출력 (사주 4 + 대운 + 세운)
  return `
<table border="1" style="border-collapse:collapse; margin:auto; margin-top:16px; font-size:14px; min-width:600px;">
  <tr>
    <th style="background:#f7f7f7;" rowspan="2">사주신살류</th>
    <th colspan="6" style="background:#e7f5fe;">사주천간</th>
    <th colspan="6" style="background:#f7e7fe;">사주지지</th>
    <th colspan="6" style="background:#fef5e7;">사주간지(동주)</th>
  </tr>
  <tr>
    <td>시</td><td>일</td><td>월</td><td>년</td><td>대운</td><td>세운</td>
    <td>시</td><td>일</td><td>월</td><td>년</td><td>대운</td><td>세운</td>
    <td>시주</td><td>일주</td><td>월주</td><td>년주</td><td>대운</td><td>세운</td>
  </tr>
  <tr>
    <td style="background:#ffe6e6;">기준간지</td>
    ${extGanArr.map(g  => `<td style="color:blue; background:#ffe6e6;">${g  || '-'}</td>`).join('')}
    ${extJijiArr.map(j => `<td style="color:blue; background:#ffe6e6;">${j  || '-'}</td>`).join('')}
    ${extGanjiArr.map(gj=> `<td style="color:blue; background:#ffe6e6;">${gj || '-'}</td>`).join('')}
  </tr>

  ${sinsalRows
    .split('</tr>')
    .filter(row => row.trim())
    .map(row => {
      let tdIdx = -1;
      return row.replace(/<td(\s*[^>]*)?>/g, (m, attrs) => {
        tdIdx++;
        let style = '';
        // 6칸 블록 기준 하이라이트 (원하는 포인트로 조정)
        // 예) 월(노랑) / 세운(파랑)
        const YELLOW = [2, 8, 14];   // 각 블록 '월'
        const BLUE   = [4, 10, 16];  // 각 블록 '세운'
        if (YELLOW.includes(tdIdx)) style = 'background:#fff59d;';
        if (BLUE.includes(tdIdx))   style = 'background:#90caf9;';
        return `<td${attrs ? attrs : ''} style="${style}">`;
      }) + '</tr>';
    }).join('')
  }
</table>
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
  return [];
}


/////간지기준 신살류///////////

export function getSinsalForGanji(ganji, sinsalName) {
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
  return [];
}