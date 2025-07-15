// app.js


// 상수
import { stemOrder, branchOrder } from './constants.js';
console.log(stemOrder);
console.log(stemOrder, branchOrder);

// 날짜 관련 함수들
// app.js

// dateUtils
import {
  calculateDaeyunAge,
  getJeolipDate,
  getCurrentDaeyunIndexFromStartAge
} from './dateUtils.js';


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
  generateYearlyGanjiSeries,
  generateYearlyGanjiSeries2,
  generateDaeyunBy60Gapja,
  getStartMonthBySewoonStem,
  calculateSewonYear,
  findStartMonthIndex,
  generateMonthlyGanjiSeriesByGanji
} from './sajuUtils.js';
//

import {
  renderDaeyunTable,
  highlightCurrentDaeyunByAge,
  renderYearlyGanjiSeries,
  renderMonthlyGanjiSeries,
  handleDaeyunClick, 
  handleSewoonClick,
  elementColors,
  renderTodaySajuBox
} from './renderUtils.js';

window.handleDaeyunClick = handleDaeyunClick;
window.handleSewoonClick = handleSewoonClick;

///////////////getGanjiByYear


let birthYear = null; // 출생 연도 저장용
// ...이하 기존 app.js 내용...

// 2. 현재 시점의 소숫점 연도 계산
const today = new Date();
const currentDecimalYear =
  today.getFullYear() +
  (today.getMonth()) / 12 +
  (today.getDate() / 30) / 12;


//이메일 전송
// EmailJS 초기화
// EmailJS 초기화
emailjs.init("pya8naTr8rGsWWuw7"); // EmailJS 사용자 ID로 교체

document.getElementById("send-email-button").addEventListener("click", () => {
  const userMessage = document.getElementById("question-input").value.trim();
  if (!userMessage) {
    alert("질문 내용을 입력해주세요.");
    return;
  }

  const [year, month, day] = document.getElementById('birth-date').value.split('-');
  const calendarType = document.getElementById('calendar-type').value;
  const gender = document.querySelector('input[name="gender"]:checked')?.value || "";
  const ampm = document.querySelector('input[name="ampm"]:checked')?.value || "";
  const hour = document.getElementById('hour-select').value;
  const minute = document.getElementById('minute-select').value;

  // 사용자 정보 텍스트 (pre로 줄바꿈 보존)
const birthInfoText = `
생년월일: ${year}년 ${month}월 ${day}일
달력 타입: ${calendarType === 'solar' ? '양력' : '음력'}
성별: ${gender === 'male' ? '남자' : '여자'}
출생 시간: ${ampm} ${hour}시 ${minute}분
`.replace(/\n/g, "<br />");

  // 사주 출력 영역 내용 HTML
   const sajuHTML = document.getElementById("today-saju-container")?.innerHTML.trim();

  // 사주가 출력되지 않았을 경우 전송 차단
  if (!sajuHTML || sajuHTML === "" || sajuHTML === "없음" || sajuHTML.includes("오늘의 사주") === false) {
    alert("사주가 출력되지 않았습니다. 먼저 사주를 계산해 주세요.");
    return;
  }

  const daeyunHTML = document.getElementById("result")?.innerHTML || "없음";
  const sewunHTML = document.getElementById("sewoon")?.innerHTML || "없음";

  // 최종 이메일 본문 (HTML로 구성)
  const emailBody = `
  <div style="font-family: 'Nanum Gothic', sans-serif; line-height: 1.6;">
    <h2>질문 내용</h2>
    <p>${userMessage.replace(/\n/g, "<br />")}</p>

    <hr />

    <h3>사용자 생일 사주</h3>
    <pre style="background:#f9f9f9; padding:10px; border:1px solid #ddd;">${birthInfoText}</pre>

    <hr />

    <h3>대운 정보</h3>
    <div>${daeyunHTML}</div>

    <hr />

    <h3>세운 정보</h3>
    <div>${sewunHTML}</div>

    <hr />

    <h3>오늘의 사주</h3>
    <div>${sajuHTML}</div>
  </div>
`;

  const templateParams = {
    from_name: "만세력 사용자",
    message: emailBody, // HTML 포함
  };

  emailjs.send("service_y6cb7op", "template_xehb16a", templateParams)
    .then(function () {
      alert("성공적으로 전송되었습니다.");
      document.getElementById("question-input").value = "";
    }, function (error) {
      console.error("이메일 전송 실패:", error);
      alert("이메일 전송 중 오류가 발생했습니다.");
    });
});


document.getElementById('saju-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const dateStr = document.getElementById('birth-date').value;
  const ampm = document.querySelector('input[name="ampm"]:checked');
  const hour12 = parseInt(document.getElementById('hour-select').value);
  const minute = parseInt(document.getElementById('minute-select').value);
const calendarType = document.getElementById('calendar-type').value;
const gender = document.querySelector('input[name="gender"]:checked');
 
   const value = document.getElementById('birth-date').value;
  const inputyear = parseInt(value.split('-')[0]);
if (inputyear < 1000 || inputyear > 9999) {
    e.preventDefault();
    alert("연도는 반드시 4자리로 입력하세요.");
  }
  if (!dateStr || isNaN(hour12) || isNaN(minute)) {
    alert('날짜와 시간을 모두 입력하세요');
    return;
  }


  if (!calendarType) {
    alert('양력 또는 음력을 선택하세요');
    return;
  }

  if (!gender) {
    alert('성별을 선택하세요');
    return;
  }

  if (!ampm) {
    alert('오전/오후를 선택하세요');
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

    if (!response.ok) {
  // 에러 메시지를 텍스트로 받아서 콘솔에 출력하거나 알림 처리
  const errorText = await response.text();
  console.error('서버 오류:', errorText);
  throw new Error('서버 오류 발생: ' + errorText);
}

const data = await response.json();
console.log('서버에서 받은 data:', data);
console.log('🎯 birthYear:', data.birthYear);

console.log('🎯 daeyunAge:', data.daeyunAge);
console.log('ganji:', data.ganji);
console.log('서버 응답 전체:', JSON.stringify(data, null, 2));

// fetch 응답 후에 추가!
// 서버에서 받은 생년월일 데이터를 전역 변수에 저장
window.birthYear = data.birthYear || year;
window.birthMonth = data.solar?.month || month;
window.birthDay = data.solar?.day || day;

console.log('🎯 birthMonth:', window.birthMonth);
console.log('🎯 birthDay:', window.birthDay);
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
  ageLabels.push(ageValue.toFixed(2));
}


console.log('daeyunPairs:', daeyunPairs.map(p => p.stem + p.branch).join(', '));
console.log('pairsToRender:', pairsToRender.map(p => p.stem + p.branch).join(', '));
console.log('ageLabels:', ageLabels);



const result = calculateSewonYear(1969, 8, 23, 5.1);
console.log('계산된 세운 시작년도:', result);


const sewonYear = calculateSewonYear(birthYear, birthMonth, birthDay, daeyunAge);
window.sewonYear = sewonYear; // 여기 추가!
console.log('🎯 세운 시작년도 (소숫점1):', sewonYear);



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
 .sewoon-cell.selected {
  border: 2px solid #ff8800;
  border-radius: 9999px; /* 완전히 둥근 테두리 */
  padding: 6px 12px;     /* 여백도 추가하면 더 부드러움 */
  background-color: #fff8e1; /* 선택된 느낌 강조 */
}

      /* style 영역에 추가 */
    .daeyun-cell.selected {
      border: 2px solid #007bff;
      border-radius: 6px;
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
  ※ 태어난 분대가 20~40분(30분 근처)에 있는 분은 정확한 시주가 산출되지 않을 수도 있으니 따로 확인해 주세요! 한국썸머타임은 적용된 상태입니다. 
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
// 🔥 자동 출력 시작!
 //const birthDate = new Date(window.birthYear, window.birthMonth - 1, window.birthDay);
const birthDate = {
  year: window.birthYear,
  month: window.birthMonth,
  day: window.birthDay
};
 const currentDaeyunIndex = getCurrentDaeyunIndexFromStartAge(correctedStartAge, birthDate);
highlightCurrentDaeyunByAge(correctedStartAge, birthDate);
window.currentDaeyunIndex = currentDaeyunIndex;
console.log('📌 현재 대운 인덱스:', currentDaeyunIndex);

// 👉 자동 세운 + 월운 출력 실행!
handleDaeyunClick(window.birthYear, window.birthMonth, window.birthDay, currentDaeyunIndex);

// ✅ 대운 강조 초기화 및 강조 적용
document.querySelectorAll('.daeyun-cell').forEach((cell, index) => {
  // 기존 강조 제거
  cell.classList.remove('selected');

  // 자동 강조 적용
  if (index === currentDaeyunIndex) {
    cell.classList.add('selected');
  }

  // 클릭 이벤트 연결
  cell.addEventListener('click', () => {
    document.querySelectorAll('.daeyun-cell').forEach(c => c.classList.remove('selected'));
    cell.classList.add('selected');
    window.currentDaeyunIndex = index;
  });
});
// 서버에서 ganji 정보 받은 뒤, 마지막에 추가
// 오늘 날짜 기준 사주
// 🎯 생일 사주 출력 완료 후 바로 아래!
const today = new Date();
const todayPayload = {
  year: today.getFullYear(),
  month: today.getMonth() + 1,
  day: today.getDate(),
  hour: today.getHours(),
  minute: today.getMinutes(),
  calendarType: 'solar',
  gender: gender.value  // 생일 입력에서 선택한 성별 그대로 사용
};

const todayStr = `${todayPayload.year}-${String(todayPayload.month).padStart(2, '0')}-${String(todayPayload.day).padStart(2, '0')}`;

const todayResponse = await fetch('/api/saju', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(todayPayload),
});

const todayData = await todayResponse.json();

const yearGanji2 = splitGanji(todayData.ganji.year);
const monthGanji2 = splitGanji(todayData.ganji.month);
const dayGanji2 = splitGanji(todayData.ganji.day);
const timeGanji2 = splitGanji(todayData.ganji.time);
const dayGanKorGan2 = convertHanToKorStem(dayGanji2.gan);

// 🎯 오늘 사주 렌더링
renderTodaySajuBox({
  yearGanji: yearGanji2,
  monthGanji: monthGanji2,
  dayGanji: dayGanji2,
  timeGanji: timeGanji2,
  dayGanKorGan: dayGanKorGan2,
  todayStr
});






  } catch (error) {
    alert('에러 발생: ' + error.message);
  }
});


