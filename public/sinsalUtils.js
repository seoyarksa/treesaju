// sinsalUtils.js

import { branchOrder,samhapGroups, tenGodMap, UNSEONG_LIST, unseongMap12, sinsal_LIST, sinsalMap12, 충MAP,
         cheonEulMap, BAEKHO_SAL_GANJI_MAP,형충회합Map,원진육해Map,간여지동Map,효신살Map,소실살Map,재고귀인Map,
         홍염Map, 도화살MAP,귀문살MAP, 낙정관살Map,격각살MAP,합방_공방살MAP,
         GWAIGANG_SAL_GANJI, 건록_암록_금여록MAP,천덕_월덕MAP,문창_학당MAP,상문_조객MAP, 양인_비인MAP, 급각살MAP, 
         천의성MAP, 음양차착살Map,고란살Map,태극귀인MAP,천라지망MAP,단교관살MAP, HYUNCHIM_SAL_MAP, 십악대패살MAP

} from './constants.js';

// 사주 4주 → 배열 변환 (이미 있으면 생략)
window.getSajuArrays ||= function getSajuArrays() {
  const s = window.saju || {};
  const sajuGanArr   = [s.hourGan, s.dayGan, s.monthGan, s.yearGan].map(v => v || '');
  const sajuJijiArr  = [s.hourBranch, s.dayBranch, s.monthBranch, s.yearBranch].map(v => v || '');
  return { sajuGanArr, sajuJijiArr };
};

// 메인 신살(12운성/12신살 표) 다시 그리기
window.renderSinsalMainNow ||= function renderSinsalMainNow(extraCtx = {}) {
  try {
    if (typeof window.renderSinsalTable !== 'function') {
      console.warn('[renderSinsalMainNow] renderSinsalTable 미로딩');
      return;
    }
    const box = document.querySelector('#sinsal-box'); // ← 메인 신살 컨테이너 ID
    if (!box) {
      console.warn('[renderSinsalMainNow] 컨테이너 #sinsal-box 없음');
      return;
    }
    const { sajuGanArr, sajuJijiArr } = window.getSajuArrays();
    // samhapKey는 네가 전역으로 유지하는 값이 있으면 사용
    const samhapKey =
      extraCtx.samhapKey ??
      window.currentSamhapKey ??
      ''; // 없으면 빈값

    // 메인 신살 렌더
    const html = window.renderSinsalTable({ sajuGanArr, samhapKey, sajuJijiArr });
    box.innerHTML = html;
  } catch (e) {
    console.warn('[renderSinsalMainNow] 실패:', e);
  }
};


///////////기타 신살류 명칭 등록//////////////////
const etcSinsalList = ['천을귀인','홍염살', '낙정관살', '건록/암록/금여록','문창/학당', '양인/비인', '태극귀인', 
                      '천덕/월덕','형충회합', '원진/육해','도화살','귀문살', '격각살', '합방/공방살',  '상문/조객','급각살','천의성','천라지망',
                      '병부살','사부살', '단교관살', 
                      '간여지동', '백호살', '괴강살','효신살', '소실살',  '재고귀인','공망살',    
                       '음양차착살', '고란살',   '현침살', '십악대패살', 
                      ];
//////////////////////////////////////////////////////////////////////////////////////////////
//''십악대패살', 
//////
// ////////////////////////////////////////////////////////////////////////////////////////
// 신살 표시 구역 타입 분류
const GAN_SINSAL   = new Set(['천을귀인', '홍염살', '낙정관살', '건록/암록/금여록','문창/학당','양인/비인',
                              '태극귀인','천덕/월덕',]);    // 필요 시 추가
const JIJI_SINSAL  = new Set(['형충회합', '원진/육해', '도화살', '귀문살', '격각살','합방/공방살','천덕/월덕',
                              '상문/조객','급각살', '천의성', '천라지망','병부살', '사부살','단교관살' ]); // 필요 시 추가
const GANJI_SINSAL = new Set(['간여지동', '백호살', '괴강살', '효신살', '소실살', '재고귀인','공망살','음양차착살',
                               '고란살', '현침살', '십악대패살' ]);                         // 필요 시 추가

function getSinsalType(name) {
  if (name === '천덕/월덕')    return 'mixed'; // ← 이 줄이 반드시 위 조건들보다 먼저 실행되게
  if (GAN_SINSAL.has(name))   return 'gan';
  if (JIJI_SINSAL.has(name))  return 'jiji';
  if (GANJI_SINSAL.has(name)) return 'ganji';
    if (name === '현침살') return 'ganji';
 
}

export function getSipsin(dayGan, targetGan) {
  if (!dayGan || !targetGan) return "";

  // targetGan은 천간 10글자 중 하나
  const result = tenGodMap[dayGan]?.[targetGan] || "";
  //console.log("👉 십신 조회:", dayGan, "vs", targetGan, "=>", result);

  return result;
}

// saju: { dayGan, yearBranch, monthBranch, dayBranch, hourBranch }
// samhapKey: getSamhapKeyByJiji(saju.yearBranch) 등에서 추출






//천간별 12운성 구하기 시작////////////////////////////
// #unseong-box 컨테이너가 있다고 가정 (원하는 id로 바꿔도 됨)
window.renderUnseongNow ||= function renderUnseongNow() {
  if (typeof window.renderUnseongByBranches !== 'function') return;
  const box = document.querySelector('#unseong-box');
  if (!box) return;

  const s = window.saju || {};
  const html =
    renderUnseongByBranches({ baseStem: s.hourGan,  caption:'12운성 (시간 기준 · 지지별/대운·세운 포함)' }) +
    renderUnseongByBranches({ baseStem: s.dayGan,   caption:'12운성 (일간 기준 · 지지별/대운·세운 포함)' }) +
    renderUnseongByBranches({ baseStem: s.monthGan, caption:'12운성 (월간 기준 · 지지별/대운·세운 포함)' }) +
    renderUnseongByBranches({ baseStem: s.yearGan,  caption:'12운성 (년간 기준 · 지지별/대운·세운 포함)' });

  box.innerHTML = html;
};

// ── Han converter polyfills (idempotent)
(function ensureHanConverters(){
  if (typeof window.toHanStem !== 'function'){
    const H = '甲乙丙丁戊己庚辛壬癸';
    const K2H = {갑:'甲', 을:'乙', 병:'丙', 정:'丁', 무:'戊', 기:'己', 경:'庚', 신:'辛', 임:'壬', 계:'癸'};
    window.toHanStem = v => {
      const s = String(v ?? '').trim();
      if (!s) return '';
      if (H.includes(s[0])) return s[0];     // 이미 한자
      return K2H[s] || '';
    };
  }
  if (typeof window.toHanBranch !== 'function'){
    const H = '子丑寅卯辰巳午未申酉戌亥';
    const K2H = {자:'子', 축:'丑', 인:'寅', 묘:'卯', 진:'辰', 사:'巳', 오:'午', 미:'未', 신:'申', 유:'酉', 술:'戌', 해:'亥'};
    window.toHanBranch = v => {
      const s = String(v ?? '').trim();
      if (!s) return '';
      if (H.includes(s[0])) return s[0];     // 이미 한자
      return K2H[s] || '';
    };
  }
})();

// 고정: 子 → 亥 순서 (없으면 선언)
// 子→亥 고정 순서 (중복 선언 방지)
window.BRANCH_ORDER = window.BRANCH_ORDER || ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// ── 강력 통합: 현재 선택된 대운/세운 지지(한자) 가져오기
(function installDYSEGetter(){
  const toHB = (typeof window.toHanBranch === 'function') ? window.toHanBranch : (v=>String(v||''));

  function pickBranch(sel) {
    const el = document.querySelector(sel);
    if (!el) return '';
    if (el.dataset?.branch) return toHB(el.dataset.branch);
    const lines = (el.innerText || '').trim().split('\n').map(s=>s.trim());
    return toHB(lines[2] || lines[1] || '');
  }

  window.__getCurrentDaeyunSewoonHan = function(){
    const d1 = window?.selectedDaewoon?.branch || '';
    const s1 = window?.selectedSewoon?.branch  || '';

    const d2 = d1 || pickBranch('#basic-daeyun-table .daeyun-cell.selected');
    const s2 = s1 || pickBranch('#basic-daeyun-table .sewoon-cell.selected');

    const out = { daeyunBranchHan: d2 || '', sewoonBranchHan: s2 || '' };
    console.log('[DY/SE getter]', out);
    return out;
  };
})();

// 맵 인덱싱 12운성 계산기 (전역 등록)
(function initUnseongCalc(){
  if (window.__unseongOf) return;
  const getStem = (typeof window.toHanStem   === 'function') ? window.toHanStem   : (v => String(v || ''));
  const getBr   = (typeof window.toHanBranch === 'function') ? window.toHanBranch : (v => String(v || ''));
  window.__unseongOf = function __unseongOf(stem, branch) {
    const S = getStem(stem);
    const B = getBr(branch);
    const M = (window.unseongMap12 || unseongMap12) || {};
    const seq = M[S];
    if (!seq) return ''; // (주의) 戊/己 등 매핑 없으면 공란
    const idx = window.BRANCH_ORDER.indexOf(B);
    return idx >= 0 ? (seq[idx] || '') : '';
  };
})();

// ✅ 전달받은 baseStem(시간/일간/월간/년간)을 기준으로,
//    [시·일·월·년·대운·세운] 지지에 대한 12운성을 표로 출력
// ▼▼ 교체: 기존 renderUnseongByBranches 전부 이걸로 바꿔 붙이세요 ▼▼
function renderUnseongByBranches({ baseStem, caption = '12운성' }) {
  const toHanStem   = (typeof window.toHanStem   === 'function') ? window.toHanStem   : v => String(v || '');
  const toHanBranch = (typeof window.toHanBranch === 'function') ? window.toHanBranch : v => String(v || '');
  const s = window.saju || {};

  // 0) 기준 천간 + 맵 유효성
  const bStem = toHanStem(baseStem);
  const UNMAP = (window.unseongMap12 || (typeof unseongMap12 !== 'undefined' ? unseongMap12 : null)) || {};
  const bStemValid = !!UNMAP[bStem];

  // 1) 대운/세운 추출 — “기타신살”과 동일한 우선순위/폴백(+ 구표 DOM까지 포함)
  function pickDaeyunSewoon() {
    // ---------- 대운 ----------
    let dGan  = '';
    let dJiji = '';

    // (1) 전역 선택값
    if (window?.selectedDaewoon) {
      dGan  = window.selectedDaewoon.stem   || dGan;
      dJiji = window.selectedDaewoon.branch || dJiji;
    }

    // (2) 새 대운표 DOM (#basic-daeyun-table)
    if (!dGan || !dJiji) {
      const sel = document.querySelector('#basic-daeyun-table .daeyun-cell.selected');
      if (sel) {
        const dsGan  = sel.dataset?.stem   || '';
        const dsJiji = sel.dataset?.branch || '';
        if (dsGan && dsJiji) {
          dGan  = dGan  || dsGan;
          dJiji = dJiji || dsJiji;
        } else {
          const lines = (sel.innerText || '').trim().split('\n').map(s => s.trim());
          const maybeGan = lines[0] || '';
          const maybeJi  = lines[2] || lines[1] || '';
          dGan  = dGan  || maybeGan.replace(/\s+/g, '');
          dJiji = dJiji || maybeJi.replace(/\s+/g, '');
        }
      }
    }

    // (3) 구 대운표 DOM (.daeyun-table-container …)
    if (!dGan || !dJiji) {
      const tds = document.querySelectorAll('.daeyun-table-container .daeyun-table tbody tr:nth-child(2) td');
      const selTd = Array.from(tds).find(td => td.classList.contains('daeyun-selected'));
      if (selTd) {
        if (window.daeyunPairs?.length) {
          const idx = Array.from(tds).indexOf(selTd);
          const trueIdx = tds.length - 1 - idx;
          const pair = window.daeyunPairs[trueIdx] || {};
          dGan  = dGan  || (pair.stem   || '');
          dJiji = dJiji || (pair.branch || '');
        } else {
          const lines = (selTd.innerText || '').trim().split('\n').map(s => s.trim());
          const maybeGan = lines[0] || '';
          const maybeJi  = lines[2] || lines[1] || '';
          dGan  = dGan  || maybeGan.replace(/\s+/g, '');
          dJiji = dJiji || maybeJi.replace(/\s+/g, '');
        }
      }
    }

    // ---------- 세운 ----------
    let sGan  = '';
    let sJiji = '';

    // (1) 전역 선택값
    if (window?.selectedSewoon) {
      sGan  = window.selectedSewoon.stem   || sGan;
      sJiji = window.selectedSewoon.branch || sJiji;
    }

    // (2) 새 세운표 DOM (#basic-daeyun-table)
    if (!sGan || !sJiji) {
      const seSel = document.querySelector('#basic-daeyun-table .sewoon-cell.selected');
      if (seSel) {
        const dsGan  = seSel.dataset?.stem   || '';
        const dsJiji = seSel.dataset?.branch || '';
        if (dsGan && dsJiji) {
          sGan  = sGan  || dsGan;
          sJiji = sJiji || dsJiji;
        } else {
          const lines = (seSel.innerText || '').trim().split('\n').map(s => s.trim());
          const maybeGan = lines[0] || '';
          const maybeJi  = lines[2] || lines[1] || '';
          sGan  = sGan  || maybeGan.replace(/\s+/g, '');
          sJiji = sJiji || maybeJi.replace(/\s+/g, '');
        }
      }
    }

    // (3) 구 세운표 DOM (있다면 호환)
    if (!sGan || !sJiji) {
      const oldSel = document.querySelector('.sewoon-cell.selected');
      if (oldSel) {
        const dsGan  = oldSel.dataset?.stem   || '';
        const dsJiji = oldSel.dataset?.branch || '';
        if (dsGan && dsJiji) {
          sGan  = sGan  || dsGan;
          sJiji = sJiji || dsJiji;
        } else {
          const lines = (oldSel.innerText || '').trim().split('\n').map(s => s.trim());
          const maybeGan = lines[0] || '';
          const maybeJi  = lines[2] || lines[1] || '';
          sGan  = sGan  || maybeGan.replace(/\s+/g, '');
          sJiji = sJiji || maybeJi.replace(/\s+/g, '');
        }
      }
    }

    // (4) 최종 폴백: 세운은 無 허용
    if (!sGan || !sJiji) {
      sGan  = '無';
      sJiji = '無';
    }

    // 한자 정규화해서 반환(12운성 계산은 지지 중심)
    return {
      daeyunBranchHan: dJiji ? toHanBranch(dJiji) : '',
      sewoonBranchHan: sJiji ? toHanBranch(sJiji) : ''
    };
  }

  const { daeyunBranchHan, sewoonBranchHan } = pickDaeyunSewoon();

  // 2) 지지 배열(시/일/월/년 + 대운/세운)
  const branches = [
    toHanBranch(s.hourBranch || ''),
    toHanBranch(s.dayBranch  || ''),
    toHanBranch(s.monthBranch|| ''),
    toHanBranch(s.yearBranch || ''),
    daeyunBranchHan || '',
    sewoonBranchHan || ''
  ];
  const labels = ['시','일','월','년','대운','세운'];

  // 3) 셀 생성 (12운성은 빨강)
  const tds = branches.map((br, i) => {
    const u = (bStemValid && br && br !== '無') ? __unseongOf(bStem, br) : '';
    return `
      <td style="min-width:60px; padding:6px; text-align:center;">
        <div>${labels[i]}</div>
        <div>${br || '-'}</div>
        <div class="unseong-tag" style="font-size:.9em; color:#c21;">${u || '-'}</div>
      </td>`;
  }).join('');

  // 4) 표 반환
  return `
    <table class="sinsal-bottom unseong-table" border="1"
           style="border-collapse:collapse; margin:auto; font-size:14px; margin-top:8px;">
      <thead>
        <tr><th colspan="6" style="padding:6px; background:#f5fbff;">
          ${caption} · 기준 천간: <span style="color:#1976d2">${bStem || '-'}</span>
        </th></tr>
      </thead>
      <tbody><tr>${tds}</tr></tbody>
    </table>
  `;
}
window.renderUnseongByBranches = renderUnseongByBranches;




//천간별 12운성 구하기 끝////////////////////////////



export function renderSinsalTable({ sajuGanArr, samhapKey, sajuJijiArr }) {
  const ganList = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const samhapNames = ['申子辰', '亥卯未', '寅午戌', '巳酉丑'];
  const jijiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const sajuGanjiArr = sajuGanArr.map((gan, idx) => gan + sajuJijiArr[idx]);

const dayGan = sajuGanArr[1];  
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
      ${ganList.map(gan => {
  const sipsin = getSipsin(dayGan, gan);  // 천간에 대한 십신명
  return `<td class="clickable${sajuGanArr.includes(gan) ? ' saju-blue' : ''}" 
              data-type="unseong" 
              data-gan="${gan}" 
              style="cursor:pointer; text-align:center;">
              <div>${gan}</div>
              <div style="font-size:0.8em; color:#555;">${sipsin}</div>
          </td>`;
}).join("")}

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

        .unseong-tag { color:#d00000 !important; font-weight:700; 
        }


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

<!-- 추가: 7줄 × 17칸 (자동 채움) -->
<br> * 천간별 12운성표 [위의 표에서는 원하는 천간의 지지별 12운성(신살)을 바로 확인할 수 있습니다.]
<table class="sinsal-bottom sinsal-extra-7x17" border="1"
       style="border-collapse:collapse; margin:auto; font-size:14px; margin-top:8px;">
  <tbody>

${renderUnseongByBranches({ baseStem: window.saju?.hourGan,  caption:'12운성 (시간 기준 · 지지별/대운·세운 포함)' })}
${renderUnseongByBranches({ baseStem: window.saju?.dayGan  , caption:'12운성 (일간 기준 · 지지별/대운·세운 포함)' })}
${renderUnseongByBranches({ baseStem: window.saju?.monthGan, caption:'12운성 (월간 기준 · 지지별/대운·세운 포함)' })}
${renderUnseongByBranches({ baseStem: window.saju?.yearGan , caption:'12운성 (년간 기준 · 지지별/대운·세운 포함)' })}


  </tbody>
</table>


  `;
}
// 파일: sinsalTable.js (renderSinsalTable가 정의된 그 파일)
window.renderSinsalTable = window.renderSinsalTable || renderSinsalTable;


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
// ★ 공용: 현재 "대운/세운 지지(한자)"를 얻는다 (Etc 신살과 동일한 폴백 순서)
(function initSharedDaeyunSewoonGetter(){
  if (window.__getCurrentDaeyunSewoonHan) return; // 중복 방지

  // ⚠️ 여기서는 절대 변환하지 않음(원본 그대로 반환)
  function fromNewDaeyunDOM() {
    const el = document.querySelector('#basic-daeyun-table .daeyun-cell.selected');
    if (!el) return '';
    if (el.dataset?.branch) return el.dataset.branch; // 원본
    const lines = el.innerText?.trim().split('\n').map(s => s.trim()) || [];
    return (lines[2] || lines[1] || '');              // 원본
  }

  function fromNewSewoonDOM() {
    const el = document.querySelector('#basic-daeyun-table .sewoon-cell.selected');
    if (!el) return '';
    if (el.dataset?.branch) return el.dataset.branch; // 원본
    const lines = el.innerText?.trim().split('\n').map(s => s.trim()) || [];
    return (lines[2] || lines[1] || '');              // 원본
  }

  function fromLegacyDaeyunDOM() {
    // 구 대운 표: .daeyun-table-container .daeyun-table tbody tr:nth-child(2) td
    const tds = document.querySelectorAll('.daeyun-table-container .daeyun-table tbody tr:nth-child(2) td');
    const sel = Array.from(tds).find(td => td.classList.contains('daeyun-selected'));
    if (!sel) return '';
    // window.daeyunPairs가 있다면 trueIdx로 역산, 없으면 텍스트 파싱
    if (window.daeyunPairs?.length) {
      const idx = Array.from(tds).indexOf(sel);
      const trueIdx = tds.length - 1 - idx;
      const pair = window.daeyunPairs[trueIdx] || {};
      return (pair.branch || '');                    // 원본
    }
    const lines = sel.innerText?.trim().split('\n').map(s => s.trim()) || [];
    return (lines[2] || lines[1] || '');             // 원본
  }

  window.__getCurrentDaeyunSewoonHan = function() {
    // 1) 전역 선택 우선 (원본)
    const dJ = window?.selectedDaewoon?.branch || '';
    const sJ = window?.selectedSewoon?.branch  || '';

    // 2) 새 표 DOM 폴백 (원본)
    const dJ2 = dJ || fromNewDaeyunDOM();
    const sJ2 = sJ || fromNewSewoonDOM();

    // 3) 구 표 DOM 폴백 (원본)
    const dJ3 = dJ2 || fromLegacyDaeyunDOM();

    // ⚠️ 속성명은 기존과 동일하게 유지(하위 코드 호환)
    return {
      daeyunBranchHan: dJ3 || '',
      sewoonBranchHan: sJ2 || ''
    };
  };
})();

// ////////////////////////////////////////////////////////////////////////////////////////

export function renderEtcSinsalTable({ sajuGanArr, sajuJijiArr, sajuGanjiArr, context = {} }) {
  const MONTH_INDEX = 2;
  const monthJiji = sajuJijiArr?.[MONTH_INDEX];

// 2글자 간지 안전 분리
function splitGanjiSafe(gj) {
  const s = (gj || '').trim();
  const stem = s[0];
  const branch = s[1];
  const isStem = /[甲乙丙丁戊己庚辛壬癸]/.test(stem || '');
  const isBranch = /[子丑寅卯辰巳午未申酉戌亥]/.test(branch || '');
  return { stem: isStem ? stem : '', branch: isBranch ? branch : '', ok: isStem && isBranch };
}


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
let dGan  = (context.daeyun?.stem   || '').trim();
let dJiji = (context.daeyun?.branch || '').trim();

// 1) 전역 선택값(새 표에서 클릭 시 세팅됨)
if ((!dGan || !dJiji) && window?.selectedDaewoon) {
  dGan  = dGan  || (window.selectedDaewoon.stem   || '');
  dJiji = dJiji || (window.selectedDaewoon.branch || '');
}

// 2) 새 대운표 DOM 폴백: #basic-daeyun-table
if (!dGan || !dJiji) {
  const sel = document.querySelector('#basic-daeyun-table .daeyun-cell.selected');
  if (sel) {
    // data-*가 있으면 우선 사용
    const dsGan  = sel.dataset?.stem   || '';
    const dsJiji = sel.dataset?.branch || '';
    if (dsGan && dsJiji) {
      dGan  = dGan  || dsGan;
      dJiji = dJiji || dsJiji;
    } else {
      // 없으면 텍스트(줄바꿈 기준)에서 간/지 분리
      const lines = (sel.innerText || '').trim().split('\n').map(s => s.trim());
      // 예상: [간, (십성), 지] 또는 [간, 지]
      const maybeGan = lines[0] || '';
      const maybeJi  = lines[2] || lines[1] || '';
      dGan  = dGan  || maybeGan.replace(/\s+/g, '');
      dJiji = dJiji || maybeJi.replace(/\s+/g, '');
    }
  }
}

// 3) (구) 구조 폴백: window.daeyunPairs / 구 DOM
if (!dGan || !dJiji) {
  if (window.daeyunPairs && Number.isInteger(window.currentDaeyunIndex)) {
    const pair = window.daeyunPairs[window.currentDaeyunIndex] || {};
    dGan  = dGan  || (pair.stem   || '');
    dJiji = dJiji || (pair.branch || '');
  } else {
    const tds = document.querySelectorAll('.daeyun-table-container .daeyun-table tbody tr:nth-child(2) td');
    const selTd = Array.from(tds).find(td => td.classList.contains('daeyun-selected'));
    if (selTd && window.daeyunPairs?.length) {
      const idx = Array.from(tds).indexOf(selTd);
      const trueIdx = tds.length - 1 - idx;
      const pair = window.daeyunPairs[trueIdx] || {};
      dGan  = dGan  || (pair.stem   || '');
      dJiji = dJiji || (pair.branch || '');
    }
  }
}

// ---------- 세운 ----------
let sGan  = (context.sewoon?.stem   || '').trim();
let sJiji = (context.sewoon?.branch || '').trim();

// 1) 전역 선택값(새 표에서 클릭 시 세팅됨)
if ((!sGan || !sJiji) && window?.selectedSewoon) {
  sGan  = sGan  || (window.selectedSewoon.stem   || '');
  sJiji = sJiji || (window.selectedSewoon.branch || '');
}

// 2) 새 세운표 DOM 폴백: #basic-daeyun-table
if (!sGan || !sJiji) {
  const seSel = document.querySelector('#basic-daeyun-table .sewoon-cell.selected');
  if (seSel) {
    sGan  = sGan  || seSel.dataset?.stem   || '';
    sJiji = sJiji || seSel.dataset?.branch || '';
    if ((!sGan || !sJiji) && seSel.innerText) {
      const lines = seSel.innerText.trim().split('\n').map(s => s.trim());
      const maybeGan = lines[0] || '';
      const maybeJi  = lines[2] || lines[1] || '';
      sGan  = sGan  || maybeGan.replace(/\s+/g, '');
      sJiji = sJiji || maybeJi.replace(/\s+/g, '');
    }
  }
}

// 3) (구) 구조 폴백: .sewoon-cell.selected (구 표)
if (!sGan || !sJiji) {
  const oldSel = document.querySelector('.sewoon-cell.selected');
  if (oldSel) {
    sGan  = sGan  || oldSel.dataset?.stem   || '';
    sJiji = sJiji || oldSel.dataset?.branch || '';
    if ((!sGan || !sJiji) && oldSel.innerText) {
      const lines = oldSel.innerText.trim().split('\n').map(s => s.trim());
      const maybeGan = lines[0] || '';
      const maybeJi  = lines[2] || lines[1] || '';
      sGan  = sGan  || maybeGan.replace(/\s+/g, '');
      sJiji = sJiji || maybeJi.replace(/\s+/g, '');
    }
  }
}

// 최종 폴백: 無
if (!sGan || !sJiji) {
  sGan  = '無';
  sJiji = '無';
}

// ---------- 한자 정규화 ----------
const dGanHan  = toHanStem(dGan);
const dJijiHan = toHanBranch(dJiji);

// 세운이 없으면 '無' 처리
const sGanHan  = sGan ? toHanStem(sGan) : '無';
const sJijiHan = sJiji ? toHanBranch(sJiji) : '無';

///console.log('[신살] 대운(한자):', dGanHan, dJijiHan);
//console.log('[신살] 세운(한자):', sGanHan, sJijiHan);

// ---------- 간지 조합 ----------
const dGanjiHan = (dGanHan && dJijiHan) ? dGanHan + dJijiHan : '';
const sGanjiHan = (sGan && sJiji) ? (sGanHan + sJijiHan) : '無';

//console.log('[신살] 대운 간지(한자):', dGanjiHan);
//console.log('[신살] 세운 간지(한자):', sGanjiHan);

// ---------- 확장 배열 ----------
const extGanArr   = [...sajuGanArr,   dGanHan,   sGanHan];
const extJijiArr  = [...sajuJijiArr,  dJijiHan,  sJijiHan];
const extGanjiArr = [...sajuGanjiArr, dGanjiHan, sGanjiHan];

//console.log('[신살] 확장 GanArr  :', extGanArr);
//console.log('[신살] 확장 JijiArr :', extJijiArr);
//console.log('[신살] 확장 GanjiArr:', extGanjiArr);


  // ▲▲▲ ADD 끝 ▲▲▲

  const sinsalRows = etcSinsalList.map(sinsalName => {
  

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
//천덕월덕
if (sinsalName === '천덕/월덕') {
  if (!monthJiji) return 'X';
  const rels = 천덕_월덕MAP[monthJiji] || [];
  const hit = rels.find(r => r.target === gan); // 천간만 비교
  return hit ? `${hit.target}[${hit.tags?.[0] || ''}]` : 'X';
}
// 문창/학당
if (sinsalName === '문창/학당') {
  const rels = 문창_학당MAP[gan] || []; // gan: 현재 칸의 천간
  // target이 extJijiArr(사주 전체 지지)에 포함되는 경우만
  const hits = rels.filter(r => extJijiArr.includes(r.target));

  return hits.length
    ? hits.map(r => `${r.target}[${r.tags?.[0] || ''}]`).join(',')
    : 'X';
}
// 양인/비인살
if (sinsalName === '양인/비인') {
  const rels = 양인_비인MAP[gan] || []; // gan: 현재 칸의 천간
  // target이 extJijiArr(사주 전체 지지)에 포함되는 경우만
  const hits = rels.filter(r => extJijiArr.includes(r.target));

  return hits.length
    ? hits.map(r => `${r.target}[${r.tags?.[0] || ''}]`).join(',')
    : 'X';
}
// 태극귀인
if (sinsalName === '태극귀인') {
  const dayGan = sajuGanArr[1];   // 기준: 일간
  const rels = 태극귀인MAP[dayGan] || [];

  const jiji = extJijiArr[idx];   // 현재 칸의 지지
  if (idx === 0 || idx === 2) return 'X'; // 시지, 월지 제외

  const hit = rels.find(r => r.target === jiji);
  const content = hit ? `${jiji}[${hit.tags?.[0] || ''}]` : 'X';

  // 👉 일간칸은 내용 밑에 [기준]을 빨간색으로 추가
  if (idx === 1) {
    return `${content}<br><span style="color:red;">[기준]</span>`;
  }

  return content;
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
    const hit = rels.find(r => r.target === jiji);
    // 월지 칸 && 사주 4칸 중 월지 칸(idx === 2)만 기준 표시
    const isSajuMonthCell = (idx === 2 && jiji === monthJiji);
    if (isSajuMonthCell) return `<span style="color:red;">기준</span>`;
    return hit ? `${monthJiji}${jiji}(${hit.tags?.[0] || ''})` : 'X';
  }

  if (sinsalName === '원진/육해') {
    const rels = 원진육해Map[monthJiji] || []; // [{target, tags}]
    const hit = rels.find(r => r.target === jiji);
    const isSajuMonthCell = (idx === 2 && jiji === monthJiji);
    if (isSajuMonthCell) return `<span style="color:red;">기준</span>`;
    return hit ? `${hit.tags?.[0] || ''}` : 'X';
  }

  if (sinsalName === '도화살') {
    const label = 도화살MAP[jiji];
    return label ? `${label}` : 'X';
  }

  if (sinsalName === '귀문살') {
    const rels = 귀문살MAP[jiji] || [];
    const hit = rels.find(r => extJijiArr.includes(r.target));
    return hit ? `${jiji}(${hit.tags?.[0] || ''})` : 'X';
  }

if (sinsalName === '격각살') {
  const rels = 격각살MAP[jiji] || [];
  const hits = rels.filter(r => extJijiArr.includes(r.target));
  return hits.length
    ? hits.map(h => `${jiji}${h.target}`).join(", ")  // "子寅, 子戌"
    : 'X';
}



  if (sinsalName === '합방/공방살') {
    const dayJiji = sajuJijiArr[1]; // 기준: 일지
    const gender = context.gender;
    const rels = 합방_공방살MAP[dayJiji] || [];
    const hits = rels.filter(r => r.gender === gender && jiji === r.target);
    if (idx === 1) return `<span style="color:red;">기준</span>`;
    return hits.length ? `${jiji}[${hits[0].tags?.[0] || ''}]` : 'X';
  }

if (sinsalName === '천덕/월덕') {
  if (!monthJiji) return 'X';
  const rels = 천덕_월덕MAP[monthJiji] || [];
  const hit = rels.find(r => r.target === jiji);

  // 기준 위치일 경우 → 매칭이 있으면 기준+값, 없으면 'X'
  if (idx === 2 && jiji === monthJiji) {
    return hit 
      ? `<span style="color:red;">기준</span> ${hit.target}[${hit.tags?.[0] || ''}]`
      : 'X';
  }

  return hit ? `${hit.target}[${hit.tags?.[0] || ''}]` : 'X';
}


  // 상문/조객살 (년지 기준)
  if (sinsalName === '상문/조객') {
    const yearJiji = sajuJijiArr[3]; // 기준: 년지
    if (!yearJiji) return 'X';
    const rels = 상문_조객MAP[yearJiji] || [];
    const hit = rels.find(r => r.target === jiji);
    if (idx === 3 && jiji === yearJiji) return `<span style="color:red;">기준</span>`;
    return hit ? `${hit.target}[${hit.tags?.[0] || ''}]` : 'X';
  }
//급각살
  if (sinsalName === '급각살') {
    const rels = 급각살MAP[monthJiji] || []; // [{target, tags}]
    const hit = rels.find(r => r.target === jiji);
    const isSajuMonthCell = (idx === 2 && jiji === monthJiji);
    if (isSajuMonthCell) return `<span style="color:red;">기준</span>`;
    return hit ? `${hit.target}[${hit.tags?.[0] || ''}]` : 'X';
  }
//천의성
  if (sinsalName === '천의성') {
    const rels = 천의성MAP[monthJiji] || []; // [{target, tags}]
    const hit = rels.find(r => r.target === jiji);
    const isSajuMonthCell = (idx === 2 && jiji === monthJiji);
    if (isSajuMonthCell) return `<span style="color:red;">기준</span>`;
    return hit ? `${hit.target}[${hit.tags?.[0] || ''}]` : 'X';
  }

//천라지망살
if (sinsalName === '천라지망') {
  const rels = 천라지망MAP[jiji] || [];
  const hit = rels.find(r => extJijiArr.includes(r.target));

  return hit 
    ? `${jiji}${hit.target}(${hit.tags?.[0] || ''})` 
    : 'X';
}

// 병부살 ///////////////////////////////////////////////
if (sinsalName === '병부살') {
  let results = [];

  // ① 년지 기준
  const yearIdx = 3; 
  const yearBase = extJijiArr[yearIdx];
  if (idx !== yearIdx) {   // 기준칸은 제외
    const baseIdx = branchOrder.indexOf(yearBase);
    const prev = branchOrder[(baseIdx - 1 + 12) % 12];
    if (jiji === prev) {
      results.push(`${jiji}(병부)<span style="color:red;">[년지기준]</span>`);
    }
  }

  // ② 대운지 기준
  const daeyunIdx = 4;
  if (extJijiArr[daeyunIdx] && idx !== daeyunIdx) {
    const baseIdx = branchOrder.indexOf(extJijiArr[daeyunIdx]);
    const prev = branchOrder[(baseIdx - 1 + 12) % 12];
    if (jiji === prev) {
      results.push(`${jiji}(병부)<span style="color:red;">[대운기준]</span>`);
    }
  }

  // ③ 세운지 기준
  const seunIdx = 5;
  if (extJijiArr[seunIdx] && idx !== seunIdx) {
    const baseIdx = branchOrder.indexOf(extJijiArr[seunIdx]);
    const prev = branchOrder[(baseIdx - 1 + 12) % 12];
    if (jiji === prev) {
      results.push(`${jiji}(병부)<span style="color:red;">[세운기준]</span>`);
    }
  }

  return results.length ? results.join(',') : 'X';
}



// 사부살 ///////////////////////////////////////////////
if (sinsalName === '사부살') {
  let results = [];

  // ① 년지 기준
  const yearIdx = 3;
  const yearBase = extJijiArr[yearIdx];
  if (idx !== yearIdx) {
    const baseIdx = branchOrder.indexOf(yearBase);
    const prev = branchOrder[(baseIdx - 1 + 12) % 12];
    const 충자 = 충MAP[prev];
    if (jiji === 충자) {
      results.push(`${jiji}(사부)<span style="color:red;">[년지기준]</span>`);
    }
  }

  // ② 대운지 기준
  const daeyunIdx = 4;
  if (extJijiArr[daeyunIdx] && idx !== daeyunIdx) {
    const baseIdx = branchOrder.indexOf(extJijiArr[daeyunIdx]);
    const prev = branchOrder[(baseIdx - 1 + 12) % 12];
    const 충자 = 충MAP[prev];
    if (jiji === 충자) {
      results.push(`${jiji}(사부)<span style="color:red;">[대운기준]</span>`);
    }
  }

  // ③ 세운지 기준
  const seunIdx = 5;
  if (extJijiArr[seunIdx] && idx !== seunIdx) {
    const baseIdx = branchOrder.indexOf(extJijiArr[seunIdx]);
    const prev = branchOrder[(baseIdx - 1 + 12) % 12];
    const 충자 = 충MAP[prev];
    if (jiji === 충자) {
      results.push(`${jiji}(사부)<span style="color:red;">[세운기준]</span>`);
    }
  }

  return results.length ? results.join(',') : 'X';
}

// 단교관살
if (sinsalName === '단교관살') {
  if (!monthJiji) return 'X';

  const rels = 단교관살MAP[monthJiji] || [];

  // 월지 칸 → 기준
  if (idx === 2 && jiji === monthJiji) {
    return `<span style="color:red;">기준</span>`;
  }

  // 일지, 시지 칸만 검사
  if (idx === 0 || idx === 1) {
    const hit = rels.find(r => r.target === jiji);
    return hit ? `${hit.target}[${hit.tags?.[0] || ''}]` : 'X';
  }

  // 그 외 (년, 대운, 세운 등)
  return 'X';
}


  const candidates = getSinsalForJiji(jiji, sinsalName, { monthJiji }) || [];
  const exists = candidates.some(t => extJijiArr.includes(t));
  return exists ? candidates.filter(t => extJijiArr.includes(t)).join(',') : 'X';
});


    // ========= 3) 간지 신살 (6칸) =========///////////////////////////////////////////////////////////////////////////////////
    // 기존: 사주간지 4칸만 → 변경: extGanjiArr(6칸) 기준으로 계산

    const ganjiResults = extGanjiArr.map((ganji, idx) => {
  if (sinsalName === '공망살') {
    const dayGan  = sajuGanArr?.[1];
    const dayJiji = sajuJijiArr?.[1];
    const r = getSinsalForGanji(ganji, '공망살', { dayGan, dayBranch: dayJiji });
    return r.length ? r[0] : 'X'; // r[0]에 "공망[辰,巳]" 같은 완성 문자열이 들어 있음
  }

// 음양차착살
if (sinsalName === '음양차착살') {
  // 현재 ganji가 extGanjiArr에서 몇 번째인지 찾음
  const idx = extGanjiArr.indexOf(ganji);

  // 월지(idx===2), 일지(idx===1) 칸은 제외
  if (idx === 3 || idx === 2) return 'X';

  return 음양차착살Map[ganji]
    ? `${ganji}(${음양차착살Map[ganji]})`
    : 'X';
}

// 고란살
  if (sinsalName === '고란살') {
    // 년주(idx===3), 월주(idx===2), 시주(idx===0) 제외
    const excluded = [0, 2, 3];
    if (excluded.includes(idx)) return 'X';

    return 고란살Map[ganji]
      ? `${ganji}(${고란살Map[ganji]})`
      : 'X';
  }
// 현침살
  if (sinsalName === '현침살') {
    const gan = (ganji || '').trim().charAt(0);
    const ji  = (ganji || '').trim().charAt(1);


    if (HYUNCHIM_SAL_MAP[gan] && HYUNCHIM_SAL_MAP[ji]) {
      return `${ganji}(현침살)`; 
    }
    return 'X';
  }

    // 십악대패살
  if (sinsalName === '십악대패살') {
    if (십악대패살MAP[ganji]) {
      return `${ganji}(십악대패살)`; 
    }
    return 'X';
  }


      const candidates = getSinsalForGanji(ganji, sinsalName) || [];
      const stripTag = s => s.replace(/\(.*\)/, '');
      const exists = candidates.some(gj => extGanjiArr.includes(stripTag(gj)));
      return exists
        ? candidates.filter(gj => extGanjiArr.includes(stripTag(gj))).join(',')
        : 'X';
    });



//////////////////////////////////////////////////////////////////////////////////끝//////////
  // 모두 X면 생략
const type = getSinsalType(sinsalName);

// 타입과 다른 구역은 전부 빈칸으로 마스킹 (X도 숨김)
const maskedGan   = (type === 'gan'   || type === 'mixed' || sinsalName === '천덕/월덕')
                    ? ganResults
                    : ganResults.map(() => '');

const maskedJiji  = (type === 'jiji'  || type === 'mixed' || sinsalName === '천덕/월덕')
                    ? jijiResults
                    : jijiResults.map(() => '');


const maskedGanji = (type === 'ganji' || (type === 'mixed' && sinsalName !== '천덕/월덕'))
                    ? ganjiResults
                    : ganjiResults.map(() => '');


// 모두 비거나 X면 행 생략 (빈칸도 생략 판정에 포함)
function shouldDeleteRow(cells) {
  const texts = cells.map(v => (v || '').replace(/<[^>]+>/g, '').trim());
  const allX = texts.every(txt => !txt || txt === 'X' || txt === '기준');
  const hasReal = texts.some(txt => txt && txt !== 'X' && txt !== '기준');
  return allX && !hasReal;
}

const allXGanJiji = [...maskedGan, ...maskedJiji].every(v => {
  const txt = (v || '').replace(/<[^>]+>/g, '').trim(); // 태그 제거
  return !txt || txt === 'X' || txt === '기준';
});
const allXGanji = maskedGanji.every(v => {
  const txt = (v || '').replace(/<[^>]+>/g, '').trim();
  return !txt || txt === 'X' || txt === '기준';
});

// ▼ 데이터 행 (천간+지지, 간지 따로 관리)
// ✅ 각 표별로 독립적으로 줄 삭제
const rowGan = shouldDeleteRow(maskedGan) ? '' : `
  <tr>
    <td>${sinsalName}</td>
    ${maskedGan.map(v => `<td>${v || ''}</td>`).join('')}
  </tr>
`;

const rowJiji = shouldDeleteRow(maskedJiji) ? '' : `
  <tr>
    <td>${sinsalName}</td>
    ${maskedJiji.map(v => `<td>${v || ''}</td>`).join('')}
  </tr>
`;

const rowGanji = shouldDeleteRow(maskedGanji) ? '' : `
  <tr>
    <td style="text-align:center;">${sinsalName}</td>
    ${maskedGanji.map(v => `<td>${v || ''}</td>`).join('')}
  </tr>
`;

// ✅ 둘 다 없으면 아예 삭제
//if (!rowGanJiji && !rowGanji) return null;

return { rowGan, rowJiji, rowGanji };
}).filter(Boolean);   // null 걸러짐


 // 기존: rowGanJiji, rowGanji
const sinsalRowsGan   = sinsalRows.map(r => r.rowGan).join('');
const sinsalRowsJiji  = sinsalRows.map(r => r.rowJiji).join('');
const sinsalRowsGanji = sinsalRows.map(r => r.rowGanji).join('');



  if (!sinsalRowsGan && !sinsalRowsJiji && !sinsalRowsGanji) {
  return `<table style="margin:auto; margin-top:10px;"><tr><td>해당 기타 신살 없음</td></tr></table>`;
}

// ▼ 표 A: 천간 + 지지
// ▼ 표 A1: 천간 전용
const tableA1 = `
<table border="1" class="responsive-table" style="text-align:center; border-collapse:collapse; margin:auto; margin-top:16px; font-size:14px; min-width:400px;">
<tr>
  <th style="background:#efefef;" rowspan="2">신살류</th>
  <th colspan="6" style="background:#cfebfd;">천간[사주+대운+세운]</th>
</tr>
<tr>
  <td style="background:#cfebfd;">시</td>
  <td style="background:#cfebfd;">일</td>
  <td style="background:#cfebfd;">월</td>
  <td style="background:#cfebfd;">년</td>
  <td style="background:#cfebfd;">대운</td>
  <td style="background:#cfebfd;">세운</td>
</tr>

<tr>
<td style="background:#efefef; color:red;">기준간지<br>(빨강색)</td>
  <!-- 천간칸: 천간만 빨강 -->
  ${extGanjiArr.map(gj => {
  const { stem, branch, ok } = splitGanjiSafe(gj);
  return ok
    ? `<td style="background:#cfebfd;"><span style="color:red;">${stem}</span><br>${branch}</td>`
    : `<td style="background:#efcffd;">-</td>`;
  }).join('')}
</tr>

${sinsalRowsGan} <!-- 천간 신살 전용 행 -->
</table>
`;

// ▼ 표 A2: 지지 전용
const tableA2 = `
<table border="1" class="responsive-table" style="text-align:center; border-collapse:collapse; margin:auto; margin-top:16px; font-size:14px; min-width:400px;">
<tr>
  <th style="background:#efefef;" rowspan="2">신살류</th>
  <th colspan="6" style="background:#efcffd;">지지[사주+대운+세운]</th>
</tr>
<tr>
  <td style="background:#efcffd;">시</td>
  <td style="background:#efcffd;">일</td>
  <td style="background:#efcffd;">월</td>
  <td style="background:#efcffd;">년</td>
  <td style="background:#efcffd;">대운</td>
  <td style="background:#efcffd;">세운</td>
</tr>

<tr>
<td style="background:#efefef; color:red;">기준간지<br>(빨강색)</td>
  <!-- 지지칸: 지지만 빨강 -->
  ${extGanjiArr.map(gj => {
  const { stem, branch, ok } = splitGanjiSafe(gj);
  return ok
    ? `<td style="background:#efcffd;">${stem}<br><span style="color:red;">${branch}</span></td>`
    : `<td style="background:#efcffd;">-</td>`;
  }).join('')}
</tr>

${sinsalRowsJiji} <!-- 지지 신살 전용 행 -->
</table>
`;

// ▼ 표 B: 간지(동주)
const tableB = `
<table border="1" class="responsive-table" style="text-align:center; border-collapse:collapse; margin:auto; margin-top:16px; font-size:14px; min-width:400px;">
<tr>
  <th style="background:#efefef;" rowspan="2">신살류</th>
  <th colspan="6" style="background:#fdebcf;">간지(동주)[사주+대운+세운]</th>
</tr>
<tr>
  <td style="background:#fdebcf;">시주</td>
  <td style="background:#fdebcf;">일주</td>
  <td style="background:#fdebcf;">월주</td>
  <td style="background:#fdebcf;">년주</td>
  <td style="background:#fdebcf;">대운</td>
  <td style="background:#fdebcf;">세운</td>
</tr>

<tr>
<td style="background:#efefef; color:red;">기준간지<br>(빨강색)</td>
  <!-- 간지칸: 천간+지지 모두 빨강 -->
  ${extGanjiArr.map(gj =>
  (() => {
    const { stem, branch, ok } = splitGanjiSafe(gj);
    return ok
      ? `<td style="background:#fdebcf;"><span style="color:red;">${stem}</span><br><span style="color:red;">${branch}</span></td>`
      : `<td style="background:#fdebcf;">-</td>`;
  })()
  ).join('')}
</tr>

${sinsalRowsGanji}
</table>
`;

 return `
 <div class="Etcsinsal-tables">
   <div class="table-scroll">${tableA1}</div>
   <div class="table-scroll">${tableA2}</div>
   <div class="table-scroll">${tableB}</div>
 </div>
 ` + `
<div class="note-box" style="text-align:center">
  ※ 일간,일지,일주 / 년간,년지,년주 / 대운,세운 칸의 셀들은 각각 노랑, 파랑, 초록 바탕색으로 구분하였음. <br>
  기본적으로 기준은 위의 표에서 [<span style="color:red;">빨강</span>]색으로 구분하였고, 특정 간지가 기준[<span style="color:red;">빨강색</span>]인 경우 해당칸에 따로 "기준"을 표기하였음.
</div>
`;




}

// 전역 등록 (중복 안전)
window.renderEtcSinsalTable = window.renderEtcSinsalTable || renderEtcSinsalTable;






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
  ///건록/암록/금여록
if (sinsalName === '건록/암록/금여록') {
    // ✅ 무(戊), 기(己)일 때는 건록/암록/금여록 제외
  if (gan === '戊' || gan === '己') {
    return 'X';
  }
  const rels = 건록_암록_금여록MAP[gan] || [];
  const hits = rels.filter(r => r.target === jiji); // 현재 칸 지지와 target 매칭

  return hits.length
    ? hits.map(h => `${jiji}(${h.tags?.[0] || ''})`).join(',')
    : 'X';
}
// 문창/학당
if (sinsalName === '문창/학당') {
  const rels = 문창_학당MAP[gan] || [];
  // 현재 칸의 지지(jiji)와 target 매칭
  const hits = rels.filter(r => r.target === jiji);

  return hits.length
    ? hits.map(h => `${jiji}[${h.tags?.[0] || ''}]`).join(',')
    : 'X';
}
// 양인/비인
if (sinsalName === '양인/비인') {
  const rels = 양인_비인MAP[gan] || [];
  // 현재 칸의 지지(jiji)와 target 매칭
  const hits = rels.filter(r => r.target === jiji);

  return hits.length
    ? hits.map(h => `${jiji}[${h.tags?.[0] || ''}]`).join(',')
    : 'X';
}

// 태극귀인
if (sinsalName === '태극귀인') {
  const rels = 태극귀인MAP[gan] || [];
  // 현재 칸의 지지(jiji)와 target 매칭
  const hits = rels.filter(r => r.target === jiji);

  return hits.length
    ? hits.map(h => `${jiji}[${h.tags?.[0] || ''}]`).join(',')
    : 'X';
}



  return [];
}



/////지지기준 신살류///////////
// 
// 
export function getSinsalForJiji(
  jiji,
  sinsalName,
  { monthJiji, yearJiji, seunJiji, daeyunJiji } = {}
) {
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
// 격각살
if (sinsalName === '격각살') {
  console.log(">>> [격각살 조건문 진입]", jiji, sinsalName);

  const rels = 격각살MAP[jiji] || [];
  console.log("rels:", rels.map(r => r.target));
  console.log("extJijiArr:", extJijiArr);

  const hits = rels.filter(r => extJijiArr.includes(r.target));
  console.log("hits:", hits.map(h => h.target));

  return hits.length 
    ? [`${jiji}(${hits.map(h => h.target).join("")})`] 
    : [];
}



if (sinsalName === '합방/공방살') {
  const gender = context?.gender; // context에서 성별 받기
  const rels = 합방_공방살MAP[jiji] || [];
  // 성별에 맞는 항목만 추출
  const hits = rels.filter(r => r.gender === gender);

  // 출력: target(태그) 형식
  return hits.length
    ? hits.map(r => `${r.target}(${r.tags?.[0] || ''})`)
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
// 상문/조객살 (년지 기준)
if (sinsalName === '상문/조객') {
  const yearJiji = sajuJijiArr[3]; // 기준: 년지 (인덱스 3)
  if (!yearJiji) return '';

  const rels = 상문_조객MAP[yearJiji] || [];

  // 사주 원국의 년지 칸일 경우 '기준' 표기 (빨간색)
  const isSajuYearCell = (idx === 3 && jiji === yearJiji);
  if (isSajuYearCell) return `<span style="color:red;">기준</span>`;


  const hit = rels.find(r => r.target === jiji);
  return hit ? `${hit.target}[${hit.tags?.[0] || ''}]` : '';
}

  //급각살
    if (sinsalName === '급각살') {
    if (!monthJiji) return []; // 안전망
    // 월지를 기준으로 target만 추출 → 문자열 배열
    return (급각살MAP[monthJiji] || []).map(item =>
      typeof item === 'string' ? item : item.target
    );
  }
  //천의성
    if (sinsalName === '천의성') {
    if (!monthJiji) return []; // 안전망
    // 월지를 기준으로 target만 추출 → 문자열 배열
    return (천의성MAP[monthJiji] || []).map(item =>
      typeof item === 'string' ? item : item.target
    );
  }

      //천라지망
    if (sinsalName === '천라지망') {
    return 천라지망MAP[jiji] ? [`${jiji}(${천라지망MAP[jiji]})`] : [];
  }

 // 병부살 (년지, 세운지, 대운 기준)
  if (sinsalName === '병부살') {
    const 기준지지들 = [yearJiji, seunJiji, daeyunJiji].filter(Boolean);

    for (const 기준 of 기준지지들) {
      const 기준Idx = branchOrder.indexOf(기준);
      if (기준Idx === -1) continue;

      const prev = branchOrder[(기준Idx + 11) % 12]; // 이전 글자
      if (prev === jiji) return [`${jiji}(병부살)`];
    }
    return [];
  }

  // 사부살 (병부살의 충 글자)
  if (sinsalName === '사부살') {
    const 기준지지들 = [yearJiji, seunJiji, daeyunJiji].filter(Boolean);

    for (const 기준 of 기준지지들) {
      const 기준Idx = branchOrder.indexOf(기준);
      if (기준Idx === -1) continue;

      const prev = branchOrder[(기준Idx + 11) % 12];
      const 충자 = 충MAP[prev];
      if (충자 === jiji) return [`${jiji}(사부살)`];
    }
    return [];
  }

//단교관살
if (sinsalName === '단교관살') {
  if (!monthJiji) return '';
  const rels = 단교관살MAP[monthJiji] || [];
  const currentValue = jiji; // gan 참조 제거
  const hit = rels.find(r => r.target === currentValue);
  return hit ? `${hit.target}[${hit.tags?.[0] || ''}]` : '';
}

  //// 기타 신살은 빈 배열 반환
  return [];
}


/////간지기준 신살류///////////////////////////////////////////////////////////

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
    return [`공망(${voidBranches.join(',')})`];
  }
  return [];
}

  //음양차착살
  if (sinsalName === '음양차착살') {
    // 간여지동에 해당하면 "간지(불통살)" 형태로 반환
    return 음양차착살Map[ganji] ? [`${ganji}(${음양차착살Map[ganji]})`] : [];
  }
  //고란살
  if (sinsalName === '고란살') {
    // 간여지동에 해당하면 "간지(불통살)" 형태로 반환
    return 고란살Map[ganji] ? [`${ganji}(${고란살Map[ganji]})`] : [];
  }

  // ✅ 현침살 전용
  if (sinsalName === '현침살') {

    if (HYUNCHIM_SAL_MAP[gan] && HYUNCHIM_SAL_MAP[ji]) {
      return [`${ganji}(현침살)`];   // ✅ 간지와 함께 출력
    }
    return []; // 없으면 빈 배열
  }
//십악대패살
  if (십악대패살MAP[ganji]) {
    return [`${ganji}(십악대패살)`]; // 배열로 반환 (다른 신살 추출 함수 스타일과 통일)
  }
  return [];

    return [];
  }

