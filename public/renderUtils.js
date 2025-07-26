// renderUtils.js
//함수종류
//renderDaeyunTable, renderDaeyunTable, highlightCurrentDaeyunByAge, renderYearlyGanjiSeries,
//renderMonthlyGanjiSeries, handleDaeyunClick, elementColors, renderTodaySajuBox, renderDangryeong
//attachSewoonClickListeners, 



import { stemOrder, 
        branchOrder, 
        DANGRYEONGSHIK_MAP,
         jijiToSibganMap,
         firstHeesinMap, 
         HEESIN_GISIN_COMBINED, 
         HEESIN_BY_DANGRYEONG_POSITION, 
         GISIN_BY_DANGRYEONG_POSITION
      } from './constants.js';

import {
  convertKorToHanStem,
  convertKorToHanBranch,
  convertHanToKorStem,
  normalizeBranch,
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

  generateYearlyGanjiSeries2,
  generateDaeyunBy60Gapja,
  getStartMonthBySewoonStem,
  calculateSewonYear,
  findStartMonthIndex,
  generateMonthlyGanjiSeriesByGanji,
  getdangryeongshik,
  extractSajuCheongansAndJijis, getDangryeongCheongans,
  extractCheonganHeesinGisin, extractJijiHeesinGisin
} from './sajuUtils.js';


// isYangStem, getDaYunDirection, generateDaYunStems, getTenGod, colorize, splitGanji, 
// getThreeLinesFromArray, generateDaYun, getGanjiByYear, generateYearlyGanjiSeries, 
// generateYearlyGanjiSeries2, generateDaeyunBy60Gapja, getStartMonthBySewoonStem, 
// calculateSewonYear, findStartMonthIndex, generateMonthlyGanjiSeriesByGanji, 
// dateUtils.js에서 필요한 함수 import
import { getCurrentDaeyunIndexFromStartAge } from './dateUtils.js';

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

            const hiddenStems = 
            [branch] || [];
            let targetStemKor = '';
            if (hiddenStems.length === 3) targetStemKor = hiddenStems[2];
            else if (hiddenStems.length === 2) targetStemKor = hiddenStems[1];

            const tenGodBranch = targetStemKor ? getTenGod(window.dayGanKorGan, targetStemKor) : '';

            // baseSewonYear가 숫자면 i를 더해 소숫점 1자리까지 표시
            const sewon = !isNaN(baseSewonYear) ? (baseSewonYear + i).toFixed(2) : '';

            console.log(`세운 (${i}):`, sewon);

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
  console.log('--- highlightCurrentDaeyunByAge 호출 ---');
  console.log('▶ 수정된 대운 시작 나이:', correctedStartAge);

  const originalIndex = getCurrentDaeyunIndexFromStartAge(correctedStartAge, birthDateYMD);
  console.log('▶ getCurrentDaeyunIndexFromStartAge 결과 (originalIndex):', originalIndex);

  const daeyunCells = document.querySelectorAll('.daeyun-cell');
  console.log('▶ daeyunCells.length:', daeyunCells.length);

  // 무조건 내림차순 배열 기준 (맨 앞이 마지막 대운)
  const indexToSelect = daeyunCells.length - 1 - originalIndex;
  console.log('▶ 계산된 선택 인덱스 (indexToSelect):', indexToSelect);

  daeyunCells.forEach((cell, idx) => {
    cell.classList.toggle('selected', idx === indexToSelect);
    cell.addEventListener('click', () => {
      daeyunCells.forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      window.currentDaeyunIndex = daeyunCells.length - 1 - idx; // 다시 원래 인덱스로 변환
      console.log('🎯 클릭한 대운 간지:', cell.textContent.trim());
    });
  });

  // ✅ 정렬 기준에 맞는 인덱스를 저장
  window.currentDaeyunIndex = indexToSelect;
  console.log('📌 현재 대운 인덱스 (정렬 반영):', indexToSelect);

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
    const hiddenStems = hiddenStemsMap[branchKor] || [];
    let targetStemKor = '';
    if (hiddenStems.length === 3) {
      targetStemKor = hiddenStems[2]; // 하단 천간
    } else if (hiddenStems.length === 2) {
      targetStemKor = hiddenStems[1]; // 중간 천간
    }
    const tenGodBranch = targetStemKor ? getTenGod(window.dayGanKorGan, targetStemKor) : '';

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

    const hiddenStems = hiddenStemsMap[branch] || [];
    const targetStemKor = hiddenStems.length >= 2 ? hiddenStems[1] : (hiddenStems[0] || '');
    const tenGodBranch = targetStemKor ? getTenGod(window.dayGanKorGan, targetStemKor) : '';

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
  console.log('👉 클릭한 세운 연도:', year, '세운 천간:', stemKor);

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
            <td style="border:1px solid #ccc; padding:4px;font-size:12px;">*빨강색- 당령/초록색- 제1희신</td></tr>
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

function arrangeByPositionForDangryeong(dangryeongList) {
  const posMap = { 1: [], 2: [], 3: [], 4: [], 5: [] };

  dangryeongList.forEach(({ char }) => {
    const mapped = DANGRYEONGSHIK_MAP[char];
    if (mapped) {
      for (let i = 0; i < 5; i++) {
        posMap[i + 1].push(mapped[i]);
      }
    }
  });

  return posMap;
}


export function arrangeByPosition(listOrMap) {
  const positionMap = [[], [], [], [], []];

  if (Array.isArray(listOrMap)) {
    for (const item of listOrMap) {
      if (item && item.pos >= 1 && item.pos <= 5) {
        // item.value 대신 item.char 로 바꾸기 필요 (item 구조 확인 필요)
        positionMap[item.pos - 1].push(item.char ?? item.value);
      }
    }
  } else if (listOrMap && typeof listOrMap === "object") {
    for (const [pos, values] of Object.entries(listOrMap)) {
      const index = Number(pos) - 1;
      if (index >= 0 && index < 5 && Array.isArray(values)) {
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
  trueDangryeongChar // <-- 진짜 당령 글자, 예: "庚"
) {
  const container = document.getElementById("dangryeongshik-container");
  if (!container) return;

  const cheonganGisinByPos = arrangeByPosition(cheonganGisinList);
  const cheonganHeesinByPos = arrangeByPosition(cheonganHeesinList);
  const jijiHeesinByPos = arrangeByPosition(jijiHeesinList);
  const jijiGisinByPos = arrangeByPosition(jijiGisinList);

  const firstHeesinMap = {
    '癸': '甲',
    '甲': '癸',
    '乙': '丙',
    '丙': '乙',
    '丁': '庚',
    '庚': '丁',
    '辛': '壬',
    '壬': '辛',
  };

  const firstHeesinChar = firstHeesinMap[trueDangryeongChar] || "";

  console.log("[DEBUG] 진짜 당령 글자:", trueDangryeongChar);
  console.log("[DEBUG] 진짜 당령 제1희신 글자:", firstHeesinChar);

  const commonStyle = "font-family:Consolas, 'Courier New', monospace; font-size:16px; line-height:1.8;";

const highlightIfNeeded = (char) => {
  if (!char) return char;
  if (char === trueDangryeongChar) {
    console.log(`[DEBUG] '${char}'는 당령입니다 → 빨강 굵게`);
    return `<span style="color:red; font-weight:bold;">${char}</span>`;
  }
  if (char === firstHeesinChar) {
    console.log(`[DEBUG] '${char}'는 제1희신입니다 → 초록 굵게`);
    return `<span style="color:green; font-weight:bold;">${char}</span>`;
  }
  return char;
};


  const createSectionLineHTML = (title, posMap) => {
    let cells = "";
    for (let pos = 1; pos <= 5; pos++) {
      const chars = posMap[pos - 1] && posMap[pos - 1].length
        ? posMap[pos - 1].map(c => highlightIfNeeded(c)).join("")
        : "";
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
  html += createSectionLineHTML("지지희신", jijiHeesinByPos);
  html += createSectionLineHTML("지지기신", jijiGisinByPos);

  container.innerHTML = html;
}
