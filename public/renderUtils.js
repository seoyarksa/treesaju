// renderUtils.js
//함수종류
//renderDaeyunTable, renderDaeyunTable, highlightCurrentDaeyunByAge, renderYearlyGanjiSeries,
//renderMonthlyGanjiSeries, handleDaeyunClick, elementColors, renderTodaySajuBox, renderDangryeong
//attachSewoonClickListeners, 



import { 
        DANGRYEONGSHIK_MAP,
        HanhiddenStemsMap,
         jijiToSibganMap,
         firstHeesinMap, 
         HEESIN_GISIN_COMBINED, 
         HEESIN_BY_DANGRYEONG_POSITION, 
         GISIN_BY_DANGRYEONG_POSITION,
         tenGodMap,jijiToSibganMap2,
         tenGodMapKor,branchOrder2, 충MAP, 지지십간MAP, 형충회합Map,
      } from './constants.js';

import {
  convertKorToHanStem,
  convertKorToHanBranch,
  convertHanToKorStem,
  normalizeBranch,
  getCurrentDaeyunIndexFromStartAge,
  isYangStem,
  hiddenStemsMap,
  getDaYunDirection,
  generateDaYunStems,
  getTenGod,
  colorize,
  splitGanji,
  getThreeLinesFromArray,
  generateDaYun,
  getGanjiByYear,
getDangryeong,
  generateYearlyGanjiSeries2, generateYearlyGanjiSeriesFixed,
  generateDaeyunBy60Gapja,
  getStartMonthBySewoonStem,
  calculateSewonYear,
  findStartMonthIndex,
  generateMonthlyGanjiSeriesByGanji,
  getdangryeongshik,
  getSaryeongshikHtml,renderJohuCell,
  getDangryeongCheongans,
  extractCheonganHeesinGisin, extractJijiHeesinGisin, makeSajuInfoTable, updateSimpleTable, renderSimpleTable, 
} from './sajuUtils.js';


import { renderhapshinTable
        
      } from './gyeokUtils.js';



const stemOrder = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const branchOrder = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
// isYangStem, getDaYunDirection, generateDaYunStems, getTenGod, colorize, splitGanji, 
// getThreeLinesFromArray, generateDaYun, getGanjiByYear, generateYearlyGanjiSeries, 
// generateYearlyGanjiSeries2, generateDaeyunBy60Gapja, getStartMonthBySewoonStem, 
// calculateSewonYear, findStartMonthIndex, generateMonthlyGanjiSeriesByGanji, 
// dateUtils.js에서 필요한 함수 import
//import { getCurrentDaeyunIndexFromStartAge } from './utils/dateUtils.js';

// 오행 색상
export const elementColors = {
  '甲': 'green', '乙': 'green', '寅': 'green', '卯': 'green',
  '丙': 'red', '丁': 'red', '巳': 'red', '午': 'red',
  '戊': 'orange', '己': 'orange', '辰': 'orange', '戌': 'orange', '丑': 'orange', '未': 'orange',
  '庚': 'gray', '辛': 'gray', '申': 'gray', '酉': 'gray',
  '壬': 'blue', '癸': 'blue', '子': 'blue', '亥': 'blue'
};











// 전역 saju → 배열 변환 (시/일/월/년)
// ── 응급 핫픽스: 신살표 즉시 갱신 안전 호출 (전역 saju 사용)
window.getSajuArrays ||= function getSajuArrays() {
  const s = window.saju || {};
  const sajuGanArr   = [s.hourGan, s.dayGan, s.monthGan, s.yearGan].map(v => v || '');
  const sajuJijiArr  = [s.hourBranch, s.dayBranch, s.monthBranch, s.yearBranch].map(v => v || '');
  const sajuGanjiArr = sajuGanArr.map((g,i)=> (g && sajuJijiArr[i]) ? g + sajuJijiArr[i] : '');
  return { sajuGanArr, sajuJijiArr, sajuGanjiArr };
};

window.renderSinsalNow ||= function renderSinsalNow(extraCtx = {}) {
  
  try {
    const renderer = globalThis.renderEtcSinsalTable;        // 전역 등록된 렌더러
    if (typeof renderer !== 'function') {
      console.warn('[renderSinsalNow] renderEtcSinsalTable 미로딩');
      return;
    }
    const { sajuGanArr, sajuJijiArr, sajuGanjiArr } = window.getSajuArrays();

    // 사주 4칸이 비면 그리기 보류 (대운/세운만 뜨는 현상 방지)
    if (!sajuGanArr.every(Boolean) || !sajuJijiArr.every(Boolean)) {
      console.warn('[renderSinsalNow] 사주 4칸 미완성 → 렌더 보류');
      return;
  
    }

    const html = renderer({
      sajuGanArr,
      sajuJijiArr,
      sajuGanjiArr,
      context: {
        daeyun: window.selectedDaewoon || null,
        sewoon: window.selectedSewoon  || null,
        gender: window.gender,
        ...extraCtx,
      }
    });

    const box = document.querySelector('#etc-sinsal-box');
if (!box) {
  console.warn('[renderSinsalNow] 컨테이너 #etc-sinsal-box 없음');
  return;
}
box.innerHTML = html;

  } catch (e) {
    console.warn('[renderSinsalNow] 실패:', e);
  }
};



//사주출력쪽 대운테이블
// ✅ 사주편 전용 대운 테이블 렌더링
// ✅ 사주편 전용 대운 테이블 렌더링
// ✅ 사주편 전용 대운+세운 한 줄 테이블
// ✅ 사주편 전용: 기존 데이터(window.daeyunPairs 등) 공유 안 함
export function renderBasicDaeyunTable({
  daeyunAge,        // 대운수 (예: 5.02 → 시작 나이 5세)
  birthYear,
  birthMonth,
  birthDay,
  wolju = { stem: null, branch: null }, // 기존 유지
  direction,        // 1=순행, -1=역행
  dayStem = null    // 일간 천간 (옵션)
}) {
  const container = document.getElementById('basic-daeyun-table');
  if (!container) return;

  // 대운 시작 나이 (정수)
  const startAge = Math.floor(daeyunAge);

  // 나이 배열: 월주 + 9개 대운 → 총 10칸 → 거꾸로
  const ages = ["월주", ...Array.from({ length: 9 }, (_, i) => startAge + i * 10)].reverse();

  // ✅ 대운 방향 로그
  const isForward = direction === 1;
  console.log("▶ renderBasicDaeyunTable 대운방향:", direction, "→", isForward ? "순행" : "역행");

  // ✅ 간지 배열: direction 반영
  const ganjiSeries = generateDaeyunGanjiSeries(wolju, 10, isForward);
  const ganjiReversed = ganjiSeries.slice().reverse();

  console.log("▶ 생성된 대운 간지 (계산):", ganjiSeries.map(x => x.stem + x.branch).join(","));
  console.log("▶ 출력용 대운 간지 (역순):", ganjiReversed.map(x => x.stem + x.branch).join(","));

  // ② 세운 간지 10개
  const baseYear = birthYear + startAge;
  const yearlyGanjiSeries = generateYearlyGanjiSeriesFixed(baseYear);
  const sewoonReversed = yearlyGanjiSeries.slice().reverse();

  // ✅ 십성 기준: 일간 (dayStem → window.saju.ilgan → window.ilgan)
  let tenGodBaseStem = dayStem 
                    ?? window?.saju?.ilgan?.stem 
                    ?? window?.saju?.ilgan 
                    ?? window?.ilgan?.stem 
                    ?? window?.ilgan 
                    ?? null;

  // 객체 형태일 경우 stem 추출
  if (tenGodBaseStem && typeof tenGodBaseStem === "object" && "stem" in tenGodBaseStem) {
    tenGodBaseStem = tenGodBaseStem.stem;
  }

  if (!tenGodBaseStem) {
    console.warn("⚠️ 일간(dayStem)을 찾을 수 없습니다. (window.saju.ilgan 또는 window.ilgan 확인 필요)");
  } else {
    console.log("✔ 십성 기준 일간:", tenGodBaseStem);
  }

  container.innerHTML = `
    <table class="basic-daeyun-table">
      <thead>
        <tr>
          <th colspan="10">대운수: ${daeyunAge.toFixed(2)}</th>
          <th colspan="10">세운시작년도: ${window.sewonYear}</th>
        </tr>
        <tr>
          ${ages.map(age => `<th>${age}</th>`).join('')}
          ${sewoonReversed.map(({ year }) => `<th>${year}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <tr class="daeyun-row">
          ${ganjiReversed.map(({ stem, branch }, idx) => {
            const tenGod = tenGodBaseStem ? getTenGod(tenGodBaseStem, stem) : "";
            return `
   <td onclick="handleBasicDaeyunClick(${idx}, '${stem}', '${branch}')"
       class="daeyun-cell"
       data-stem="${stem}"
       data-branch="${branch}">
                <div>${colorize(stem)}</div>
                ${tenGod ? `<div style="font-size:0.75rem; color:#999;">(${tenGod})</div>` : ""}
                <div>${colorize(branch)}</div>
              </td>
            `;
          }).join('')}
        </tr>
        <tr>
  <td colspan="20" style="border:1px solid #ccc; padding:4px; color:red;" >
 * 대운이나 세운을 클릭하면 해당 대운&세운의 작용을 확인할 수 있습니다. 
</td>
</tr>
      </tbody>
    </table>
  `;
}




// 월주 간지를 시작점으로 대운 간지 10개를 생성하는 함수
function generateDaeyunGanjiSeries(wolju, count, isForward) {
  const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const branches = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

  let stemIndex = stems.indexOf(wolju.stem);
  let branchIndex = branches.indexOf(wolju.branch);

  if (stemIndex === -1 || branchIndex === -1) {
    console.error("⚠️ 올바르지 않은 월주 입력:", wolju);
    return [];
  }

  console.log("▶ generateDaeyunGanjiSeries 호출");
  console.log("  입력 wolju =", wolju, "count =", count, "isForward =", isForward);

  const result = [];

  for (let i = 0; i < count; i++) {
    if (isForward) {
      // ✅ 순행: 앞으로 진행
      result.push({
        stem: stems[(stemIndex + i) % 10],
        branch: branches[(branchIndex + i) % 12],
      });
    } else {
      // ✅ 역행: 뒤로 진행
      result.push({
        stem: stems[(stemIndex - i + 10) % 10],
        branch: branches[(branchIndex - i + 12) % 12],
      });
    }
  }

  console.log("▶ 최종 result =", result.map(x => x.stem + x.branch).join(","));
  return result;
}






// 대운 클릭 → 세운 갱신
// ✅ 대운 클릭 시 실행
// ✅ 대운 클릭 시 실행
export function handleBasicDaeyunClick(idx, stem, branch) {
  const startAge = Math.floor(window.daeyunAge);
  const birthYear = window.birthYear;

  // 역순 보정
  const trueIndex = 9 - idx; // 총 10개
  const baseYear = (birthYear + startAge - 10) + trueIndex * 10;

  console.log("✅ 대운 클릭:", { idx, trueIndex, baseYear, stem, branch });

  // === 세운 시작년도 갱신 ===
  const sewonStart = window.sewonYear + (trueIndex * 10) - 10;
  const displayDate2 = convertYearFractionToDate(sewonStart);
  console.log("displayDate2 =", displayDate2);

  // 헤더 제목 갱신
  const headerTitleRow = document.querySelector("#basic-daeyun-table thead tr:first-child");
  if (headerTitleRow) {
    const ths = headerTitleRow.querySelectorAll("th");
    if (ths[1]) ths[1].textContent = `세운시작일: ${displayDate2}(오차범위1일내)`;
  }

  // ✅ 세운 10년치 (역순으로 뒤집음)
  const sewoonReversed = generateYearlyGanjiSeriesFixed(sewonStart).slice().reverse();
  console.log("📌 세운 시작년도:", sewonStart);
  console.log("📌 세운 배열:", sewoonReversed.map(x => x.year).join(","));

  // 헤더(년도) 갱신
  const headerRow = document.querySelector("#basic-daeyun-table thead tr:nth-child(2)");
  if (headerRow) {
    const ths = headerRow.querySelectorAll("th");
    sewoonReversed.forEach(({ year }, i) => {
      if (ths[10 + i]) ths[10 + i].textContent = year;
    });
  }

  // === 모든 대운 셀에서 selected 제거 ===
  document.querySelectorAll('#basic-daeyun-table .daeyun-cell')
    .forEach(td => td.classList.remove('selected'));

  // === 클릭한 대운 셀만 selected 추가 ===
  const daeyunCells = document.querySelectorAll('#basic-daeyun-table .daeyun-cell');
  if (daeyunCells[idx]) {
    daeyunCells[idx].classList.add("selected");
  }

  // === 대운 선택 전역 저장 ===
  window.selectedDaewoon = { stem, branch };
  console.log("▶ 선택된 대운:", window.selectedDaewoon);

  // === 기존 세운값 리셋 ===
  window.selectedSewoon = null;
  console.log("⏹ 세운 리셋 완료");

  // 리스트 갱신
  const lists = getAllCompareLists(window.saju);
  console.log("▶ 대운 선택 후 리스트:", lists);

  // === 세운 셀 갱신 ===
  updateBasicSewoonCells(sewoonReversed);



}



// ✅ 세운 셀 생성 및 클릭 이벤트 바인딩
// ✅ 세운 셀 생성 및 클릭 이벤트 바인딩
function updateBasicSewoonCells(sewoonReversed) {
  const daeyunRow = document.querySelector("#basic-daeyun-table .daeyun-row");
  if (!daeyunRow) return;

  // 기존 세운 셀 삭제
  while (daeyunRow.children.length > 10) {
    daeyunRow.removeChild(daeyunRow.lastChild);
  }

  // ✅ 일간 기준 십성 기준값 탐색
  let tenGodBaseStem =
    window?.saju?.ilgan?.stem ??
    window?.saju?.ilgan ??
    window?.ilgan?.stem ??
    window?.ilgan ??
    null;

  if (tenGodBaseStem && typeof tenGodBaseStem === "object" && "stem" in tenGodBaseStem) {
    tenGodBaseStem = tenGodBaseStem.stem;
  }

  if (!tenGodBaseStem) {
    console.warn("⚠️ updateBasicSewoonCells: 일간(tenGodBaseStem)을 찾을 수 없습니다. 십성 표시 생략.");
  } else {
    console.log("✔ updateBasicSewoonCells: 십성 기준 일간 =", tenGodBaseStem);
  }

  // 새로운 세운 셀 추가
  // 새로운 세운 셀 추가
  const sewoonCells = [];
sewoonReversed.forEach(({ stem, branch, year }) => {
  const tenGod = tenGodBaseStem ? getTenGod(tenGodBaseStem, stem) : "";

  const td = document.createElement("td");
  td.classList.add("sewoon-cell");

  // ★ dataset 확실히 세팅
  td.dataset.year   = String(year);
  td.dataset.stem   = String(stem);
  td.dataset.branch = String(branch);

  td.style.textAlign = "center";
  td.style.verticalAlign = "middle";

  td.innerHTML = `
    <div>${colorize(stem)}</div>
    ${tenGod ? `<div style="font-size:0.75rem; color:#999;">(${tenGod})</div>` : ""}
    <div>${colorize(branch)}</div>
  `;

  td.addEventListener("click", () => basicSewoonClick(td, stem, branch, year));
  daeyunRow.appendChild(td);
  sewoonCells.push(td);
});

// 나머지 UI 갱신
document.querySelector("#dangryeong-cell").innerHTML = makeSajuInfoTable();
renderDangryeongHeesinGisin();
document.querySelector("#johuyongsin-cell").innerHTML = renderJohuCell();
document.querySelector("#hapshin-box").innerHTML = renderhapshinTable();

// ✅ selectedSewoon 초기화
if (!window.selectedSewoon && window.sewoonList?.length > 0) {
  window.selectedSewoon = window.sewoonList[0];
}

// simpleTable 렌더링
updateSimpleTable();

 window.renderSinsalNow?.();      // 기타 신살
window.updateUnseongBlock?.();  
}






// ✅ 세운 클릭 시 실행
// ✅ 세운 클릭 시 실행
export function basicSewoonClick(td, stem, branch, year) {
  console.log("✅ 세운 클릭:", { stem, branch, year });

  // 세운 선택 전역 저장
  window.selectedSewoon = { type: "sewoon", stem, branch, year };
  console.log("▶ 선택된 세운:", window.selectedSewoon);

  // 리스트 갱신
  const lists = getAllCompareLists(window.saju);
  console.log("▶ 세운 선택 후 리스트:", lists);

  // 기존 세운 강조 제거
  document.querySelectorAll('#basic-daeyun-table .sewoon-cell')
    .forEach(x => x.classList.remove("selected"));

  // 현재 클릭한 세운 강조
  td.classList.add("selected");

document.querySelector("#dangryeong-cell").innerHTML =
  makeSajuInfoTable();
renderDangryeongHeesinGisin();

document.querySelector("#johuyongsin-cell").innerHTML = renderJohuCell();

document.querySelector("#hapshin-box").innerHTML = renderhapshinTable();
// simpleTable 렌더링
// ✅ 여기서 바로 selectedSewoon 초기화 보정
if (!window.selectedSewoon && window.sewoonList?.length > 0) {
  window.selectedSewoon = window.sewoonList[0];
}

  updateSimpleTable();


   // 신살표 즉시 갱신 (대운/세운 클릭 이후 공용)
window.renderSinsalNow();
window.updateUnseongBlock?.();  
}



// 날짜 → 소숫점 연도로 변환
function toDecimalYear(year, month, day) {
  const date = new Date(year, month - 1, day);
  const start = new Date(year, 0, 1);
  const next = new Date(year + 1, 0, 1);
  const yearLength = (next - start) / (1000 * 60 * 60 * 24); // 해당 연도 일수 (윤년 포함)
  const dayOfYear = (date - start) / (1000 * 60 * 60 * 24);
  return year + (dayOfYear / yearLength);
}


// ✅ 초기 대운 자동 선택
export function highlightInitialDaeyun() {
  const startAge = Math.floor(window.daeyunAge);

  const birthDecimal = toDecimalYear(window.birthYear, window.birthMonth, window.birthDay);
  const now = new Date();
  const todayDecimal = toDecimalYear(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const currentDecimalAge = todayDecimal - birthDecimal;

  let daeyunIndex = Math.ceil((currentDecimalAge - startAge) / 10);
  if (daeyunIndex < 0) daeyunIndex = 0;
  if (daeyunIndex > 9) daeyunIndex = 9;

  const displayIndex = 9 - daeyunIndex;

  const daeyunCells = document.querySelectorAll('#basic-daeyun-table .daeyun-cell');
  console.log("📌 대운 셀 개수:", daeyunCells.length, "선택 index:", displayIndex);

  if (daeyunCells[displayIndex]) {
    const cell = daeyunCells[displayIndex];
    const ganjiText = cell.innerText.trim().split("\n");

    // ✅ 전역 등록
    window.selectedDaewoon = {
      type: "daewoon",
      stem: ganjiText[0] || cell.getAttribute("data-stem") || "",
      sibshin: (ganjiText[1] || "").replace(/[()]/g, ""),
      branch: ganjiText[2] || cell.getAttribute("data-branch") || ""
    };
    console.log("▶ 자동 선택된 대운:", window.selectedDaewoon);

    // ✅ 클릭 이벤트로 연동
    cell.click();
    setTimeout(() => {
  window.renderSinsalNow?.();
 window.updateUnseongBlock?.();  
}, 0);
  } else {
    console.warn("⚠️ highlightInitialDaeyun: 표시할 셀 없음", displayIndex);
  }
}


// ✅ 초기 세운 자동 선택
export function highlightInitialSewoon() {
  const currentYear = new Date().getFullYear();
  const sewoonCells = document.querySelectorAll('#basic-daeyun-table .sewoon-cell');
  let foundCell = null;

  sewoonCells.forEach(cell => {
    const yearAttr = parseFloat(cell.getAttribute("data-year"));
    const yearInt = Math.floor(yearAttr);
    if (yearInt === currentYear) {
      foundCell = cell;
    }
  });

  if (foundCell) {
    // 1) 하이라이트 처리
    sewoonCells.forEach(x => x.classList.remove("selected"));
    foundCell.classList.add("selected");

    const ganjiText = foundCell.innerText.trim().split("\n");

    // ✅ 전역 등록
    window.selectedSewoon = {
      type: "sewoon",
      year: foundCell.getAttribute("data-year") || "",
      stem: ganjiText[0] || "",
      sibshin: (ganjiText[1] || "").replace(/[()]/g, ""),
      branch: ganjiText[2] || ""
    };
    console.log("▶ 자동 선택된 세운:", window.selectedSewoon);

    // ✅ 클릭 이벤트로 연동 (대운과 동일하게)
    foundCell.click();
  } else {
    console.warn("⚠️ 현재 연도 세운셀을 찾지 못했습니다.");
  }
}




































//대운 테이블 렌더링 함수
export function renderDaeyunTable({ daeyunAge, ageLabels, pairsToRender, birthYear, birthMonth, birthDay, sewonYear }) {
  const container = document.querySelector('.daeyun-table-container');
  if (!container) return;

  //console.log('✅ renderDaeyunTable: 전달된 sewonYear =', sewonYear);

  // sewonYear가 숫자면 그대로, 문자열이면 parseFloat로 변환, 아니면 NaN 처리
  const baseSewonYear = typeof sewonYear === 'number'
    ? sewonYear
    : (typeof sewonYear === 'string' ? parseFloat(sewonYear) : NaN);

  let html = `
    <table class="daeyun-table">
      <thead>
 <thead>
  <tr><th colspan="10">대운수: ${daeyunAge.toFixed(2)}</th></tr>
</thead>
<tbody>
<tr>
  ${ageLabels.map(age => {
    // 문자열(월주)이면 그대로 출력
    if (isNaN(Number(age))) {
      return `<td style="font-size:0.85rem; color:#666;">${age}</td>`;
    }
    // 숫자 문자열이든 숫자든 무조건 정수로
    const intAge = Math.floor(Number(age));
    return `<td style="font-size:0.85rem; color:#999;">${intAge}</td>`;
  }).join('')}
</tr>






        <tr>
          ${pairsToRender.slice().reverse().map((pair, i) => {

            const { stem, branch } = pair;
            const stemHan = convertKorToHanStem(stem);
            const branchHan = convertKorToHanBranch(branch);

            const tenGodStem = getTenGod(window.dayGanKorGan, stem);

// ✅ 지장간 얻기 (기존 구조 유지 + 한글→한자 변환)
// 지장간은 한글 기반
const hiddenStems = hiddenStemsMap[branch] || [];
let targetStemKor = '';
if (hiddenStems.length === 3) targetStemKor = hiddenStems[2];
else if (hiddenStems.length === 2) targetStemKor = hiddenStems[1];

// 💡 한글 → 한자로 변환
const targetStemHan = convertKorToHanStem(targetStemKor);

// ⛳️ getTenGod 호출 (한자-한자)
const tenGodBranch = targetStemKor ? getTenGod(window.dayGanKorGan, targetStemHan) : '';


            // baseSewonYear가 숫자면 i를 더해 소숫점 1자리까지 표시
            const sewon = !isNaN(baseSewonYear) ? (baseSewonYear + i).toFixed(2) : '';

            //console.log(`세운 (${i}):`, sewon);

            return `
              <td data-index="${i}" onclick="handleDaeyunClick(${birthYear}, ${birthMonth}, ${birthDay}, ${i})">
                <div class="daeyun-cell">
                  <div>${colorize(stemHan, '1.1rem')}</div>
                  <div style="font-size:0.75rem; color:#999;">(${tenGodStem})</div>
                  <div>${colorize(branchHan, '1.1rem')}</div>
                  ${tenGodBranch ? `<div style="font-size:0.75rem; color:#999;">(${tenGodBranch})</div>` : ''}
                  
                </div>
              </td>
            `;
          }).join('')}
        </tr>
        <tr id="yearly-series-row">
          ${Array(10).fill('<td style="height:100px; vertical-align:top;"></td>').join('')}
        </tr>
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}


//하이라이트 대운셀
// 대운 하이라이트(충돌 방지·안전 버전)
// 대운 하이라이트(충돌 방지·안전 버전) - td 기준
export function highlightCurrentDaeyunByAge(correctedStartAge, birthDateYMD, opts = {}) {
  const {
    container = document,
    clsSelected = 'daeyun-selected'
  } = opts;

  const originalIndex = getCurrentDaeyunIndexFromStartAge(correctedStartAge, birthDateYMD);
  if (!Number.isInteger(originalIndex) || originalIndex < 0) {
    //console.warn('[daeyun] invalid originalIndex:', originalIndex);
    return -1;
  }

  const tableRoot = container.querySelector('.daeyun-table-container');
  if (!tableRoot) {
    //console.warn('[daeyun] .daeyun-table-container not found.');
    return -1;
  }

  const tds = tableRoot.querySelectorAll('.daeyun-table tbody tr:nth-child(2) td'); // 대운 줄 td
  if (!tds.length) {
    //console.warn('[daeyun] daeyun tds not found. Make sure to call after rendering.');
    return -1;
  }

  // ---- 최소 로그: 하이라이트만 확인 ----
  const logSelected = (label) => {
    const arr = Array.from(tds);
    const tdIdx  = arr.findIndex(td => td.classList.contains(clsSelected));
    const cellIdx = arr.findIndex(td => td.querySelector('.daeyun-cell')?.classList.contains(clsSelected));
    //console.log(`[daeyun] ${label} selected -> td:${tdIdx} / .daeyun-cell:${cellIdx}`);
    const el = tdIdx > -1 ? arr[tdIdx] : (cellIdx > -1 ? arr[cellIdx].querySelector('.daeyun-cell') : null);
    if (el) {
      const cs = getComputedStyle(el);
     // console.log('[daeyun] computed:', { background: cs.backgroundColor, outline: cs.outline, border: cs.border });
    }
  };
  // -----------------------------------

  // 화면은 역순(뒤집어 렌더) → 보정
  let indexToSelect = tds.length - 1 - originalIndex;

  // 범위 보정
  if (indexToSelect < 0 || indexToSelect >= tds.length) {
    if (originalIndex >= 0 && originalIndex < tds.length) indexToSelect = originalIndex;
    else indexToSelect = Math.max(0, Math.min(tds.length - 1, indexToSelect));
  }

 //console.log('[daeyun] before-toggle:', { originalIndex, indexToSelect, tdsLen: tds.length });
  logSelected('before HIGHLIGHT');

  // 바인딩 & 초기 표시
  tds.forEach((td, idx) => {
    if (!td.dataset.boundDaeyunClick) {
      td.addEventListener('click', () => {
        tds.forEach(x => x.classList.remove(clsSelected));
        td.classList.add(clsSelected);
        window.currentDaeyunIndex = tds.length - 1 - idx;
        logSelected('after CLICK'); // ← 클릭 후 선택 상태만 찍음
      }, false);
      td.dataset.boundDaeyunClick = '1';
    }
    td.classList.toggle(clsSelected, idx === indexToSelect);
  });

  logSelected('after HIGHLIGHT');

  // 내부 상태 일치
  window.currentDaeyunIndex = tds.length - 1 - indexToSelect;

  const target = tds[indexToSelect];
  if (target) {
   
    target.dispatchEvent(new Event('click', { bubbles: true }));
  }

  return indexToSelect;
}


// ✅ 함수 밖 (같은 파일 상단 쯤에 두면 좋아요)
function convertYearFractionToDate(yearFraction) {
  const year = Math.floor(yearFraction);
  const fraction = yearFraction - year;
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInYear = isLeap ? 366 : 365;

  const dayOfYear = Math.round(fraction * daysInYear);
  const date = new Date(year, 0);
  date.setDate(dayOfYear);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}.${mm}.${dd}`;
}
//세운 테이블 렌더링 함수
export function renderYearlyGanjiSeries(baseYear, stems, branches) {
  const daeyunTable = document.querySelector('.daeyun-table tbody');
  if (!daeyunTable) return;

  // 기존 세운 관련 행 제거
  const existingTitleRow = document.getElementById('yearly-title-row');
  const existingDataRow = document.getElementById('yearly-series-row');
  if (existingTitleRow) existingTitleRow.remove();
  if (existingDataRow) existingDataRow.remove();

  // 🎯 세운 제목 행 생성
  const titleRow = document.createElement('tr');
  titleRow.id = 'yearly-title-row';

    // 🎯 날짜 변환 사용
  const displayDate = convertYearFractionToDate(baseYear);
  titleRow.innerHTML = `<th colspan="10">세운시작년도: ${baseYear.toFixed(2)} (대략${displayDate})</th>`;

  daeyunTable.appendChild(titleRow);

  // 🎯 세운 데이터 행 생성
  const dataRow = document.createElement('tr');
  dataRow.id = 'yearly-series-row';

 for (let i = 9; i >= 0; i--) {
    const stemKor = stems[i];
    const branchKor = branches[i];

    const stemHan = convertKorToHanStem(stemKor);
    const branchHan = convertKorToHanBranch(branchKor);

    // 🌟 천간 육신
    const tenGodStem = getTenGod(window.dayGanKorGan, stemKor);

    // 🌟 지지의 지장간에서 육신용 천간 선택
   // branchKor: 현재는 한자 (예: '丑')




// branchKor: 한자 지지 (예: '酉')
// dayGanKorGan: 일간 한글 (예: '신')

const dayStemHan = convertKorToHanStem(window.dayGanKorGan); // 일간 한글 → 한자

// 지장간(천간) 배열: 한자 키로 HanhiddenStemsMap 접근
const hiddenStems = HanhiddenStemsMap[branchKor] || [];

let targetStemHan = '';
if (hiddenStems.length === 3) {
  targetStemHan = hiddenStems[2]; // 하단 천간(한자)
} else if (hiddenStems.length === 2) {
  targetStemHan = hiddenStems[1]; // 중간 천간(한자)
}

// 십신 계산: 일간 한자, 지장간 한자 사용
const tenGodBranch = targetStemHan ? getTenGod(dayStemHan, targetStemHan) : '';




    // 🎯 출력 HTML 구성
const year = (baseYear + i);
const yearDisplay = Math.floor(year);  // 정수 부분만
const yearFull = year.toFixed(2);      // 전체값 (툴팁)

dataRow.innerHTML += `
  <td class="sewoon-cell" data-index="${i}" data-year="${yearFull}" data-stem="${stemKor}" data-branch="${branchKor}">
    <div style="font-size:0.75rem; color:#999;" title="${yearFull}">${yearDisplay}</div>
    <div style="font-size:0.75rem;">${colorize(stemHan)}</div>
    <div style="font-size:0.65rem; color:#999;">(${tenGodStem})</div>
    <div style="font-size:0.75rem;">${colorize(branchHan)}</div>
    ${tenGodBranch ? `<div style="font-size:0.65rem; color:#999;">(${tenGodBranch})</div>` : ''}
  </td>`;


  }

  // 🎯 세운 데이터 행 삽입
  daeyunTable.appendChild(dataRow);

  // ① 세운 클릭 리스너 등록
attachSewoonClickListeners();

// 현재년도 세운 자동 선택 로직 + 로그
  // ===============================
  const currentYear = new Date().getFullYear();
  //console.log("[세운] 현재년도:", currentYear);

  const cells = dataRow.querySelectorAll('.sewoon-cell');
  //console.log("[세운] 생성된 세운 셀 개수:", cells.length);

  const currentCell = Array.from(cells).find(cell => {
    //console.log("[세운] 셀 연도:", cell.dataset.year);
    return cell.dataset.year.startsWith(String(currentYear));
  });

  if (currentCell) {
    //console.log("[세운] 현재년도 셀 발견:", currentCell.dataset.year);
    currentCell.click(); // attachSewoonClickListeners 통해 월운 렌더링
  } else {
   // console.warn("[세운] 현재년도 셀을 찾지 못했습니다.");
  }


}






//월운 테이블 렌더링 함수
export function renderMonthlyGanjiSeries(baseYear, sewoonStem) {
  const container = document.getElementById('yearly-ganji-container');
  if (!container) return;

  // 1. 세운 천간으로 시작 간지 구함
  const { stem: startStem, branch: startBranch } = getStartMonthBySewoonStem(sewoonStem);

  // 2. 간지 시리즈 생성
  const { monthlyStems, monthlyBranches } = generateMonthlyGanjiSeriesByGanji(startStem, startBranch);

  // 3. HTML 출력
  let html = `<table class="daeyun-table" style="margin-top:0;">
   <thead><tr><th colspan="12">월운 (${Math.floor(baseYear)}년)</th></tr>
    <tr>${Array.from({ length: 12 }, (_, i) => `<th style="font-size:0.85rem;">${12 - i}월</th>`).join('')}</tr>
    </thead><tbody><tr>`;

  for (let i = 0; i < 12; i++) {
    const stem = monthlyStems[i];
    const branch = monthlyBranches[i];
    const stemHan = convertKorToHanStem(stem);
    const branchHan = convertKorToHanBranch(branch);
    const tenGodStem = getTenGod(window.dayGanKorGan, stem);

    const hiddenStemsHan = HanhiddenStemsMap[branchHan] || [];
    // 지장간 배열에서 하단 천간 또는 중간 천간 선택
    let targetStemHan = '';
    if (hiddenStemsHan.length === 3) {
      targetStemHan = hiddenStemsHan[2];
    } else if (hiddenStemsHan.length === 2) {
      targetStemHan = hiddenStemsHan[1];
    }
    const tenGodBranch = targetStemHan ? getTenGod(window.dayGanKorGan, targetStemHan) : '';

    // ✅ 월 번호(표가 12→1 역순이라 12-i)
    const monthNum = 12 - i;

html += `
  <td class="wolwoon-cell" data-month="${monthNum}" style="text-align:center;">
    <div style="font-size:0.85rem;">${colorize(stemHan)}</div>
    <div style="font-size:0.85rem;">${colorize(branchHan)}</div>
  </td>`;
}


  html += '</tr></tbody></table>';
  container.innerHTML = html;

  // ✅ 최소 변경: 올해면 현재 월 자동 선택
  const now = new Date();                          // 필요시 Asia/Seoul로 바꾸려면 toLocaleString 사용
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;             // 1~12
  if (Math.floor(baseYear) === curYear) {
    const target = container.querySelector(`.wolwoon-cell[data-month="${curMonth}"]`);
    if (target) target.classList.add('selected');  // 스타일은 CSS에서 .wolwoon-cell.selected로 지정
  }
}







export function attachSewoonClickListeners() {
  const cells = document.querySelectorAll('.sewoon-cell');
  const total = cells.length;

  cells.forEach((cell, index) => {
    cell.addEventListener('click', () => {
      const correctedIndex = total - 1 - index; // 내림차순 정렬에 맞춘 인덱스 보정

      // 🔹 모든 세운 셀에서 선택 표시 제거
      cells.forEach(c => c.classList.remove('selected'));

      // 🔹 클릭한 셀 기준으로 정확한 위치 강조
      cells[index].classList.add('selected');

      //console.log('✅ 선택된 세운 셀:', cell.dataset.year); // ← 디버깅 로그


      // 🔹 기존 로직: 인덱스는 보정해서 전달
      const year = parseFloat(cell.dataset.year);
      const stemKor = cell.dataset.stem;
      const branchKor = cell.dataset.branch;
      handleSewoonClick(year, stemKor, branchKor, correctedIndex);

     // console.log('1선택 세운 연도:', year);
//console.log('2선택 세운 천간:', stemKor);
//console.log('3선택 세운 지지:', branchKor);
//console.log('4correctedIndex:', correctedIndex);
    });
  });
}


//대운 클릭시 세운 렌더링 함수
export function handleDaeyunClick(birthYear, birthMonth, birthDay, index) {
  const monthlyContainer = document.getElementById('yearly-ganji-container');
  if (monthlyContainer) {
    monthlyContainer.innerHTML = '';
  }

  // 🔧 대운 데이터 (원래 순서)
  const daeyunCount = window.daeyunPairs.length;

  // ✅ 현재 대운이 내림차순으로 렌더링된 상태이므로 index 역변환
  const trueIndex = daeyunCount - 1 - index;

  // 🔹 현재 클릭한 대운 인덱스를 전역에 저장 (대운 변경 즉시 반영)
  window.currentDaeyunIndex = trueIndex;

  // 🔍 클릭한 실제 대운 데이터
  const clickedPair = window.daeyunPairs[trueIndex];
  if (!clickedPair) {
    //console.warn(`대운 쌍이 존재하지 않습니다: trueIndex=${trueIndex}, 전체 개수=${window.daeyunPairs.length}`);
    return; // 또는 사용자에게 오류 메시지 표시
  }
  const { stem: clickedDaeyunStem, branch: clickedDaeyunBranch } = clickedPair;
  //console.log('🎯 클릭한 대운 간지:', clickedDaeyunStem, clickedDaeyunBranch);

  const stemIndex = stemOrder.indexOf(clickedDaeyunStem);
  const branchIndex = branchOrder.indexOf(clickedDaeyunBranch);

  // ⚠️ 세운 시작 기준 연도 계산 (direction 사용 X)
  const baseYear = sewonYear-10 + trueIndex * 10;

  // 🔁 세운 생성
  const { yearlyStems, yearlyBranches } = generateYearlyGanjiSeries2(baseYear, stemIndex, branchIndex);

  // 🎨 출력
  renderYearlyGanjiSeries(baseYear, yearlyStems, yearlyBranches);
  attachSewoonClickListeners();

  // ✅ 신살표는 세운 선택이 확정된 이후 갱신
  rerenderSinsal();
}




//세운 클릭시 월운렌더링 함수
export function handleSewoonClick(year, stemKor, branchKor, index) {
  //console.log('👉 클릭한 세운 연도:', year, '세운 천간:', stemKor);

  // ✨ 선택 효과 처리
  document.querySelectorAll('.sewoon-cell').forEach(cell => cell.classList.remove('selected'));
  const clicked = document.querySelector(`.sewoon-cell[data-index="${index}"]`);
  if (clicked) clicked.classList.add('selected');

  window.selectedSewoonIndex = index;

  // 월운 렌더링
  renderMonthlyGanjiSeries(year, stemKor);
   // ✅ 신살표는 세운 선택이 확정된 이후 갱신
   rerenderSinsal();
}



// renderUtils.js 또는 app.js에 추가 (추천: renderUtils.js에 UI만 담당)
//오늘의 사주팔자
export function renderTodaySajuBox({ yearGanji, monthGanji, dayGanji, timeGanji, dayGanKorGan, todayStr, birthSaju })
 {
  const container = document.getElementById('today-saju-container');
  if (!container) return;

  // 🔹 일지 기준으로 6개 지지 뽑기
  function getNackhwaBranches(dayBranch) {

    const idx = branchOrder2.indexOf(dayBranch);
    if (idx === -1) return [];
    const result = [];
    for (let i = 4; i > -2; i--) {
      const newIndex = (idx - i + branchOrder2.length) % branchOrder2.length;
      result.push(branchOrder2[newIndex]);
    }
    return result;
  }

  // 🔹 낙화래정법 표 생성
  const 천간한글 = { '갑':'甲','을':'乙','병':'丙','정':'丁','무':'戊','기':'己','경':'庚','신':'辛','임':'壬','계':'癸' };
const dayMaster = 천간한글[birthSaju.dayGanji.gan] || birthSaju.dayGanji.gan;

function getSipsin(dayGan, targetJi) {
  const targetGan = 지지십간MAP[targetJi]; // 지지 본기
  console.log("👉 getSipsin", { dayGan, targetJi, targetGan });

  if (!targetGan) return "";
  const result = tenGodMap[dayGan]?.[targetGan] || "";
  console.log("👉 조회 결과:", result);
  return result;
}



  // HTML 태그 제거 → 순수 텍스트만 남김
  // 출생 사주의 일간

function stripTags(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function generateNackhwaTable({ birthSaju, dayGanji }) {
  const branches = getNackhwaBranches(dayGanji.ji);

  const birthBranches = [
    birthSaju.yearGanji.ji,
    birthSaju.monthGanji.ji,
    birthSaju.dayGanji.ji,
    birthSaju.timeGanji.ji
  ].map(b => stripTags(colorize(b)));

  return `
    <style>
      .nackhwa-table { border-collapse: collapse; width:100%; font-size:0.75rem; text-align:center; }
      .nackhwa-table td, .nackhwa-table th { border:1px solid #000; padding:2px; }
      .highlight-cell { background-color: #ffeb99 !important; }
    </style>
    <div style="text-align:center; margin-bottom:5px; font-weight:bold;">📋 낙화래정법</div>
    <table class="nackhwa-table">
      <tr>
        <td>단계</td>
        <td>묘(苗)</td>
        <td>근(根)/실(實)</td>
        <td>화(花)</td>
        <td>묘(苗)</td>
        <td>근(根)/실(實)</td>
        <td>화(花)</td>
      </tr>
      <tr>
        <td>형상</td>
        <tr>
  <td>형상</td>
  <td colspan="4" style="background-color:#ffe0f0;">유형(有形)</td> <!-- 연분홍 -->
  <td colspan="2" style="background-color:#d6eaff;">무형(無形)</td> <!-- 연파랑 -->
</tr>

      </tr>
      <tr>
        <td>내용</td>
        <td>이탈자/비부살</td>
          <td style="color:blue; font-weight:">이유/목적<br>(오늘문제)</td>
          <td style="color:red; font-weight:">낙화(落花)</td>
        <td>고민/음욕살</td>
        <td>장벽살<br>(문제씨앗)</td>
        <td>증오/암시(暗矢)</td>
      </tr>
      <tr>
        <td>기준천간</td>
          <td></td>
 <td >일간:<span style="font-size:1.2em;">${colorize(birthSaju.dayGanji.gan)}</span></td>
  <td></td>
  <td></td>
  <td >오늘천간:<span style="font-size:1.2em;">${colorize(dayGanji.gan)}</span></td>
  <td></td>
      </tr>
<tr>
  <td>해당지지</td>
  ${branches.map(b => {
    const val = stripTags(colorize(b));
    const highlight = birthBranches.includes(val) ? ' class="highlight-cell"' : '';
    const sipsin = getSipsin(dayMaster, b);
    return `<td${highlight}><span style="font-size:1.5em;">${colorize(b)}</span><br><span class="explainable" data-group="tengod" data-term="${sipsin}";style="font-size:0.9em;">${sipsin}</span></td>`;
  }).join("")}
</tr>
<tr>
  <td>해결자</td>
  ${branches.map(b => {
    const chong = 충MAP[b] || '';
    const val = stripTags(colorize(chong));
    const highlight = birthBranches.includes(val) ? ' class="highlight-cell"' : '';
    const sipsin = chong ? getSipsin(dayMaster, chong) : '';
    return `<td${highlight}><span style="font-size:1.5em;">${colorize(chong)}</span><br><span class="explainable" data-group="tengod" data-term="${sipsin}"; style="font-size:0.9em;">${sipsin}</span></td>`;
  }).join("")}
</tr>

<tr>
  <td colspan="7">*노란색 강조된 칸의 글자는 생일사주에 있는 글자를 표시한 것입니다</td>
</tr>

    </table>
  `;
}



  // 🔹 오늘의 사주 표
  const sajuHTML = `
    <div style="max-width: 400px; margin-left: 5px;">
      <h3 style="font-size:0.75rem; margin-left:5px;">📆 오늘의 사주<br> (${todayStr})</h3>
      <table class="ganji-table" style="font-size: 0.8rem; margin-left:5px;">
        <thead>
          <tr>
            <th style="padding:2px; font-size: 0.75rem;">시</th>
            <th style="padding:2px; font-size: 0.75rem;">일</th>
            <th style="padding:2px; font-size: 0.75rem;">월</th>
            <th style="padding:2px; font-size: 0.75rem;">년</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${colorize(timeGanji.gan)}</td>
            <td>${colorize(dayGanji.gan)}</td>
            <td>${colorize(monthGanji.gan)}</td>
            <td>${colorize(yearGanji.gan)}</td>
          </tr>
          <tr>
            <td>${colorize(timeGanji.ji)}</td>
            <td>${colorize(dayGanji.ji)}</td>
            <td>${colorize(monthGanji.ji)}</td>
            <td>${colorize(yearGanji.ji)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  // 🔹 컨테이너 렌더링
  container.innerHTML = `
    ${sajuHTML}
    <div style="margin-top:8px; text-align:center; position:relative;">
      <div id="nackhwaPopup"
           style="display:none; position:absolute; bottom:40px; left:50%; transform:translateX(-50%);
                  background:#fffbe6; border:1px solid #fbc02d; border-radius:8px;
                  box-shadow:0 2px 6px rgba(0,0,0,0.2); font-size:0.8rem; z-index:1000;">
      </div>
      <button id="popupNackhwaBtn"
              style="font-size:0.75rem; padding:5px 12px; background-color:#ffeb3b;
                     color:#333; border:1px solid #fbc02d; border-radius:6px; cursor:pointer;">
        낙화래정법
      </button>
    </div>
  `;

  // 🔹 버튼 이벤트
  const btn = document.getElementById("popupNackhwaBtn");
  const popup = document.getElementById("nackhwaPopup");

btn.addEventListener("click", (e) => {
  e.stopPropagation();

  // 오늘 날짜/시간 구하기
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];  // YYYY-MM-DD
  const timeStr = now.toTimeString().slice(0, 5);    // HH:MM

  popup.innerHTML = `
    <div>
      <label for="nackhwaDate">날짜 선택: </label>
      <input type="date" id="nackhwaDate" value="${todayStr}">
      <label for="nackhwaTime">시간 선택: </label>
      <input type="time" id="nackhwaTime" step="3600" value="${timeStr}">
      <button id="nackhwaGenerateBtn">조회</button>
      <hr>
      <div id="nackhwaTableArea">
        ${generateNackhwaTable({ birthSaju, dayGanji })} 
      </div>
    </div>
  `;

  popup.style.display = (popup.style.display === "none" || popup.style.display === "") 
    ? "block" 
    : "none";



    // 내부 조회 버튼 이벤트
    const dateInput = document.getElementById("nackhwaDate");
    const timeInput = document.getElementById("nackhwaTime");
    const genBtn = document.getElementById("nackhwaGenerateBtn");
    const tableArea = document.getElementById("nackhwaTableArea");

genBtn.addEventListener("click", async () => {
  console.log("📌 조회 버튼 클릭됨");
  console.log("📌 dateInput.value:", dateInput.value);
  console.log("📌 timeInput.value:", timeInput.value);

  if (dateInput.value) {
    const date = new Date(dateInput.value);

    if (timeInput.value) {
      const [hours, minutes] = timeInput.value.split(":").map(Number);
      date.setHours(hours);
      date.setMinutes(minutes || 0);
    }

    console.log("📌 최종 Date 객체:", date);

    // ✅ API가 요구하는 payload 형식 맞추기
    const payload = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      calendarType: "solar",                // 필수
      gender: window.gender || "male",      // 필수
    };

    console.log("📌 보낼 payload:", payload);

    try {
      const response = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

const saju = await response.json();

if (saju.error) {
  tableArea.innerHTML = `<div style="color:red;">❌ ${saju.error}</div>`;
  return;
}

// ✅ 새로 조회한 날짜의 일주만 분해
const dayGanji3 = splitGanji(saju.ganji.day);

console.log("📌 조회일 일주:", dayGanji3);

// ✅ generateNackhwaTable 호출 (year/month/time은 필요 없음)
tableArea.innerHTML = generateNackhwaTable({
  birthSaju,
  dayGanji: dayGanji3
});








    } catch (err) {
      console.error("❌ 사주 API 호출 실패:", err);
      tableArea.innerHTML = `<div style="color:red;">❌ 서버 호출 실패</div>`;
    }
  }
});



  });

  // 🔹 문서 클릭 시 팝업 닫기
  document.addEventListener("click", (e) => {
    if (popup.style.display === "block" && !popup.contains(e.target) && e.target !== btn) {
      popup.style.display = "none";
    }
  });
}





export function createDangryeongTableHtml(
  dangryeong,
  saryeong,
  dangryeongShikArray,
  monthJi,
  jijiList,
  ganList2   // ← 여기가 추가됨
) {
  console.log("💡 createDangryeongTableHtml 받은 ganList2:", ganList2);


  if (!dangryeongShikArray || dangryeongShikArray.length === 0) {
    return `<div>당령식 데이터가 없습니다.</div>`;
  }


const firstHeesin = firstHeesinMap[dangryeong];
const dangryeongshikHtml = dangryeongShikArray.map((char, i) => {
  if (char === dangryeong) {
    return `<span style="color: red; font-weight: bold;">${char}</span>`;
  } else if (char === firstHeesin) {
    return `<span style="color: green; font-weight: bold;">${char}</span>`; // 제1희신은 녹색 예시
  } else {
    return `<span>${char}</span>`;
  }
}).join(' ');

  // 여기서 사령식 HTML 문자열 생성
  const styledSaryeongshik = getSaryeongshikHtml(monthJi, saryeong);
  
return `
  <style>
.saryeong-char {
  color: blue;
  text-decoration-line: underline;
  text-decoration-style: wavy;
  text-decoration-color: yellow;
  /* font-weight: bold; 삭제 */
}
.bojo-char {
  color: rgb(14, 90, 24);
  text-decoration-line: underline;
  text-decoration-style: wavy;
  text-decoration-color: yellow;
}
.normal-char {
  /* 기본색 */
}

  </style>
  <div style="display: flex; justify-content: center; margin-top: 0;">
    <table class="dangryeong-table" style="border-collapse: collapse; width:100%; margin-top:0; font-size:0.75rem; text-align:center;">
      <tbody>

        <tr>
<td style="border:1px solid #ccc; padding:4px;">
  <span style="background-color:#f0f0f0; padding:2px 4px;">당령:</span>
  <span style="color: red; font-weight: bold;">${dangryeong || '-'}</span>
</td>
<td style="border:1px solid #ccc; padding:4px;max-width:150px;">
  <span style="background-color:#f0f0f0; padding:2px 4px;">사령:</span>
  <span style="color: blue;">${saryeong || '-'}</span>


          <td style="border:1px solid #ccc; padding:4px;min-width:250px;"colspan="2">${styledSaryeongshik}</td>
          
        </tr>
        <tr> 
          <td style="border:1px solid #ccc; padding:4px;font-size:14px;" colspan="2">당령식: ${dangryeongshikHtml || '-'}
          </td>
          <td style=style="border:1px solid #ccc; padding:4px;" colspan="2"><div style="font-size:12px;margin-top:6px;">*색: <span style="color:red;">당령</span>, <span style="color:green;">제1희신,사령보좌</span>, <span style="color:blue;">사령</span>, <span style="color:orange;">기신</span> </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
`;



}


// renderUtils.js

// 위치별로 정렬하는 유틸 함수
export function arrangeByPositionFromObjectList(objList) {
  const arr = [[], [], [], [], []]; // 1~5 자리용
  objList.forEach(({ char, pos }) => {
    if (pos >= 1 && pos <= 5) {
      arr[pos - 1].push(char);
    }
  });
  return arr;
}



export function arrangeByPosition(listOrMap) {
  const positionMap = [[], [], [], [], []];

  if (Array.isArray(listOrMap)) {
    for (const item of listOrMap) {
      if (!item) continue;

      if (Array.isArray(item.pos)) {
        for (const p of item.pos) {
          if (p >= 1 && p <= 5) {
            // item에 isMiddle 필드가 있으면 유지, 없으면 false 기본값
            positionMap[p - 1].push(item);
          }
        }
      } else if (typeof item.pos === "number") {
        const p = item.pos;
        if (p >= 1 && p <= 5) {
          positionMap[p - 1].push(item);
        }
      }
    }
  } else if (listOrMap && typeof listOrMap === "object") {
    for (const [pos, values] of Object.entries(listOrMap)) {
      const index = Number(pos) - 1;
      if (index >= 0 && index < 5 && Array.isArray(values)) {
        // values가 문자 배열이면 객체로 변환해야 할 수도 있지만
        // 보통은 이 경우 안 쓰이는 듯? 필요하면 변환 추가 가능
        positionMap[index].push(...values);
      }
    }
  }
//console.log("[DEBUG] 위치 1 아이템:", positionMap[0]);
//console.log("[DEBUG] 위치 4 아이템:", positionMap[3]);

  //console.log("[DEBUG] arrangeByPosition 결과:", positionMap);
  return positionMap;
}











////////////////////////////////////////////출력부분
export function renderDangryeongHeesinGisin() {

  const cheonganGisinList = window.cheonganGisinList;
  const cheonganHeesinList = window.cheonganHeesinList;
  const jijiHeesinList = window.jijiHeesinList;
  const jijiGisinList = window.jijiGisinList;
  const dangryeongList = window.dangryeongList;
  if (!Array.isArray(dangryeongList)) {
    console.warn("⚠️ dangryeongList가 배열이 아님:", dangryeongList);
    return "";
  }

  const target = dangryeongList.find(
    d => d.char === window.trueDangryeongChar
  );
  console.log("🎯 target:", target);

  // target이 없으면 이후 로직도 조심
  if (!target) {
    console.warn("⚠️ trueDangryeongChar에 해당하는 항목 없음");
    return "";
  }
  const container = document.getElementById("dangryeongshik-container");
  if (!container) return;

  const cheonganGisinByPos = arrangeByPosition(cheonganGisinList);
  const cheonganHeesinByPos = arrangeByPosition(cheonganHeesinList);
  const jijiHeesinByPos = arrangeByPosition(jijiHeesinList);
  const jijiGisinByPos = arrangeByPosition(jijiGisinList);
//console.log("[DEBUG] jijiHeesinByPos at pos 4:", jijiHeesinByPos[3]);

  const firstHeesinMap = {
    '癸': '甲', '甲': '癸', '乙': '丙', '丙': '乙',
    '丁': '庚', '庚': '丁', '辛': '壬', '壬': '辛',
  };

  const firstHeesinChar = firstHeesinMap[trueDangryeongChar] || "";

  const commonStyle = "font-family:Consolas, 'Courier New', monospace; font-size:16px; line-height:1.8;";

  // ------------------------------
  // ✅ 내부 함수: 대운/세운 희·기신 분류
  // ------------------------------
function makeHeeGiSinList() {
  const daewoon = window.selectedDaewoon;
  const sewoon  = window.selectedSewoon;

  // 둘 다 없을 때만 리턴
  if (!daewoon && !sewoon) {
    console.warn("대운/세운 선택값 없음");
    return {
      daewoon: { cheonganHeesin: "", cheonganGisin: "", jijiHeesin: "", jijiGisin: "" },
      sewoon:  { cheonganHeesin: "", cheonganGisin: "", jijiHeesin: "", jijiGisin: "" }
    };
  }

  const { heesin, gisin } = HEESIN_GISIN_COMBINED[trueDangryeongChar] || { heesin: [], gisin: [] };

  const extractChars = (stem, branch, label) => {
    let list = [];
    if (stem) {
      list.push({ char: stem, isMiddle: false, source: label, from: "stem" });
    }
    if (branch && jijiToSibganMap[branch]) {
      jijiToSibganMap[branch].forEach(s => {
        if (s && s.char) {
          list.push({
            char: s.char,
            isMiddle: !!s.isMiddle,
            source: label,
            from: "branch"
          });
        }
      });
    }
    return list;
  };

  const daewoonList = daewoon ? extractChars(daewoon.stem, daewoon.branch, "大") : [];
  const sewoonList  = sewoon  ? extractChars(sewoon.stem,  sewoon.branch,  "世") : [];

  const classify = (list) => {
    return {
      cheonganHeesin: list.find(x => heesin.includes(x.char) && !x.isMiddle) || null,
      cheonganGisin:  list.find(x => gisin.includes(x.char) && !x.isMiddle) || null,
      jijiHeesin:     list.find(x => heesin.includes(x.char) && x.isMiddle) || null,
      jijiGisin:      list.find(x => gisin.includes(x.char) && x.isMiddle) || null,
    };
  };

  return {
    daewoon: classify(daewoonList),
    sewoon:  classify(sewoonList),
  };
}



function formatHeeGiSinItem(item) {
  if (!item) return "";

  // 중기면 괄호 처리
  let char = item.isMiddle ? `(${item.char})` : item.char;

  // 출처 태그 (대운/세운)


  // 천간/지지 태그
  const loc = item.from === "stem" ? "[天]" : "[地]";

  // --- 색상 강조 (기존 highlightIfNeeded 규칙과 동일) ---
  const plainChar = char.replace(/[()]/g, ""); // 괄호 제거 후 비교

  const isDangryeong = (plainChar === trueDangryeongChar);
  const isFirstHeesin = (plainChar === firstHeesinChar);

  const { heesin, gisin } = HEESIN_GISIN_COMBINED[trueDangryeongChar] || { heesin: [], gisin: [] };
  const isGisin = gisin.includes(plainChar);
  const isHeesin = heesin.includes(plainChar);

  let styledChar = char;
  if (isDangryeong) {
    styledChar = `<span style="color:red; font-weight:bold;">${char}</span>`;
  } else if (isFirstHeesin) {
    styledChar = `<span style="color:green; font-weight:bold;">${char}</span>`;
  } else if (isGisin) {
    styledChar = `<span style="color:orange; font-weight:bold;">${char}</span>`;
  } else if (isHeesin) {
    // 희신은 별도 색 없음 → 그냥 char
    styledChar = char;
  }

  return `${styledChar}${loc}`;
}




  const result = makeHeeGiSinList();

  // ------------------------------
  // highlightIfNeeded / createSectionLineHTML 등 기존 그대로 유지

const highlightIfNeeded = (charObj) => {
  if (!charObj) return "";

  let char, isMiddle = false;
  if (typeof charObj === "string") {
    char = charObj;
  } else {
    char = charObj.char;
    isMiddle = charObj.isMiddle || false;
  }

  const isJijiHeesin = jijiHeesinList.some(item =>
    item.char === char && !!item.isMiddle === !!isMiddle
  );
  const isCheonganGisin = cheonganGisinList.some(item => item.char === char);
  const isJijiGisin = jijiGisinList.some(item => item.char === char);
  const isDangryeong = char === trueDangryeongChar;
  const isFirstHeesin = char === firstHeesinChar;

  // 1. 괄호 래핑은 맨 먼저 결정
  const wrappedChar = isMiddle ? `(${char})` : char;

  // 2. 스타일 우선순위: 진짜당령 > 제1희신 > 기신
  if (isDangryeong) {
    return `<span style="color:red; font-weight:bold;">${wrappedChar}</span>`;
  }

  if (isFirstHeesin) {
    return `<span style="color:green; font-weight:bold;">${wrappedChar}</span>`;
  }

  if (isCheonganGisin || isJijiGisin) {
    return `<span style="color:orange;font-weight:bold;">${wrappedChar}</span>`;
  }

  // 3. 지지희신이지만 다른 스타일 없으면 괄호만 유지
  if (isJijiHeesin) {
    return wrappedChar;
  }

  return char;
}

const createSectionLineHTML = (title, posMap, sourceList = null) => {
  const commonStyle = "font-family:Consolas, 'Courier New', monospace; font-size:16px; line-height:1.8;";
  const cellWidth = 30;
  const cellStyle = `display:inline-block; width:${cellWidth}px; text-align:center; margin-right:4px;`;
  const titleWidth = 90;

  const maxLines = Math.max(...posMap.map(arr => arr.length));

  let html = `<div style="${commonStyle}">`;

  for (let line = 0; line < maxLines; line++) {
    let cells = `<strong style="display:inline-block; width:${titleWidth}px; text-align:left;">${line === 0 ? title : ''}</strong>`;
    for (let pos = 0; pos < 5; pos++) {
      const charObj = posMap[pos][line];
      if (charObj) {
        cells += `<span style="${cellStyle}">${highlightIfNeeded(charObj)}</span>`;
      } else {
        cells += `<span style="${cellStyle}"></span>`;
      }
    }
    html += `<div>${cells}</div>`;
  }

  html += `</div>`;
  return html;
};



const createDangryeongLineHTML = (title, list) => {
  const cellWidth = 30;
  const cellStyle = `display:inline-block; width:${cellWidth}px; text-align:center; margin-right:4px;`;
  const titleWidth = 90;

  let cells = "";
  for (let pos = 1; pos <= 5; pos++) {
    const item = list.find(x => x.pos === pos);
    const char = item ? highlightIfNeeded(item.char) : "";
    cells += `<span style="${cellStyle}">${char}</span>`;
  }
  return `<div style="${commonStyle}"><strong style="display:inline-block; width:${titleWidth}px;">${title}</strong>${cells}</div>`;
};

let leftCell = "";
leftCell += createSectionLineHTML("천간기신", cheonganGisinByPos);
leftCell += createSectionLineHTML("천간희신", cheonganHeesinByPos);
leftCell += createDangryeongLineHTML("당령식", dangryeongList);
leftCell += createSectionLineHTML("지지희신", jijiHeesinByPos);
leftCell += createSectionLineHTML("지지기신", jijiGisinByPos);


// ✅ 당령(dayLing, 즉 월령)을 기준으로,
// 선택된 target (대운 or 세운)의 천간 + 지지 지장간을 비교
function findHeeGiSin(dangryeong, target) {
  // ✅ 세운/대운이 아예 선택되지 않은 경우 → "-"
  if (target === undefined || target === null) {
    return { cheonganHeesin: "-", jijiHeesin: "-", cheonganGisin: "-", jijiGisin: "-" };
  }

  if (!dangryeong || !HEESIN_GISIN_COMBINED[dangryeong]) {
    return { cheonganHeesin: "X", jijiHeesin: "X", cheonganGisin: "X", jijiGisin: "X" };
  }

  const { heesin, gisin } = HEESIN_GISIN_COMBINED[dangryeong];
  const firstHeesin = firstHeesinMap[dangryeong]; // ✅ 제1희신 추출

  let cheonganHeesin = [], jijiHeesin = [];
  let cheonganGisin = [], jijiGisin = [];

  // --- 색상 지정 함수
  function colorize(val, type, pos) {
    let color = "black";
    let bold = "";

    if (val === dangryeong) {
      color = "red"; // 당령
      bold = "font-weight:bold;";
    } else if (type === "heesin") {
      if (val === firstHeesin) {
        color = "green"; // 제1희신
        bold = "font-weight:bold;";
      } else {
        color = "black"; // 일반 희신
      }
    } else if (type === "gisin") {
      color = "orange"; // 기신
    }

    return `<span style="color:${color};${bold}">${val}(${pos})</span>`;
  }

  // 1) 천간 검사
  if (target.stem) {
    if (heesin.includes(target.stem))
      cheonganHeesin.push(colorize(target.stem, "heesin", "天"));
    if (gisin.includes(target.stem))
      cheonganGisin.push(colorize(target.stem, "gisin", "天"));
  }

  // 2) 지지 → 지장간 검사
  if (target.branch) {
    const sibgans = jijiToSibganMap2[target.branch] || [];
    sibgans.forEach(val => {
      if (heesin.includes(val))
        jijiHeesin.push(colorize(val, "heesin", "地"));
      if (gisin.includes(val))
        jijiGisin.push(colorize(val, "gisin", "地"));
    });
  }

  return {
    cheonganHeesin: cheonganHeesin.length ? cheonganHeesin.join(", ") : "X",
    jijiHeesin: jijiHeesin.length ? jijiHeesin.join(", ") : "X",
    cheonganGisin: cheonganGisin.length ? cheonganGisin.join(", ") : "X",
    jijiGisin: jijiGisin.length ? jijiGisin.join(", ") : "X"
  };
}



const dangryeong = window.dangryeong; // 당령 (월지 기반으로 산출된 글자)
const daewoonResult = findHeeGiSin(dangryeong, window.selectedDaewoon);
const sewoonResult  = findHeeGiSin(dangryeong, window.selectedSewoon);

console.log("대운 희신:", daewoonResult.cheonganHeesin, "/", daewoonResult.jijiHeesin);
console.log("대운 기신:", daewoonResult.cheonganGisin, "/", daewoonResult.jijiGisin);


// 오른쪽 표 (대운/세운 희기신)
let rightCell = `
    <table style="border-collapse:collapse; width:100%; text-align:center; font-size:12px; line-height:1.2;">
      <tr style="background-color:#fff8dc;">
        <th style="border:1px solid #ccc; padding:2px 4px;">구분</th>
        <th style="border:1px solid #ccc; padding:2px 4px;">대운</th>
        <th style="border:1px solid #ccc; padding:2px 4px;">세운</th>
      </tr>

      <!-- 희신 : 천간 -->
      <tr>
        <td style="border:1px solid #ccc; padding:2px 4px; background-color:#e6f0ff;">희신(천간)</td>
        <td style="border:1px solid #ccc; padding:2px 4px;">${daewoonResult.cheonganHeesin}</td>
        <td style="border:1px solid #ccc; padding:2px 4px;">${sewoonResult.cheonganHeesin}</td>
      </tr>

      <!-- 희신 : 지지 -->
      <tr>
        <td style="border:1px solid #ccc; padding:2px 4px; background-color:#e6f0ff;">희신(지지)</td>
        <td style="border:1px solid #ccc; padding:2px 4px;">${daewoonResult.jijiHeesin}</td>
        <td style="border:1px solid #ccc; padding:2px 4px;">${sewoonResult.jijiHeesin}</td>
      </tr>

      <!-- 기신 : 천간 -->
      <tr>
        <td style="border:1px solid #ccc; padding:2px 4px; background-color:#e6f0ff;">기신(천간)</td>
        <td style="border:1px solid #ccc; padding:2px 4px;">${daewoonResult.cheonganGisin}</td>
        <td style="border:1px solid #ccc; padding:2px 4px;">${sewoonResult.cheonganGisin}</td>
      </tr>

      <!-- 기신 : 지지 -->
      <tr>
        <td style="border:1px solid #ccc; padding:2px 4px; background-color:#e6f0ff;">기신(지지)</td>
        <td style="border:1px solid #ccc; padding:2px 4px;">${daewoonResult.jijiGisin}</td>
        <td style="border:1px solid #ccc; padding:2px 4px;">${sewoonResult.jijiGisin}</td>
      </tr>
    </table>

`;


// 전체 1행 2칸짜리 큰 표
let html = `
 <table style="border-collapse:collapse; width:100%; border:none;">
    <tr>
      <td style="vertical-align:top; padding:8px; border:none;">
        ${leftCell}   <!-- 기존 천간/지지/당령식 -->
      </td>
    </tr>
    <tr>
      <td style="vertical-align:top; padding:8px; border:none;">
        ${rightCell}  <!-- 대운/세운 희기신 -->
      </td>
    </tr>
  </table>
`;

container.innerHTML = html;

}




