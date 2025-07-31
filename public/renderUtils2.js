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
         tenGodMap,
         tenGodMapKor
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
  generateYearlyGanjiSeries2,
  generateDaeyunBy60Gapja,
  getStartMonthBySewoonStem,
  calculateSewonYear,
  findStartMonthIndex,
  generateMonthlyGanjiSeriesByGanji,
  getdangryeongshik,
  getDangryeongCheongans,
  extractCheonganHeesinGisin, extractJijiHeesinGisin
} from './sajuUtils.js';

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
//대운 테이블 렌더링 함수
export function renderDaeyunTable({ daeyunAge, ageLabels, pairsToRender, birthYear, birthMonth, birthDay, sewonYear }) {
  const container = document.querySelector('.daeyun-table-container');
  if (!container) return;

  console.log('✅ renderDaeyunTable: 전달된 sewonYear =', sewonYear);

  // sewonYear가 숫자면 그대로, 문자열이면 parseFloat로 변환, 아니면 NaN 처리
  const baseSewonYear = typeof sewonYear === 'number'
    ? sewonYear
    : (typeof sewonYear === 'string' ? parseFloat(sewonYear) : NaN);

  let html = `
    <table class="daeyun-table">
      <thead>
        <tr><th colspan="10">대운수: ${daeyunAge.toFixed(2)}</th></tr>
      </thead>
      <tbody>
        <tr>
          ${ageLabels.map(age => `<td style="font-size:0.85rem; color:#999;">${age}</td>`).join('')}
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
export function highlightCurrentDaeyunByAge(correctedStartAge, birthDateYMD) {
  ////console.log('--- highlightCurrentDaeyunByAge 호출 ---');
  //console.log('▶ 수정된 대운 시작 나이:', correctedStartAge);

  const originalIndex = getCurrentDaeyunIndexFromStartAge(correctedStartAge, birthDateYMD);
  //console.log('▶ getCurrentDaeyunIndexFromStartAge 결과 (originalIndex):', originalIndex);

  const daeyunCells = document.querySelectorAll('.daeyun-cell');
  //console.log('▶ daeyunCells.length:', daeyunCells.length);

  // 무조건 내림차순 배열 기준 (맨 앞이 마지막 대운)
  const indexToSelect = daeyunCells.length - 1 - originalIndex;
  //console.log('▶ 계산된 선택 인덱스 (indexToSelect):', indexToSelect);

  daeyunCells.forEach((cell, idx) => {
    cell.classList.toggle('selected', idx === indexToSelect);
    cell.addEventListener('click', () => {
      daeyunCells.forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      window.currentDaeyunIndex = daeyunCells.length - 1 - idx; // 다시 원래 인덱스로 변환
      //console.log('🎯 클릭한 대운 간지:', cell.textContent.trim());
    });
  });

  // ✅ 정렬 기준에 맞는 인덱스를 저장
  window.currentDaeyunIndex = indexToSelect;
 // console.log('📌 현재 대운 인덱스 (정렬 반영):', indexToSelect);

  // 🔄 초기 강조 셀 클릭 이벤트 강제 실행 (내부 상태, UI 완전 동기화)
  if (daeyunCells[indexToSelect]) {
    daeyunCells[indexToSelect].click();
  }

  return indexToSelect;
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
  titleRow.innerHTML = `<th colspan="10">세운시작년도: ${baseYear.toFixed(2)}</th>`;
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
    const year = baseYear + i;
// 🎯 renderYearlyGanjiSeries 내부 세운 셀 코드
dataRow.innerHTML += `
  <td class="sewoon-cell" data-index="${i}" data-year="${year.toFixed(2)}" data-stem="${stemKor}" data-branch="${branchKor}">
    <div style="font-size:0.85rem; color:#999;">${year.toFixed(2)}</div>
    <div style="font-size:0.85rem;">${colorize(stemHan)}</div>
    <div style="font-size:0.75rem; color:#999;">(${tenGodStem})</div>
    <div style="font-size:0.85rem;">${colorize(branchHan)}</div>
    ${tenGodBranch ? `<div style="font-size:0.75rem; color:#999;">(${tenGodBranch})</div>` : ''}
  </td>`;

  }

  // 🎯 세운 데이터 행 삽입
  daeyunTable.appendChild(dataRow);
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
  let html = `<table class="daeyun-table" style="margin-top:1rem;">
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

    html += `
      <td style="text-align:center;">
        <div style="font-size:0.85rem;">${colorize(stemHan)}</div>
        <div style="font-size:0.75rem; color:#999;">(${tenGodStem})</div>
        <div style="font-size:0.85rem;">${colorize(branchHan)}</div>
        ${tenGodBranch ? `<div style="font-size:0.75rem; color:#999;">(${tenGodBranch})</div>` : ''}
      </td>`;
  }

  html += '</tr></tbody></table>';
  container.innerHTML = html;
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

      console.log('✅ 선택된 세운 셀:', cell.dataset.year); // ← 디버깅 로그


      // 🔹 기존 로직: 인덱스는 보정해서 전달
      const year = parseFloat(cell.dataset.year);
      const stemKor = cell.dataset.stem;
      const branchKor = cell.dataset.branch;
      handleSewoonClick(year, stemKor, branchKor, correctedIndex);

      console.log('1선택 세운 연도:', year);
console.log('2선택 세운 천간:', stemKor);
console.log('3선택 세운 지지:', branchKor);
console.log('4correctedIndex:', correctedIndex);
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

  // 🔍 클릭한 실제 대운 데이터
  const clickedPair = window.daeyunPairs[trueIndex];
  if (!clickedPair) {
  console.warn(`대운 쌍이 존재하지 않습니다: trueIndex=${trueIndex}, 전체 개수=${window.daeyunPairs.length}`);
  return; // 또는 사용자에게 오류 메시지 표시
}
  const { stem: clickedDaeyunStem, branch: clickedDaeyunBranch } = clickedPair;
  console.log('🎯 클릭한 대운 간지:', clickedDaeyunStem, clickedDaeyunBranch);

  const stemIndex = stemOrder.indexOf(clickedDaeyunStem);
  const branchIndex = branchOrder.indexOf(clickedDaeyunBranch);

  // ⚠️ 세운 시작 기준 연도 계산 (direction 사용 X)
  const baseYear = sewonYear + trueIndex * 10;

  // 🔁 세운 생성
  const { yearlyStems, yearlyBranches } = generateYearlyGanjiSeries2(baseYear, stemIndex, branchIndex);

  // 🎨 출력
  renderYearlyGanjiSeries(baseYear, yearlyStems, yearlyBranches);
  attachSewoonClickListeners();
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
}



// renderUtils.js 또는 app.js에 추가 (추천: renderUtils.js에 UI만 담당)
//오늘의 사주팔자
export function renderTodaySajuBox({ yearGanji, monthGanji, dayGanji, timeGanji, dayGanKorGan, todayStr }) {
  const container = document.getElementById('today-saju-container');
  if (!container) return;
  // ✅ 오늘의 사주 생성



  container.innerHTML = `
<div style="max-width: 400px; margin-left: 20px;">
    <h3 style="font-size:1rem; margin-left:20px;">📆 오늘의 사주 (${todayStr})</h3>
    <table class="ganji-table" style="font-size: 0.8rem; margin-left:20px;">
               <thead>
    <tr>
      <th style="padding:2px; font-size: 0.75rem;">시</th>
      <th style="padding:2px; font-size: 0.75rem;">일</th>
      <th style="padding:2px; font-size: 0.75rem;">월</th>
      <th style="padding:2px; font-size: 0.75rem;">년</th>
    </tr>
</thead>


      <tbody>
        <!-- 천간 -->
        <tr>
          <td>${colorize(timeGanji.gan)}</td>
          <td>${colorize(dayGanji.gan)}</td>
          <td>${colorize(monthGanji.gan)}</td>
          <td>${colorize(yearGanji.gan)}</td>
        </tr>
        <!-- 지지 -->
        <tr>
          <td>${colorize(timeGanji.ji)}</td>
          <td>${colorize(dayGanji.ji)}</td>
          <td>${colorize(monthGanji.ji)}</td>
          <td>${colorize(yearGanji.ji)}</td>
        </tr>
      </tbody>
    </table>
  </div>`;
}


// renderUtils.js

export function createDangryeongTableHtml(dangryeong, saryeong, dangryeongShikArray) {
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


  return `
    <div style="display: flex; justify-content: center; margin-top: 1rem;">
      <table class="dangryeong-table" style="
        border-collapse: collapse;
        font-size: 1rem;
        text-align: center;
        width: 100%;
        max-width: 600px;
        border: 1px solid #ccc;
      ">
        <tbody>
          <tr>
            <td style="border:1px solid #ccc; padding:4px;">당령: ${dangryeong || '-'}</td>
            <td style="border:1px solid #ccc; padding:4px;">사령: ${saryeong || '-'}</td>
            <td style="border:1px solid #ccc; padding:4px;">당령식: ${dangryeongshikHtml || '-'}</td>
          </tr>
          <tr> 
           <td style="border:1px solid #ccc; padding:4px;"colspan="2">사령식: </td>
            <td style="border:1px solid #ccc; padding:4px;font-size:12px;">*빨강색- 당령</br> *초록색- 제1희신</td></tr>
        </tbody>
      </table>

    </div>
  `;
}

export // renderUtils.js

// 위치별로 정렬하는 유틸 함수
function arrangeByPositionFromObjectList(objList) {
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
            positionMap[p - 1].push({ char: item.char ?? item.value, isMiddle: !!item.isMiddle });
          }
        }
      } else if (typeof item.pos === "number") {
        const p = item.pos;
        if (p >= 1 && p <= 5) {
          positionMap[p - 1].push({ char: item.char ?? item.value, isMiddle: !!item.isMiddle });
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

  console.log("[DEBUG] arrangeByPosition 결과:", positionMap);
  return positionMap;
}











////////////////////////////////////////////출력부분
export function renderDangryeongHeesinGisin(
  cheonganGisinList,
  cheonganHeesinList,
  dangryeongList,
  jijiHeesinList,
  jijiGisinList,
  trueDangryeongChar
) {
  const container = document.getElementById("dangryeongshik-container");
  if (!container) return;

  const cheonganGisinByPos = arrangeByPosition(cheonganGisinList); // [{char, pos}]
  const cheonganHeesinByPos = arrangeByPosition(cheonganHeesinList);
  const jijiHeesinByPos = arrangeByPosition(jijiHeesinList); // [{char, isMiddle, pos}]
  const jijiGisinByPos = arrangeByPosition(jijiGisinList);

  const firstHeesinMap = {
    '癸': '甲', '甲': '癸', '乙': '丙', '丙': '乙',
    '丁': '庚', '庚': '丁', '辛': '壬', '壬': '辛',
  };

  const firstHeesinChar = firstHeesinMap[trueDangryeongChar] || "";

  const commonStyle = "font-family:Consolas, 'Courier New', monospace; font-size:16px; line-height:1.8;";

  const highlightIfNeeded = (charObj) => {
    if (!charObj) return "";

    // charObj가 {char, isMiddle} 또는 string일 수 있으므로 처리
    let char, isMiddle = false;
    if (typeof charObj === "string") {
      char = charObj;
    } else {
      char = charObj.char;
      isMiddle = charObj.isMiddle || false;
    }
 console.log(`[DEBUG] highlightIfNeeded: char=${char}, isMiddle=${isMiddle}`);
    if (char === trueDangryeongChar) {
      return `<span style="color:red; font-weight:bold;">${char}</span>`;
    }

    if (char === firstHeesinChar) {
      return `<span style="color:green; font-weight:bold;">${char}</span>`;
    }

    const isCheonganGisin = cheonganGisinList.some(item => item.char === char);
    const isJijiGisin = jijiGisinList.some(item => item.char === char);

    if (isCheonganGisin || isJijiGisin) {
      const wrappedChar = isMiddle ? `<span class="wrap">${char}</span>` : char;
          console.log(`[DEBUG] wrappedChar for ${char}: ${wrappedChar}`);
      return `<span style="color:#FBC02D;">${wrappedChar}</span>`;
    }

    return char;
  };

  const createSectionLineHTML = (title, posMap, sourceList = null) => {
    let cells = "";
    for (let pos = 1; pos <= 5; pos++) {
      const items = sourceList?.filter(item => 
        Array.isArray(item.pos) ? item.pos.includes(pos) : item.pos === pos
      ) || [];

      // posMap 배열 요소가 객체 또는 string일 수 있으므로 그대로 전달
      const chars = (posMap[pos - 1] || []).map(charObj => {
        // sourceList에서 isMiddle 포함된 객체 찾기
        const matchedItem = items.find(i => i.char === (typeof charObj === "string" ? charObj : charObj.char));
        if (matchedItem && typeof charObj === "string") {
          // 원래 string이었으면 isMiddle만 덧붙여 객체로 만들어서 전달
          return { char: charObj, isMiddle: matchedItem.isMiddle || false };
        }
        // 객체면 그대로 넘기거나 없으면 charObj만 넘김
        return matchedItem || charObj;
      }).map(highlightIfNeeded).join("");

      cells += `<span style="display:inline-block; width:30px; text-align:center;">${chars}</span>`;
    }
    return `<div style="${commonStyle}"><strong style="display:inline-block; width:90px;">${title}</strong>${cells}</div>`;
  };

  const createDangryeongLineHTML = (title, list) => {
    let cells = "";
    for (let pos = 1; pos <= 5; pos++) {
      const item = list.find(x => x.pos === pos);
      const char = item ? highlightIfNeeded(item.char) : "";
      cells += `<span style="display:inline-block; width:30px; text-align:center;">${char}</span>`;
    }
    return `<div style="${commonStyle}"><strong style="display:inline-block; width:90px;">${title}</strong>${cells}</div>`;
  };

  let html = "";
  html += createSectionLineHTML("천간기신", cheonganGisinByPos);
  html += createSectionLineHTML("천간희신", cheonganHeesinByPos);
  html += createDangryeongLineHTML("당령식", dangryeongList);
  html += createSectionLineHTML("지지희신", jijiHeesinByPos, jijiHeesinList);
  html += createSectionLineHTML("지지기신", jijiGisinByPos, jijiGisinList);

  container.innerHTML = html;
}

