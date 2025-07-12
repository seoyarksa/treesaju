import { stemOrder, branchOrder } from './constants.js';
console.log(stemOrder);
console.log(stemOrder, branchOrder);
import { calculateDaeyunAge, getJeolipDate } from './utils2.js';
import { generateYearlyGanjiSeries } from './utils2.js';
import { generateYearlyGanjiSeries2 } from './utils2.js';
import { getGanjiByYear } from './utils2.js';
import { getDaYunDirection } from './utils2.js';
import { generateDaeyunBy60Gapja } from './utils2.js';
import { convertHanToKorStem, normalizeBranch } from './utils2.js';
// 예: app.js 또는 적절한 초기화 시점에서


///////////////getGanjiByYear


let birthYear = null; // 출생 연도 저장용
// ...이하 기존 app.js 내용...
// 대운 시작 방향: 남자는 양순(+) 여자 역순(-)
//function getDaYunDirection(gender) {
////  return gender === 'male' ? 1 : -1;
//}


const hanToKorStem = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기',
  '庚': '경', '辛': '신', '壬': '임', '癸': '계'
};


function renderDaeyunTable({ daeyunAge, ageLabels, pairsToRender, birthYear, birthMonth, birthDay, sewonYear }) {
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
        <tr><th colspan="10">대운수: ${daeyunAge.toFixed(1)}</th></tr>
      </thead>
      <tbody>
        <tr>
          ${ageLabels.map(age => `<td style="font-size:0.85rem; color:#999;">${age}</td>`).join('')}
        </tr>
        <tr>
          ${pairsToRender.map((pair, i) => {
            const { stem, branch } = pair;
            const stemHan = convertKorToHanStem(stem);
            const branchHan = convertKorToHanBranch(branch);

            const tenGodStem = getTenGod(window.dayGanKorGan, stem);

            const hiddenStems = hiddenStemsMap[branch] || [];
            let targetStemKor = '';
            if (hiddenStems.length === 3) targetStemKor = hiddenStems[2];
            else if (hiddenStems.length === 2) targetStemKor = hiddenStems[1];

            const tenGodBranch = targetStemKor ? getTenGod(window.dayGanKorGan, targetStemKor) : '';

            // baseSewonYear가 숫자면 i를 더해 소숫점 1자리까지 표시
            const sewon = !isNaN(baseSewonYear) ? (baseSewonYear + i).toFixed(1) : '';

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





// 대운 시작 간지 계산


//대운 천간배열생성
function generateDaYunStems(startGan, direction, length = 10) {
  const startIndex = stemOrder.indexOf(startGan);
  if (startIndex === -1) return [];
  const result = [];
  for (let i = 0; i < length; i++) {
    const idx = (startIndex + direction * i + 10) % 10;
    result.push(stemOrder[idx]);
  }
  return result;
}






// 대운 배열 생성
function generateDaYun(startIndex, direction, length = 10) {
  const result = [];
  for (let i = 0; i < length; i++) {
    const idx = (startIndex + direction * i + 12) % 12;
    result.push(branchOrder[idx]);
  }
  return result;
}

//대운 천간지지 기준으로 계산



// 지장간 정의
const hiddenStemsMap = {
  '자': ['임','계'],
  '축': ['계', '신', '기'],
  '인': ['무', '병', '갑'],
  '묘': ['갑', '을'],
  '진': ['을', '계', '무'],
  '사': ['무', '경', '병'],
  '오': ['병', '기', '정'],
  '미': ['정', '을', '기'],
  '신': ['무', '임', '경'],
  '유': ['경', '신'],
  '술': ['신', '정', '무'],
  '해': ['무', '갑', '임']
};

// 지지 → 한글
const hanToKorBranch = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘',
  '辰': '진', '巳': '사', '午': '오', '未': '미',
  '申': '신', '酉': '유', '戌': '술', '亥': '해'
};


// 오행 색상
const elementColors = {
  '甲': 'green', '乙': 'green', '寅': 'green', '卯': 'green',
  '丙': 'red', '丁': 'red', '巳': 'red', '午': 'red',
  '戊': 'orange', '己': 'orange', '辰': 'orange', '戌': 'orange', '丑': 'orange', '未': 'orange',
  '庚': 'gray', '辛': 'gray', '申': 'gray', '酉': 'gray',
  '壬': 'blue', '癸': 'blue', '子': 'blue', '亥': 'blue'
};

const korToHanStem = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊', '기': '己',
  '경': '庚', '신': '辛', '임': '壬', '계': '癸'
};

function convertKorToHanStem(kor) {
  return korToHanStem[kor] || kor;
}


function convertKorToHanBranch(kor) {
  const korToHanBranch = {
    '자': '子', '축': '丑', '인': '寅', '묘': '卯',
    '진': '辰', '사': '巳', '오': '午', '미': '未',
    '신': '申', '유': '酉', '술': '戌', '해': '亥'
  };
  return korToHanBranch[kor] || kor;
}
const tenGodMap = {
  '갑': { '갑': '비견', '을': '겁재', '병': '식신', '정': '상관', '무': '편재', '기': '정재', '경': '편관', '신': '정관', '임': '편인', '계': '정인' },
  '을': { '갑': '겁재', '을': '비견', '병': '상관', '정': '식신', '무': '편재', '기': '정재', '경': '정관', '신': '편관', '임': '편인', '계': '정인' },
  '병': { '갑': '편인', '을': '정인', '병': '비견', '정': '겁재', '무': '식신', '기': '상관', '경': '편재', '신': '정재', '임': '편관', '계': '정관' },
  '정': { '갑': '편인', '을': '정인', '병': '겁재', '정': '비견', '무': '상관', '기': '식신', '경': '편재', '신': '정재', '임': '정관', '계': '편관' },
  '무': { '갑': '정관', '을': '편관', '병': '편인', '정': '정인', '무': '비견', '기': '겁재', '경': '식신', '신': '상관', '임': '편재', '계': '정재' },
  '기': { '갑': '편관', '을': '정관', '병': '편인', '정': '정인', '무': '겁재', '기': '비견', '경': '상관', '신': '식신', '임': '편재', '계': '정재' },
  '경': { '갑': '편재', '을': '정재', '병': '정관', '정': '편관', '무': '편인', '기': '정인', '경': '비견', '신': '겁재', '임': '식신', '계': '상관' },
  '신': { '갑': '편재', '을': '정재', '병': '편관', '정': '정관', '무': '편인', '기': '정인', '경': '겁재', '신': '비견', '임': '상관', '계': '식신' },
  '임': { '갑': '상관', '을': '식신', '병': '편재', '정': '정재', '무': '정관', '기': '편관', '경': '편인', '신': '정인', '임': '비견', '계': '겁재' },
  '계': { '갑': '식신', '을': '상관', '병': '편재', '정': '정재', '무': '편관', '기': '정관', '경': '편인', '신': '정인', '임': '겁재', '계': '비견' },
};

//육신함수
function getTenGod(dayStemKor, targetStemKor) {
  return tenGodMap[dayStemKor]?.[targetStemKor] || '';
}

function colorize(char, size = 'inherit') {
  const color = elementColors[char] || 'black';
  return `<span style="color: ${color}; font-size: ${size}">${char}</span>`;
}

function splitGanji(ganji) {
  return {
    gan: ganji.charAt(0),
    ji: ganji.charAt(1)
  };
}

function getThreeLinesFromArray(arr) {
  const lines = ['', '', ''];
  if (arr.length === 3) {
    lines[0] = arr[0];
    lines[1] = arr[1];
    lines[2] = arr[2];
  } else if (arr.length === 2) {
    lines[0] = arr[0];
    lines[2] = arr[1];
  } else if (arr.length === 1) {
    lines[1] = arr[0];
  }
  return lines.map(convertKorToHanStem);
}

document.getElementById('saju-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const dateStr = document.getElementById('birth-date').value;
  const ampm = document.querySelector('input[name="ampm"]:checked')?.value || 'AM';
  const hour12 = parseInt(document.getElementById('hour-select').value);
  const minute = parseInt(document.getElementById('minute-select').value);
const calendarType = document.getElementById('calendar-type').value;
const gender = document.querySelector('input[name="gender"]:checked')?.value || 'male';

  if (!dateStr || isNaN(hour12) || isNaN(minute)) {
    alert('날짜와 시간을 모두 입력하세요');
    return;
  }

  let [year, month, day] = dateStr.split('-').map(Number);
  let hour = hour12;
  if (ampm === 'PM' && hour12 < 12) hour += 12;
  if (ampm === 'AM' && hour12 === 12) hour = 0;
console.log('보내는 데이터:', { year, month, day, hour, minute, calendarType });

  try {
    const response = await fetch('/api/saju', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
  year, month, day, hour, minute, calendarType, gender // ← gender 추가
}),

    });
const data = await response.json();
console.log('서버에서 받은 data:', data);
console.log('🎯 birthYear:', data.birthYear);
console.log('🎯 birthMonth:', data.month);
console.log('🎯 birthDay:', data.day);
console.log('🎯 daeyunAge:', data.daeyunAge);
console.log('ganji:', data.ganji);
console.log('서버 응답 전체:', JSON.stringify(data, null, 2));

// fetch 응답 후에 추가!
// 서버에서 받은 생년월일 데이터를 전역 변수에 저장
window.birthYear = data.birthYear || year;
window.birthMonth = data.month || month;
window.birthDay = data.day || day;

// ✅ 직접 받은 birthYear 사용
birthYear = data.birthYear;


// 대운 시작 나이도 그대로 사용
// ✅ 서버에서 계산한 값을 사용해야 함
const daeyunAge = data.daeyunAge;


    if (!response.ok) throw new Error('서버 오류 발생');


    const yearGanji = splitGanji(data.ganji.year);
    const monthGanji = splitGanji(data.ganji.month);
    const dayGanji = splitGanji(data.ganji.day);
    const timeGanji = splitGanji(data.ganji.time);
  console.log('월간 천간:', monthGanji.gan);
  console.log('월지 지지:', monthGanji.ji);
  // ✅ 일간(한자)을 한글로 변환하여 전역 변수로 저장

window.dayGanKorGan = convertHanToKorStem(dayGanji.gan); // ✅ 일간 한글 천간을 전역에 저장


    const yearJiKor = normalizeBranch(yearGanji.ji);
    const monthJiKor = normalizeBranch(monthGanji.ji);
    const dayJiKor = normalizeBranch(dayGanji.ji);
    const timeJiKor = normalizeBranch(timeGanji.ji);

   const yearLines = hiddenStemsMap[yearJiKor] || [];
const monthLines = hiddenStemsMap[monthJiKor] || [];
const dayLines = hiddenStemsMap[dayJiKor] || [];
const timeLines = hiddenStemsMap[timeJiKor] || [];

// 한자 → 한글 천간 변환 함수 필요 (파일 상단에 선언되어 있어야 함)
const dayGanKorGan = convertHanToKorStem(dayGanji.gan);

// 대운 시작 방향


// 월간/월지 기준 시작 간지
const yearStemKor = data.yearStemKor; // ✅ 오류 발생 지점 수정됨
// 대운 간지 배열 생성
const daYunDirection = getDaYunDirection(gender, yearStemKor);
console.log('⚡ daYunDirection (1: 순행, -1: 역행):', daYunDirection);
const startStemKor = convertHanToKorStem(monthGanji.gan);
const startBranchKor = normalizeBranch(monthGanji.ji);
  console.log('대운 시작 천간 (한글):', startStemKor);
  console.log('대운 시작 지지 (한글):', startBranchKor);
  console.log('✅ startBranchKor:', startBranchKor); // 예: '신'
//const rawBranchIndex = branchOrder.indexOf(startBranchKor);
//const offset = daYunDirection === 1 ? 2 : -2;
//const adjustedBranchIndex = (rawBranchIndex + offset + 12) % 12;
//const correctedBranchKor = branchOrder[adjustedBranchIndex];
//console.log('🎯 보정된 대운 지지 시작점 (한글):', correctedBranchKor);
// 기존 보정 로직 제거 후, 이 한 줄만 남깁니다
const correctedBranchKor = startBranchKor;

window.daYunDirection = daYunDirection;



const daeyunPairs = generateDaeyunBy60Gapja(
  startStemKor,
  correctedBranchKor,
  daYunDirection,
  10
);


// 방향 변수 daYunDirection은 이미 계산됨
window.daeyunPairs = daeyunPairs;

const pairsToRender = [...daeyunPairs];
// 여기에 전역 변수로 저장

window.daYunDirection = daYunDirection;

const correctedStartAge = daeyunAge < 0 ? daeyunAge + 10 : daeyunAge;

const ageLabels = ['0'];  // 첫 번째는 항상 0으로 시작

for (let i = 1; i < daeyunPairs.length; i++) {
  const ageValue = correctedStartAge + (i - 1) * 10;
  ageLabels.push(ageValue.toFixed(1));
}


console.log('daeyunPairs:', daeyunPairs.map(p => p.stem + p.branch).join(', '));
console.log('pairsToRender:', pairsToRender.map(p => p.stem + p.branch).join(', '));
console.log('ageLabels:', ageLabels);

// 대운 계산

// 대운 HTML 생성
// 대운 HTML 생성


// ✅ 선언 후 사용
//let firstDaeyunAge = 5;
//console.log(firstDaeyunAge); // 5


function calculateSewonYear(birthYear, birthMonth, birthDay, daeyunAge) {
  const monthFraction = (birthMonth - 1) / 12;
  const dayFraction = (birthDay / 30) / 12;
  const decimalPart = monthFraction + dayFraction;

  const sewonYear = (birthYear - 10) + daeyunAge + decimalPart;

  return parseFloat(sewonYear.toFixed(2)); // 소숫점 2자리로 고정
}
const result = calculateSewonYear(1969, 8, 23, 5.1);
console.log('계산된 세운 시작년도:', result);


const sewonYear = calculateSewonYear(birthYear, birthMonth, birthDay, daeyunAge);
window.sewonYear = sewonYear; // 여기 추가!
console.log('🎯 세운 시작년도 (소숫점1):', sewonYear);


//세운클릭이벤트
function handleDaeyunClick(birthYear,birthMonth, birthDay,  index) {
  // 🔧 전역 대운 방향 변수 (1: 순행, -1: 역행)
   console.log('🎯 birthYear:', birthYear, 'birthMonth:', birthMonth, 'birthDay:', birthDay);
  const direction = window.daYunDirection || 1;

  // ✅ 방향에 따라 실제 대운 인덱스 보정
  const trueIndex = direction === -1
    ? window.daeyunPairs.length - 1 - index
    : index;

  // 디버깅 출력
  console.log('handleDaeyunClick index:', index, 'trueIndex:', trueIndex, 'direction:', direction);

  // 🔎 클릭한 대운 간지 쌍 가져오기
  const clickedPair = window.daeyunPairs[trueIndex];
  const { stem: clickedDaeyunStem, branch: clickedDaeyunBranch } = clickedPair;
  console.log('클릭한 대운 간지:', clickedDaeyunStem, clickedDaeyunBranch);

  // 🔢 간지 인덱스 가져오기
  const stemIndex = stemOrder.indexOf(clickedDaeyunStem);
  const branchIndex = branchOrder.indexOf(clickedDaeyunBranch);

  // 📅 해당 대운의 시작 기준 연도
// ✅ 기존 baseYear 계산식 대체
const baseYear = direction === 1
  ? sewonYear + (trueIndex * 10)
  : sewonYear + ((window.daeyunPairs.length - 1 - trueIndex) * 10);

  // 📦 10년 세운 간지 시리즈 생성
  const { yearlyStems, yearlyBranches } = generateYearlyGanjiSeries2(baseYear, stemIndex, branchIndex);

  // 디버깅
  console.log('window.daYunDirection:', direction);
  console.log('clicked index:', index, 'true index:', trueIndex);

  // 🖼️ 세운 테이블 렌더링
  renderYearlyGanjiSeries(baseYear, yearlyStems, yearlyBranches);
}



function renderYearlyGanjiSeries(baseYear, stems, branches) {
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
  titleRow.innerHTML = `<th colspan="10">세운년도: ${baseYear.toFixed(1)}</th>`;
  daeyunTable.appendChild(titleRow);

  // 🎯 세운 데이터 행 생성
  const dataRow = document.createElement('tr');
  dataRow.id = 'yearly-series-row';

  for (let i = 0; i < 10; i++) {
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
    dataRow.innerHTML += `
      <td style="padding:4px; text-align:center;">
        <div style="font-size:0.85rem; color:#999;">${year}</div>
        <div style="font-size:0.85rem;">${colorize(stemHan)}</div>
        <div style="font-size:0.75rem; color:#999;">(${tenGodStem})</div>
        <div style="font-size:0.85rem;">${colorize(branchHan)}</div>
        ${tenGodBranch ? `<div style="font-size:0.75rem; color:#999;">(${tenGodBranch})</div>` : ''}
      </td>`;
  }

  // 🎯 세운 데이터 행 삽입
  daeyunTable.appendChild(dataRow);
}





// 여기에 추가하세요 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓

const isEumYear = ['을', '정', '기', '신', '계'].includes(yearStemKor); // 음간 여부 체크
console.log('daYunDirection:', daYunDirection);

// 🎯 대운 출력 순서 고정

// 🎯 클릭 처리 보정
let stemsToRender = pairsToRender.map(pair => pair.stem);
let branchesToRender = pairsToRender.map(pair => pair.branch);

if (daYunDirection === -1) {
  stemsToRender = [...stemsToRender].reverse();
  branchesToRender = [...branchesToRender].reverse();
}

// 이제 stemsToRender, branchesToRender를 화면에 렌더링할 때 사용


// ✅ 전역 등록 (중요!)
window.handleDaeyunClick = handleDaeyunClick;


    document.getElementById('result').innerHTML = `
      <style>
  .ganji-table {
    border-collapse: collapse;
    margin: 20px 0 10px 20px;
    font-family: 'Nanum Gothic', sans-serif;
    font-size: 3rem;
    text-align: center;
  }

  .ganji-table th {
    background-color: #ddd;
    padding: 10px;
    font-size: 1.1rem;
  }

  .ganji-table td {
    padding: 2px 6px;
    line-height: 1.0;
    vertical-align: middle;
  }
    .daeyun-table {
  font-size: 1.2rem;
  text-align: center;
  margin: 10px 0 0 20px;
  border-collapse: collapse;
}
  .daeyun-table th,
    .daeyun-table td {
      width: 50px;
      padding: 2px;
    }

    .daeyun-cell {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 2px;
      font-size: 1.1rem;
    }
  .note-box {
    font-size: 0.75rem;
    color: #555;
    line-height: 1.2;
    margin-left: 20px;
    white-space: pre-line;
  }
     /* 지장간 전용 스타일 */
        .hidden-stem-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;  /* 위아래 간격 최소화 */
          margin-top: 4px;
        }
        .hidden-stem {
          font-size: 0.85rem;
          color: #666;
          line-height: 1.0;
          padding: 0;
          margin: 0;
        }
        .note-box {
          font-size: 0.75rem;
          color: #555;
          line-height: 1.2;
          margin-left: 20px;
          white-space: pre-line;
        }
          
</style>
<table class="ganji-table">
  <thead>
    <tr>
      <th>시주</th>
      <th>일주</th>
      <th>월주</th>
      <th>년주</th>
    </tr>
  </thead>
  <tbody>
    <!-- 천간 -->
    <tr>
      <td>
        <div>${colorize(timeGanji.gan)}</div>
        <div style="font-size:0.85rem; color:#888;">
          (${getTenGod(dayGanKorGan, convertHanToKorStem(timeGanji.gan))})
        </div>
      </td>
      <td>
        <div>${colorize(dayGanji.gan)}</div>
        <div style="font-size:0.85rem; color:#888;">(일간)</div>
      </td>
      <td>
        <div>${colorize(monthGanji.gan)}</div>
        <div style="font-size:0.85rem; color:#888;">
          (${getTenGod(dayGanKorGan, convertHanToKorStem(monthGanji.gan))})
        </div>
      </td>
      <td>
        <div>${colorize(yearGanji.gan)}</div>
        <div style="font-size:0.85rem; color:#888;">
          (${getTenGod(dayGanKorGan, convertHanToKorStem(yearGanji.gan))})
        </div>
      </td>
    </tr>

    <!-- 지지 -->
    <tr>
      <td>${colorize(timeGanji.ji)}</td>
      <td>${colorize(dayGanji.ji)}</td>
      <td>${colorize(monthGanji.ji)}</td>
      <td>${colorize(yearGanji.ji)}</td>
    </tr>

    <!-- 지장간 + 육신 -->
   <tr>
  <td>
    <div class="hidden-stem-wrapper">
      ${timeLines.map(s => `
        <div class="hidden-stem">
          (${colorize(convertKorToHanStem(s), '0.85rem')}
          <span style="font-size:0.75rem; color:#999;">
            ${getTenGod(dayGanKorGan, s)}
          </span>)
        </div>`).join('')}
    </div>
  </td>
  <td>
    <div class="hidden-stem-wrapper">
      ${dayLines.map(s => `
        <div class="hidden-stem">
          (${colorize(convertKorToHanStem(s), '0.85rem')}
          <span style="font-size:0.75rem; color:#999;">
            ${getTenGod(dayGanKorGan, s)}
          </span>)
        </div>`).join('')}
    </div>
  </td>
  <td>
    <div class="hidden-stem-wrapper">
      ${monthLines.map(s => `
        <div class="hidden-stem">
          (${colorize(convertKorToHanStem(s), '0.85rem')}
          <span style="font-size:0.75rem; color:#999;">
            ${getTenGod(dayGanKorGan, s)}
          </span>)
        </div>`).join('')}
    </div>
  </td>
  <td>
    <div class="hidden-stem-wrapper">
      ${yearLines.map(s => `
        <div class="hidden-stem">
          (${colorize(convertKorToHanStem(s), '0.85rem')}
          <span style="font-size:0.75rem; color:#999;">
            ${getTenGod(dayGanKorGan, s)}
          </span>)
        </div>`).join('')}
    </div>
  </td>
</tr>

  </tbody>
</table>
<div class="note-box">
  ※ 태어난 분대가 20~40분(30분 근처)에 있는 분은 정확한 시주가 산출되지 않을 수도 있으니<br>
     따로 확인해 주세요!
</div>

 <!-- ✅ 대운 테이블 -->
<div class="daeyun-table-container"></div>




<div id="yearly-series" style="margin-top: 1rem;"></div>
<!-- 세운 표시 영역 -->
<div id="yearly-ganji-container" style="margin-top: 20px;"></div>



`;
console.log('renderDaeyunTable pairsToRender:', pairsToRender.map(p => p.stem + p.branch));
console.log('daYunDirection:', daYunDirection);
console.log('daeyunPairs:', daeyunPairs.map(p => p.stem + p.branch).join(', '));
console.log('ageLabels:', ageLabels);
console.log('pairsToRender 전체:', pairsToRender);
pairsToRender.forEach((p, i) => {
  console.log(`index ${i} 타입: ${typeof p}, 값:`, p);
});

// ✅ 여기서 대운 테이블을 동적으로 렌더링!
renderDaeyunTable({
  daeyunAge,
  ageLabels,
  pairsToRender,
  birthYear: window.birthYear,
  birthMonth: window.birthMonth,
  birthDay: window.birthDay,
  sewonYear: window.sewonYear  // ✅ 추가!
});
  } catch (error) {
    alert('에러 발생: ' + error.message);
  }
});


