// app.js


// git add .
// git commit -m "격국식"  
// git push origin main
// git push

// 상수
import { 
  stemOrder, 
  branchOrder, 
  elementMap, 
  DANGRYEONGSHIK_MAP,
  yukshinToKey,  
  jijiToSibganMap, 
  GYEOKGUK_TYPES,
  jijiToSibganMap2,
  HEESIN_GISIN_COMBINED, 
  HEESIN_BY_DANGRYEONG_POSITION, 
  GISIN_BY_DANGRYEONG_POSITION
} from './constants.js';
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

  generateYearlyGanjiSeries2,
  generateDaeyunBy60Gapja,
  getStartMonthBySewoonStem,
  calculateSewonYear,
  findStartMonthIndex,
  generateMonthlyGanjiSeriesByGanji,
  getDangryeong,
  getSaryeong,
  getdangryeongshik, 
extractSajuCheongansAndJijis, getDangryeongCheongans,
  extractCheonganHeesinGisin, extractJijiHeesinGisin
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
  renderTodaySajuBox,
  createDangryeongTableHtml,
  renderDangryeongHeesinGisin,
  arrangeByPosition
} from './renderUtils.js';

import {
  getGyeokForMonth,
  hasSamhap,
  getGyeokName,
  getYukshin,
  getUseGuByGyeok,
  renderGyeokFlowStyled
} from './gyeokUtils.js';

//
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

window.gender = document.querySelector('input[name="gender"]:checked')?.value || null;

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

  let year = '', month = '', day = '';
const birthInput = document.getElementById('birth-date');
if (birthInput && birthInput.value) {
  const raw = birthInput.value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    [year, month, day] = raw.split('-');
  } else if (/^\d{8}$/.test(raw)) {
    year = raw.slice(0, 4);
    month = raw.slice(4, 6);
    day = raw.slice(6, 8);
  } else {
    alert("생년월일 형식이 올바르지 않습니다. 예: 19690823 또는 1969-08-23");
    return;
  }
} else {
  alert("생년월일을 입력해주세요.");
  return;
}

  const calendarType = document.getElementById('calendar-type').value;
  const gender = document.querySelector('input[name="gender"]:checked')?.value || "";
  const ampm = document.querySelector('input[name="ampm"]:checked')?.value || "";
  const hour = document.getElementById('hour-select').value;
  const minute = document.getElementById('minute-select').value;
 // 사주출력 페이지 URL 생성 (필요한 파라미터만 넣으면 됨)
  // 원본 URL
const sajuUrl = `https://treesaju.vercel.app/?birth=${year}${month}${day}&calendar=${calendarType}&gender=${gender}&ampm=${ampm}&hour=${hour}&minute=${minute}`;


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
    <strong>사주출력 페이지 보기:</strong> <a href="${sajuUrl}" target="_blank" rel="noopener noreferrer">${sajuUrl}</a>


    <hr />


    <h3>사주정보</h3>
    <div>${daeyunHTML}</div>

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

//이메일 url클릭 자동입력작용
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const birth = params.get('birth');
  const calendar = params.get('calendar');
  const gender = params.get('gender');
  const ampm = params.get('ampm');
  const hour = params.get('hour');
  const minute = params.get('minute');

  if (birth && calendar && gender && ampm && hour && minute) {
    // 생년월일
    const birthInput = document.getElementById('birth-date');
    if (birthInput) {
      birthInput.value = `${birth.slice(0,4)}-${birth.slice(4,6)}-${birth.slice(6,8)}`;
    }

    // 기타 항목들 설정
    document.getElementById('calendar-type').value = calendar;
    document.querySelector(`input[name="gender"][value="${gender}"]`).checked = true;
    document.querySelector(`input[name="ampm"][value="${ampm}"]`).checked = true;
    document.getElementById('hour-select').value = hour;
    document.getElementById('minute-select').value = minute;

    // ✅ submit 이벤트 강제 실행 (사주 출력 버튼 클릭 효과)
    const form = document.getElementById('saju-form');
    if (form) {
      setTimeout(() => {
        form.requestSubmit(); // ✅ 최신 브라우저에서는 이게 더 안전
      }, 200); // 약간의 지연 (렌더링 완료 후 실행)
    }
  }
});











document.getElementById('saju-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const dateStr = document.getElementById('birth-date').value;
const ampmInput = document.querySelector('input[name="ampm"]:checked');
const ampm = ampmInput ? ampmInput.value : null;
if (!ampm) {
  alert('오전/오후를 선택하세요');
  return;
}
const hour12 = parseInt(document.getElementById('hour-select').value);
  const minute = parseInt(document.getElementById('minute-select').value);
const calendarType = document.getElementById('calendar-type').value;
  const genderInput = document.querySelector('input[name="gender"]:checked');
  const gender = genderInput ? genderInput.value : null;
   if (!gender) {
    alert('성별을 선택하세요');
    return;
  }
   const value = document.getElementById('birth-date').value;
  const inputyear = parseInt(value.split('-')[0]);
//if (inputyear < 1000 || inputyear > 9999) {
  //  e.preventDefault();
  //  alert("연도는 반드시 4자리로 입력하세요.");
 // }
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
  let year, month, day;

if (dateStr.includes("-")) {
  // YYYY-MM-DD 형식
  [year, month, day] = dateStr.split("-").map(Number);
} else if (/^\d{8}$/.test(dateStr)) {
  // YYYYMMDD 형식
  year = parseInt(dateStr.slice(0, 4));
  month = parseInt(dateStr.slice(4, 6));
  day = parseInt(dateStr.slice(6, 8));
} else {
  alert("날짜 형식이 잘못되었습니다. YYYY-MM-DD 또는 YYYYMMDD 형식으로 입력하세요.");
  return;
}
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

console.log('🎯 daeyunAge1[역행적용전]:', data.daeyunAge);
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
// 당령 계산에 필요한 값 꺼내기

// 대운 시작 나이도 그대로 사용
// ✅ 서버에서 계산한 값을 사용해야 함
// daeyunAge 계산부 (예시)
const yearStemKor = data.yearStemKor; // ✅ 오류 발생 지점 수정됨
const birthDateObj = new Date(window.birthYear, window.birthMonth - 1, window.birthDay);
console.log('▶ birthDateObj:', birthDateObj);
const jeolipDate = getJeolipDate(window.birthYear, window.birthMonth);
console.log('▶ jeolipDate:', jeolipDate);

// 원본 값 (소수점 유지)
const daeyunAgeRaw = data.daeyunAge;
window.daeyunAgeRaw = daeyunAgeRaw;

// 표시용 값 (소수점 1자리, 반올림 또는 버림)
const daeyunAge = Number(daeyunAgeRaw.toFixed(2));
window.daeyunAge = daeyunAge;

console.log('▶ daeyunAge2:', daeyunAge);



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

// 당령 구하기

// 출생 월, 일 (전역변수에서)
const birthMonth = parseInt(window.birthMonth, 10); // 👈 명확히 숫자로 변환
const birthDay = parseInt(window.birthDay, 10);
const monthJi = monthGanji.ji;  // 월지(예: '子', '丑' 등)
const daYunDirection = getDaYunDirection(gender, yearStemKor);
console.log('gender:', gender);
console.log('yearStemKor:', yearStemKor);
console.log('⚡ daYunDirection (1: 순행, -1: 역행):', daYunDirection);
window.daYunDirection = getDaYunDirection(gender, yearStemKor);
// 당령 구하는 함수 호출 (sajuUtils.js에서 import 되어 있어야 함)
const dangryeong = getDangryeong(monthGanji.ji, daeyunAge, daYunDirection);
console.log('당령:', dangryeong);
console.log('▶ before getSaryeong call, daeyunAge:', daeyunAge, 'monthJi:', monthJi);

const saryeong = getSaryeong(monthGanji.ji, daeyunAge, window.daYunDirection);

console.log('▶ after getSaryeong call, saryeong:', saryeong);
createDangryeongTableHtml(dangryeong, saryeong);
console.log("사령:", saryeong);

// 당령 결과를 UI에 표시하거나 전역 변수로 저장 가능
window.dangryeong = dangryeong;

// 사주 천간과 지지를 result에서 추출
const sajuChungan = [timeGanji.gan, dayGanji.gan, monthGanji.gan, yearGanji.gan];
const sajuJiji = [timeGanji.ji, dayGanji.ji, monthGanji.ji, yearGanji.ji];



const chunganList = [timeGanji.gan, dayGanji.gan, monthGanji.gan, yearGanji.gan];
const dayGan = dayGanji.gan;  // 일간 천간

console.log(yearGanji, monthGanji, dayGanji, timeGanji);
console.log('사주 천간:', sajuChungan);
console.log('천간 리스트:', chunganList);
console.log('일간:', dayGan);
console.log('대운 나이:', daeyunAge);
console.log('대운 방향:', daYunDirection);
console.log('사령:', saryeong);

// 격국 분석 호출
const gyeok = getGyeokForMonth({
  monthJi: monthGanji.ji,
  saryeong,
  chunganList, // 여기서 위에서 선언한 것을 사용
  dayGan,
  daeyunAge,
  daYunDirection,
});
console.log("▶ monthJi:", monthGanji.ji);
console.log("▶ saryeong:", saryeong);
console.log("▶ chunganList:", chunganList);
console.log("▶ dayGan:", dayGan);
console.log("▶ daeyunAge:", daeyunAge);
console.log("▶ daYunDirection:", daYunDirection);

console.log("격국:", gyeok);


console.log("🧪 getGyeokForMonth 결과:", gyeok);
// 당령 및 사령 추출 (이미 계산되어 있다면)
// ✅ 여기서는 바로 호출만 하세요
renderAllDangryeong(dangryeong, saryeong, sajuChungan, sajuJiji);
// 월간/월지 기준 시작 간지
function renderAllDangryeong(dangryeong, saryeong, sajuChungan, sajuJiji) {
  const dangryeongShikArray = getdangryeongshik(dangryeong);
  console.log('dangryeong:', dangryeong);
  console.log('dangryeongShikArray:', dangryeongShikArray);
  console.log('Array.isArray:', Array.isArray(dangryeongShikArray));

  const dangryeongHtml = createDangryeongTableHtml(dangryeong, saryeong, dangryeongShikArray);
  console.log(dangryeongHtml);
}

function doRender() {
  const dangryeong = getDangryeong(monthJi, daeyunAge, daYunDirection);  // 예: "癸"
  const { sajuCheonganList, sajuJijiList, sajuJijiCheonganList } = extractSajuCheongansAndJijis(saju);

  
  // 사주 지지 십간 리스트 (지지 속 십간을 중복 포함해 뽑기)
// 당령 글자 (진짜 당령)
const trueDangryeongChar = dangryeong;  // 예: '庚'

const dangryeongArray = DANGRYEONGSHIK_MAP[dangryeong];  // ['己', '辛', '癸', '甲', '丙']
console.log('[DEBUG] 당령 천간 배열:', dangryeongArray);
// 배열을 pos와 char 객체 배열로 변환
const dangryeongList = dangryeongArray.map((char, idx) => ({ pos: idx + 1, char }));

console.log('[DEBUG] 당령 포지션 포함 리스트:', dangryeongList);
  // 2. 희신/기신 리스트 추출
const { cheonganHeesinList, cheonganGisinList } = extractCheonganHeesinGisin(dangryeong, sajuCheonganList);
const { jijiHeesinList, jijiGisinList  } = extractJijiHeesinGisin(dangryeong, sajuJijiCheonganList);

console.log('[DEBUG] 사주 천간 리스트:', sajuCheonganList);
console.log('[DEBUG] 사주 지지 리스트:', sajuJijiList);
console.log('[DEBUG] 지지 속 천간 리스트:', sajuJijiCheonganList);

  // 3. 각 리스트를 위치별 배열로 변환 (arrangeByPosition 함수 활용)
  const cheonganHeesinByPos = arrangeByPosition(cheonganHeesinList);
  const cheonganGisinByPos = arrangeByPosition(cheonganGisinList);
  const jijiHeesinByPos = arrangeByPosition(jijiHeesinList);
  const jijiGisinByPos = arrangeByPosition(jijiGisinList);
console.log('[DEBUG] 천간 희신 리스트:', cheonganHeesinList);
console.log('[DEBUG] 천간 기신 리스트:', cheonganGisinList);
console.log('[DEBUG] 지지 희신 리스트:', jijiHeesinList);
console.log('[DEBUG] 지지 기신 리스트:', jijiGisinList);
  // dangryeongList 자체가 {pos: [chars]} 형식이므로 그대로 사용 가능


  // 4. 렌더링 호출
  renderDangryeongHeesinGisin(
    cheonganGisinList,
    cheonganHeesinList,
    dangryeongList,
    jijiHeesinList,
    jijiGisinList,
  trueDangryeongChar
  );
}

// 실행 트리거
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", doRender);
} else {
  setTimeout(doRender, 0);
}





// 대운 간지 배열 생성
// 1. 먼저 필요한 배열 생성
const dangryeongShikArray = getdangryeongshik(dangryeong);

// 2. HTML을 생성해서 HTML에 직접 삽입하거나 템플릿에 사용
const dangryeongHtml = createDangryeongTableHtml(dangryeong, saryeong, dangryeongShikArray);


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

// 👉 정렬만 내림차순으로 적용
ageLabels.sort((a, b) => parseFloat(b) - parseFloat(a));

console.log('daeyunPairs:', daeyunPairs.map(p => p.stem + p.branch).join(', '));
console.log('pairsToRender:', pairsToRender.map(p => p.stem + p.branch).join(', '));
console.log('ageLabels:', ageLabels);



const result = calculateSewonYear(1969, 8, 23, 5.1);
console.log('계산된 세운 시작년도:', result);


const sewonYear = calculateSewonYear(birthYear, birthMonth, birthDay, daeyunAgeRaw);
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

    <div style="max-width: 600px; margin-left: 20px;">
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
  background-color: #ffeaa7 !important;
  border: 2px solid #fdcb6e !important;
  border-radius: 6px;
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
</div>
<!-- 당령 표시용 영역 -->
<div style="margin-top: 1rem; margin-left: 20px;">
  <table class="dangryeong-table" style="
    border-collapse: collapse;
    font-size: 1rem;
    text-align: center;
    width: 100%;
    border: 1px solid #ccc;
    table-layout: fixed;
  ">
    <thead></thead>
    <tbody>
      <tr>
        <td style="border:1px solid #ccc; padding:4px;">${dangryeongHtml || "-"}</td>
        <td style="border:1px solid #ccc; padding:4px;"><div id="gyeok-display"></div></td>
      </tr>
      <tr>
        <td style="border:1px solid #ccc; padding:4px;">
          <div id="dangryeongshik-container" style="margin-top: 0.5rem;"></div>
        </td>
        <td style="border:1px solid #ccc; padding:4px;"><div id="gyeok-flow"></div></td>
      </tr>
    </tbody>
  </table>
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


console.log('🧪 getGyeokForMonth 결과:', gyeok);

let gyeokDisplayText = '판별불가';

if (gyeok && typeof gyeok === 'object' && gyeok.stem) {
  // 격국명 직접 변환
  gyeokDisplayText = getGyeokName(dayGan, gyeok.stem);
} else if (typeof gyeok === 'string') {
  // 문자열이면 그대로 출력 (예: '건록격' 등)
  gyeokDisplayText = gyeok;
}
//격국표시
const gyeokDisplayEl = document.getElementById("gyeok-display");
if (gyeokDisplayEl) {
  gyeokDisplayEl.textContent = `격국: ${gyeokDisplayText}`;
}
// 상신 구신 표시
console.log('✅ dayGan:', dayGan, 'gyeok.stem:', gyeok?.stem);
// somewhere in your app.js or main logic
const saju = {
  yearGan: '기',
  monthGan: '임',
  dayGan: '경',
  hourGan: '경',
  yearBranch: '유',
  monthBranch: '신',
  dayBranch: '오',
  hourBranch: '진'
};



console.log("🔍 전달된 격국 객체(gyeok):", gyeok);
console.log("🔍 전달된 격국 이름:", gyeok.char);
console.log('📦 전달된 saju 객체:', saju);


const flowEl = document.getElementById("gyeok-flow");
console.log(flowEl); // null이면 요소 못 찾음
if (flowEl) flowEl.innerHTML = renderGyeokFlowStyled(gyeok, saju);



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

// 결과 영역 보여주기 - 이 부분 추가!
document.getElementById("result").style.display = "block";

document.getElementById("today-saju-container").style.display = "block";



const birthDateYMD = {
  year: window.birthYear,
  month: window.birthMonth,
  day: window.birthDay
};


const originalIndex = getCurrentDaeyunIndexFromStartAge(correctedStartAge, birthDateYMD);
const indexToSelect = 9 - originalIndex; // 순행/역행과 무관하게 항상 뒤집어서 적용

// 🔁 대운 정렬 방향 고려한 인덱스 계산
const currentDaeyunIndex = getCurrentDaeyunIndexFromStartAge(correctedStartAge, birthDateYMD);

// 🔁 정렬 반영된 index
const sortedIndex = highlightCurrentDaeyunByAge(correctedStartAge, birthDateYMD);
handleDaeyunClick(window.birthYear, window.birthMonth, window.birthDay, sortedIndex);


highlightCurrentDaeyunByAge(correctedStartAge, birthDateYMD);
window.currentDaeyunIndex = currentDaeyunIndex;

// 📌 handleDaeyunClick에는 **sortedIndex**를 넣어야 UI와 동기화됨
handleDaeyunClick(window.birthYear, window.birthMonth, window.birthDay, sortedIndex);




// ✅ 대운 강조 초기화 및 강조 적용

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
  gender: window.gender || 'male'  // window.gender가 없으면 기본값도 넣기
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


