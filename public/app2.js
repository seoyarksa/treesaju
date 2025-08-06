// app.js


// git add .
// git commit -m "신살적용중"   
// git push origin main
// git push

// 상수
import { 
  elementMap, 
  DANGRYEONGSHIK_MAP,
  yukshinToKey,  
  tenGodMap,
  tenGodMapKor,
  jijiToSibganMap, 
  GYEOKGUK_TYPES,
  jijiToSibganMap2,
  HEESIN_GISIN_COMBINED, 
  HEESIN_BY_DANGRYEONG_POSITION, 
  GISIN_BY_DANGRYEONG_POSITION
} from './constants.js';


// 날짜 관련 함수들
// app.js

// dateUtils
//import {
//  calculateDaeyunAge,
//    getCurrentDaeyunIndexFromStartAge
//} from './utils/dateUtils.js';


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
  getJeolipDateFromAPI,
getCurrentDaeyunIndexFromStartAge,
  generateYearlyGanjiSeries2,
  generateDaeyunBy60Gapja,
  getStartMonthBySewoonStem,
  calculateSewonYear,
  findStartMonthIndex,
  generateMonthlyGanjiSeriesByGanji,
  getDangryeong,
  getSaryeong,
  getdangryeongshik, 
 getDangryeongCheongans,
 extractJijiSibgansWithMiddleInfo,
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
  renderGyeokFlowStyled,
  getSecondaryGyeok
} from './gyeokUtils.js';

import { renderSinsalTable, getUnseong, getSinsal, getSamhapKeyByJiji, renderEtcSinsalTable } from './sinsalUtils.js';


const MONTH_TO_SOLAR_TERM = {
  1: '소한',   // 1월 시작 절기 (소한) → 입춘 이전 절기
  2: '입춘',   // 2월 시작 절기 (입춘)
  3: '경칩',
  4: '청명',
  5: '입하',
  6: '망종',
  7: '소서',
  8: '입추',
  9: '백로',
  10: '한로',
  11: '입동',
  12: '대설',
};





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



// 🎯 숫자 두 자리로 포맷 (예: 9 → 09)
function pad(num) {
  return String(num).padStart(2, '0');
}

// app.js 상단 혹은 적당한 위치에 추가하세요






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


//console.log('ganji:', data.ganji);
//console.log('서버 응답 전체:', JSON.stringify(data, null, 2));

// fetch 응답 후에 추가!
// 서버에서 받은 생년월일 데이터를 전역 변수에 저장
window.birthYear = data.birthYear || year;
window.birthMonth = data.solar?.month || month;
window.birthDay = data.solar?.day || day;
window.birthHour = data.solar?.hour ?? 0;
window.birthMinute = data.solar?.minute ?? 0;

// ✅ 직접 받은 birthYear 사용
birthYear = data.birthYear;
// 당령 계산에 필요한 값 꺼내기

// 대운 시작 나이도 그대로 사용
// ✅ 서버에서 계산한 값을 사용해야 함
// daeyunAge 계산부 (예시)
const yearStemKor = data.yearStemKor; // ✅ 오류 발생 지점 수정됨
const birthDateObj = new Date(window.birthYear, window.birthMonth - 1, window.birthDay, window.birthHour, window.birthMinute);
console.log('▶ birthDateObj:', birthDateObj);
//console.log('window.birthYear:', window.birthYear);
//console.log('window.birthMonth:', window.birthMonth);
//console.log('window.birthDay:', window.birthDay);
//console.log('window.birthHour:', window.birthHour);
//console.log('window.birthMinute:', window.birthMinute);



  // 절기테스트  임시////////////////////




// 1. 출생일 Date 객체 준비
// 1. 생일 객체 생성
const birthDate = new Date(window.birthYear, window.birthMonth - 1, window.birthDay, window.birthHour, window.birthMinute);
console.log("▶ 생년월일시 (KST):", birthDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));

// 2. 절입일 구하기 (동기 API 사용 가정)
// ✅ 올바른 방식으로 호출
//const jeolipDate = new Date(await getJeolipDateFromAPI(window.birthYear, window.birthMonth, window.birthDay));




// 원본 값 (소수점 유지)
const daeyunAgeRaw = data.daeyunAge;
window.daeyunAgeRaw = daeyunAgeRaw;

// 표시용 값 (소수점 1자리, 반올림 또는 버림)
const daeyunAge = Number(daeyunAgeRaw.toFixed(2));
window.daeyunAge = daeyunAge;

//console.log('▶ daeyunAge2:', daeyunAge);



    if (!response.ok) throw new Error('서버 오류 발생');


    const yearGanji = splitGanji(data.ganji.year);
    const monthGanji = splitGanji(data.ganji.month);
    const dayGanji = splitGanji(data.ganji.day);
    const timeGanji = splitGanji(data.ganji.time);




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

const monthJi = monthGanji.ji;  // 월지(예: '子', '丑' 등)

const daYunDirection = getDaYunDirection(gender, yearStemKor);
console.log('gender:', gender);
console.log('yearStemKor:', yearStemKor);
console.log('⚡ daYunDirection (1: 순행, -1: 역행):', daYunDirection);
console.log('🎯 daeyunAge1[역행적용전]:', data.daeyunAge);
window.daYunDirection = getDaYunDirection(gender, yearStemKor);
// 당령 구하는 함수 호출 (sajuUtils.js에서 import 되어 있어야 함)
const dangryeong = getDangryeong(monthGanji.ji, daeyunAge, daYunDirection);

//console.log('▶ before getSaryeong call, daeyunAge:', daeyunAge, 'monthJi:', monthJi);

const saryeong = getSaryeong(monthGanji.ji, daeyunAge, window.daYunDirection);


//createDangryeongTableHtml(dangryeong, saryeong, dangryeongShikArray, monthJi);
//console.log("사령:", saryeong);

// 당령 결과를 UI에 표시하거나 전역 변수로 저장 가능
window.dangryeong = dangryeong;

// 사주 천간과 지지를 result에서 추출


  console.log('월간 천간:', monthGanji.gan);
  console.log('월지 지지:', monthGanji.ji);
  // ✅ 일간(한자)을 한글로 변환하여 전역 변수로 저장




const sajuChungan = [timeGanji.gan, dayGanji.gan, monthGanji.gan, yearGanji.gan];
const sajuJiji = [timeGanji.ji, dayGanji.ji, monthGanji.ji, yearGanji.ji];



const chunganList = [timeGanji.gan, monthGanji.gan, yearGanji.gan]; //격을 구분할때는 일간을 제외
const dayGan = dayGanji.gan;  // 일간 천간
// 격국 분석 호출
const saju = {
  yearGan: yearGanji.gan,
  monthGan: monthGanji.gan,
  dayGan: dayGanji.gan,
  hourGan: timeGanji.gan,
  yearBranch: yearGanji.ji,
  monthBranch: monthGanji.ji,
  dayBranch: dayGanji.ji,
  hourBranch: timeGanji.ji,
};

const sajuCheonganList = [timeGanji.gan, dayGanji.gan, monthGanji.gan, yearGanji.gan];
const sajuJijiList = [timeGanji.ji, dayGanji.ji, monthGanji.ji, yearGanji.ji];
const otherJijiArr = sajuJijiList.filter(ji => ji !== monthJi);

const gyeok = getGyeokForMonth({
  monthJi: monthGanji.ji,
  saryeong,
  chunganList, // 여기서 위에서 선언한 것을 사용
  dayGan,
  daeyunAge,
  daYunDirection,
  saju,
  otherJijiArr  
});

const jijiSibgans = jijiToSibganMap2[monthJi] || [];
// 2. 보조격 결정 (주격과 동일한 사주 정보 사용!)
const secondaryGyeokResult = getSecondaryGyeok({
  monthJi,
  saryeong,
  jijiSibgans,
  chunganList,
  dayGan,
  primaryStem: gyeok?.stem,    // 이 위치에서 값 세팅!
  daeyunAge,
  daYunDirection,
  primaryChar: gyeok?.char,     // 이 위치에서 값 세팅!,
  otherJijiArr  
});


console.log("격국:", gyeok);
//console.log(yearGanji, monthGanji, dayGanji, timeGanji);


console.log('일간:', dayGan);
console.log('대운 나이:', daeyunAge);
console.log('대운 방향:', daYunDirection);
console.log("▶ monthJi:", monthGanji.ji);
console.log('당령:', dangryeong);
console.log('사령:', saryeong);




  console.log('폼 제출 실행!');
  console.log('saju:', saju);
  console.log('gyeok:', gyeok);
// DOM이 준비된 상태라면 바로 실행



//console.log("🧪 getGyeokForMonth 결과:", gyeok);






// 당령 및 사령 추출 (이미 계산되어 있다면)
// ✅ 여기서는 바로 호출만 하세요
renderAllDangryeong(dangryeong, saryeong, sajuChungan, sajuJiji);
// 월간/월지 기준 시작 간지
function renderAllDangryeong(dangryeong, saryeong, sajuChungan, sajuJiji) {
  const dangryeongShikArray = getdangryeongshik(dangryeong);
    console.log('dangryeongShikArray:', dangryeongShikArray);
  //console.log('Array.isArray:', Array.isArray(dangryeongShikArray));

  const dangryeongHtml = createDangryeongTableHtml(dangryeong, saryeong, dangryeongShikArray, monthJi);
  console.log(dangryeongHtml);
}

function doRender() {
  const dangryeong = getDangryeong(monthJi, daeyunAge, daYunDirection);  // 예: "癸"
// 천간 희신, 기신만 추출

  // 사주 지지 십간 리스트 (지지 속 십간을 중복 포함해 뽑기)
// 당령 글자 (진짜 당령)
const trueDangryeongChar = dangryeong;  // 예: '庚'

const dangryeongArray = DANGRYEONGSHIK_MAP[dangryeong];  // ['己', '辛', '癸', '甲', '丙']
//console.log('[DEBUG] 당령 천간 배열:', dangryeongArray);
// 배열을 pos와 char 객체 배열로 변환
const dangryeongList = dangryeongArray.map((char, idx) => ({ pos: idx + 1, char }));

console.log('[DEBUG] 당령 포지션 포함 리스트:', dangryeongList);
  // 2. 희신/기신 리스트 추출

const sajuJijiCheonganListraw = sajuJijiList.flatMap(jiji => 
  jijiToSibganMap[jiji]?.map(entry => entry.char) || []
);


const { cheonganHeesinList, cheonganGisinList } = extractCheonganHeesinGisin(dangryeong, sajuCheonganList);
const sajuJijiArray =[timeGanji.ji, dayGanji.ji, monthGanji.ji, yearGanji.ji];
const flatSibganList = extractJijiSibgansWithMiddleInfo(sajuJijiArray);
const { jijiHeesinList, jijiGisinList } = extractJijiHeesinGisin(dangryeong, sajuJijiArray);


console.log('사주 천간:', sajuChungan);
console.log('사주 지지:', sajuJijiList);
console.log('[DEBUG] 사주 천간 리스트:', sajuCheonganList);
console.log('[DEBUG] 사주 지지 리스트[raw]:', sajuJijiCheonganListraw);
// 기준 희신 리스트 생성 및 출력
const heesinMap = HEESIN_BY_DANGRYEONG_POSITION[dangryeong] || {};
const 기준희신리스트 = Object.entries(heesinMap).map(
  ([pos, char]) => ({ char, pos: Number(pos) })
);
console.log('[DEBUG] 기준 희신 리스트:', 기준희신리스트);

// 기준 기신 리스트 생성 및 출력
const gisinMap = GISIN_BY_DANGRYEONG_POSITION[dangryeong] || {};
const 기준기신리스트 = [];
Object.entries(gisinMap).forEach(([pos, chars]) => {
  const sourcePos = Number(pos);
  chars.forEach(char => {
    기준기신리스트.push({ char, pos: Number(pos) });
  });
});
console.log('[DEBUG] 기준 기신 리스트:', 기준기신리스트);
////console.log('[DEBUG] 지지 속 천간 리스트:', sajuJijiCheonganList);

  // 3. 각 리스트를 위치별 배열로 변환 (arrangeByPosition 함수 활용)
  /////////////////////////const cheonganGisinByPos = arrangeByPosition(cheonganGisinList);
  //const cheonganHeesinByPos = arrangeByPosition(cheonganHeesinList);

  //const jijiHeesinByPos = arrangeByPosition(jijiHeesinList);
  //const jijiGisinByPos = arrangeByPosition(jijiGisinList);
console.log('[DEBUG] 추출한 천간 희신 리스트:', cheonganHeesinList);
console.log('[DEBUG] 추출한 천간 기신 리스트:', cheonganGisinList);
console.log('[DEBUG] 추출한 지지 희신 리스트:', jijiHeesinList);
console.log('[DEBUG] 추출한 지지 기신 리스트:', jijiGisinList);
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
const dangryeongHtml = createDangryeongTableHtml(dangryeong, saryeong, dangryeongShikArray, monthJi);


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



//const result = calculateSewonYear(1969, 8, 23, 5.1);
//console.log('계산된 세운 시작년도:', result);


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





// ✅ 절기명 매칭해서 입력하기
function findSolarTermNameByMonth(jeolipDateStr, solarTermsList) {
  const jeolipDate = new Date(jeolipDateStr);
  const jeolipMonth = jeolipDate.getMonth() + 1;

  for (const entry of solarTermsList) {
    const [termName, termDateStr] = entry.split(':').map(str => str.trim());
    const termDate = new Date(termDateStr);
    const termMonth = termDate.getMonth() + 1;

    if (termMonth === jeolipMonth) {
      return termName;
    }
  }

  return null;
}





// 12운성, 12신살클릭 시 변경용 (이 함수는 그대로)
function updateResultRow({ type, gan, samhap }) {
  const jijiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  if (type === 'unseong' && gan) {
    const unseongArr = jijiArr.map(jiji => getUnseong(gan, jiji));
    document.getElementById('unseong-row').innerHTML =
      `<th>12운성</th>${unseongArr.map(txt => `<td>${txt}</td>`).join('')}`;
  } else if (type === 'sinsal' && samhap) {
    const sinsalArr = jijiArr.map(jiji => getSinsal(samhap, jiji));
    document.getElementById('sinsal-row').innerHTML =
      `<th>12신살</th>${sinsalArr.map(txt => `<td>${txt}</td>`).join('')}`;
  }
}






// 이제 stemsToRender, branchesToRender를 화면에 렌더링할 때 사용
async function showBirthInfo(data) {
  console.log('🚀 showBirthInfo 호출됨');
  console.log('📦 전달받은 data:', data);

  // 절입일이 없으면 API로 받아오기
  if (!data.jeolipDate) {
    try {
      const jeolipDateStr = await getJeolipDateFromAPI(window.birthYear, window.birthMonth, window.birthDay);
      console.log('API에서 받은 jeolipDateStr:', jeolipDateStr);
      if (jeolipDateStr) {
        data.jeolipDate = jeolipDateStr;
      } else {
        console.warn('API에서 절입일을 받지 못했습니다.');
      }
    } catch (error) {
      console.error('❌ 절입일 API 호출 실패:', error);
    }
  }

  let solarTerm = "절입시 정보 없음";

  if (data.jeolipDate) {
    const jeolipDateObj = new Date(data.jeolipDate);
    if (isNaN(jeolipDateObj)) {
      console.error('❌ jeolipDate가 유효하지 않은 날짜입니다.');
    } else {
      console.log('🕒 jeolipDateObj:', jeolipDateObj);

      // 절입월로 절기명 찾기
      const month = jeolipDateObj.getMonth() + 1;
      const jeolipName = MONTH_TO_SOLAR_TERM[month] || "절입시";

      const pad = (n) => n.toString().padStart(2, '0');
      const jeolipStr = `${month}월 ${pad(jeolipDateObj.getDate())}일 ${pad(jeolipDateObj.getHours())}:${pad(jeolipDateObj.getMinutes())}`;
      solarTerm = `${jeolipName} (${jeolipStr})`;
      console.log('☀️ solarTerm:', solarTerm);
    }
  } else {
    console.warn('⚠️ jeolipDate가 존재하지 않습니다.');
  }

  const pad = (n) => n.toString().padStart(2, '0');

  const solarDate = `${window.birthYear}-${pad(window.birthMonth)}-${pad(window.birthDay)} ${pad(window.birthHour)}:${pad(window.birthMinute)}`;
  console.log('🌞 solarDate:', solarDate);

  const lunar = data.lunar;
  const lunarDate = lunar
    ? `${lunar.lunarYear}년 ${pad(lunar.lunarMonth)}월 ${pad(lunar.lunarDay)}일 ${pad(lunar.hour)}시 ${pad(lunar.minute)}분`
    : "정보 없음";
  console.log('🌙 lunarDate:', lunarDate);

  const birthInfoText = `[양력] ${solarDate}  ||  [음력] ${lunarDate}  <br>  [절입시] ${solarTerm}`;
  console.log('📝 birthInfoText:', birthInfoText);

  const birthInfoDiv = document.getElementById('birth-info');
  if (birthInfoDiv) {
    birthInfoDiv.innerHTML = birthInfoText;
    console.log('✅ birth-info 요소에 텍스트 출력 완료');
  } else {
    console.error("⚠️ birth-info 요소를 찾을 수 없습니다.");
  }
}



// ✅ 전역 등록 (중요!)
window.handleDaeyunClick = handleDaeyunClick;


    document.getElementById('result').innerHTML = `
<div id="birth-info" style="max-width: 600px; margin-left: 20px; font-family: 'Nanum Gothic', sans-serif; font-size: 0.85rem; color: #333; margin-bottom: 8px;"></div>

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
      border: 2px solidrgb(225, 231, 167);
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

  .sinsal-highlight {
    background: #ffe97a !important;
    color: #b85c00 !important;
    font-weight: bold;
    border: 2px solid #ffba22 !important;
    border-radius: 8px;
    transition: background 0.1s;
  }
      .saju-blue {
    color: #1976d2 !important;
    font-weight: bold;
    text-shadow: 0 1px 0 #e6f3ff;
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
  <div id="birth-info"></div>
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

 <!-- ✅신살테이블 -->
<div style="height:16px;"></div>
<div id="sinsal-box"></div>

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

// 3. 주격+보조격 출력
let gyeokDisplayText = '판별불가';

if (secondaryGyeokResult?.primary && secondaryGyeokResult?.secondary) {
  // 생지(복수격)
  gyeokDisplayText = `
    <span id="gyeok-primary" style="cursor:pointer; color:#2277ff;"><b>
      ${secondaryGyeokResult.primary.char}</b>
    </span>
    <span style="font-size:0.92em;"> (보조격: </span>
    <span id="gyeok-secondary" style="cursor:pointer; color:#ff8844;">
      <b>${secondaryGyeokResult.secondary.char}</b>
    </span>
    <span style="font-size:0.92em;">)</span>
        <div style="font-size:0.85em; color:#888; margin-top:2px;">
      (격이름을 클릭시 격국식을 볼 수 있습니다)
    </div>
  `;
} else if (secondaryGyeokResult && secondaryGyeokResult.char && secondaryGyeokResult.stem) {
  // 왕지/고지: 단일 보조격
  if (gyeok && typeof gyeok === 'object' && gyeok.stem) {
    gyeokDisplayText = `
      <span id="gyeok-primary" style="cursor:pointer; color:#2277ff;">
        ${getGyeokName(dayGan, gyeok.stem)}
      </span>
      <span style="font-size:0.92em;"> (보조격: </span>
      <span id="gyeok-secondary" style="cursor:pointer; color:#ff8844;">
        ${secondaryGyeokResult.char}
      </span>
      <span style="font-size:0.92em;">)</span>
          <div style="font-size:0.85em; color:#888; margin-top:2px;">
      (격이름을 클릭시 격국식을 볼 수 있습니다)
    </div>
    `;
  } else if (typeof gyeok === 'string') {
    gyeokDisplayText = `
      <span id="gyeok-primary" style="cursor:pointer; color:#2277ff;">
        ${gyeok}
      </span>
      <span style="font-size:0.92em;"> (보조격: </span>
      <span id="gyeok-secondary" style="cursor:pointer; color:#ff8844;">
        ${secondaryGyeokResult.char}
      </span>
      <span style="font-size:0.92em;">)</span>
          <div style="font-size:0.85em; color:#888; margin-top:2px;">
      (격이름을 클릭시 격국식을 볼 수 있습니다)
    </div>
    `;
  }
} else if (gyeok && typeof gyeok === 'object' && gyeok.stem) {
  if (gyeok.char === '월비격' || gyeok.char === '월겁격') {
    gyeokDisplayText = `
      <span id="gyeok-primary" style="cursor:pointer; color:#2277ff;">
        ${gyeok.char}(${gyeok.stem})
      </span>
    `;
  } else {
    gyeokDisplayText = `
      <span id="gyeok-primary" style="cursor:pointer; color:#2277ff;">
        ${getGyeokName(dayGan, gyeok.stem)}
      </span>
    `;
  }
} else if (typeof gyeok === 'string') {
  gyeokDisplayText = `
    <span id="gyeok-primary" style="cursor:pointer; color:#2277ff;">
      ${gyeok}
    </span>
  `;
}

// 격국 표시
const gyeokDisplayEl = document.getElementById("gyeok-display");
if (gyeokDisplayEl) {
  gyeokDisplayEl.innerHTML = `격국: ${gyeokDisplayText}`;
}

if (gyeok && saju) {
  renderGyeokFlowStyled(gyeok, saju, secondaryGyeokResult);
}

// ▶ 클릭 이벤트 연결!
document.getElementById('gyeok-primary')?.addEventListener('click', () => {
  renderGyeokFlowStyled(gyeok, saju, secondaryGyeokResult);
});
document.getElementById('gyeok-secondary')?.addEventListener('click', () => {
  if (secondaryGyeokResult?.primary && secondaryGyeokResult?.secondary) {
    renderGyeokFlowStyled(secondaryGyeokResult.secondary, saju, secondaryGyeokResult.primary);
  } else {
    renderGyeokFlowStyled(secondaryGyeokResult, saju, gyeok);
  }
});


///////////////////////// 12운성, 12신살  기타 신살류 출력부//////////////////////////////////////


const ilgan = saju.dayGan;
const sajuGanArr = [saju.hourGan,  saju.dayGan,  saju.monthGan,  saju.yearGan];
const samhapKey = getSamhapKeyByJiji(saju.yearBranch);
const sajuJijiArr = [saju.hourBranch,  saju.dayBranch,  saju.monthBranch,  saju.yearBranch];
const sajuGanjiArr = [
  saju.hourGan + saju.hourBranch,
  saju.dayGan + saju.dayBranch,
  saju.monthGan + saju.monthBranch,
  saju.yearGan + saju.yearBranch
];
document.getElementById('sinsal-box').innerHTML = renderSinsalTable({ sajuGanArr, samhapKey, sajuJijiArr });



// 2. 클릭 이벤트 연결
document.querySelectorAll('.clickable').forEach(el => {
  el.onclick = function() {
    const type = this.dataset.type;
    // 같은 타입만 하이라이트 해제
    document.querySelectorAll('.clickable[data-type="' + type + '"]').forEach(e => e.classList.remove('sinsal-highlight'));
    // 자기 자신만 하이라이트
    this.classList.add('sinsal-highlight');
    // 표 갱신
    updateResultRow(this.dataset);
  };
});



// 3. 초기 추출값

const yeonji = saju.yearBranch;

// 4. **일간, 년지에 해당하는 셀 하이라이트 추가**
// - 천간
const el1 = document.querySelector(`.clickable[data-type="unseong"][data-gan="${ilgan}"]`);
if (el1) el1.classList.add('sinsal-highlight');
// - 삼합 (년지로 삼합키 추출)

const el2 = document.querySelector(`.clickable[data-type="sinsal"][data-samhap="${samhapKey}"]`);
if (el2) el2.classList.add('sinsal-highlight');

// 5. 아래쪽 표 실제 데이터 삽입
const jijiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const unseongArr = jijiArr.map(jiji => getUnseong(ilgan, jiji));
document.getElementById('unseong-row').innerHTML =
  `<th>12운성</th>${unseongArr.map(txt => `<td>${txt}</td>`).join('')}`;
const sinsalArr = jijiArr.map(jiji => getSinsal(samhapKey, jiji));
document.getElementById('sinsal-row').innerHTML =
  `<th>12신살</th>${sinsalArr.map(txt => `<td>${txt}</td>`).join('')}`;


// 8. 지지 td에 마우스 오버/아웃 이벤트로 미니표 안내
const miniUnseongRow = document.getElementById('mini-unseong-row');
const miniUnseongTd = miniUnseongRow.firstElementChild;

document.querySelectorAll('.jiji-clickable').forEach(td => {
  td.addEventListener('mouseenter', function() {
    const hoverJiji = this.dataset.jiji;
    const ganList = ['甲','乙','丙','丁','庚','辛','壬','癸'];
    // 사주 천간 4자, 이 스코프에 있어야 함!
    // const sajuGanArr = [saju.yearGan, saju.monthGan, saju.dayGan, saju.hourGan];

    // 사주천간일 때만 파랑색, 나머지는 그대로
const firstRow = `<tr>${ganList.map(gan =>
  `<td style="${sajuGanArr.includes(gan) ? 'color:#1976d2;' : ''}">${gan}</td>`
).join('')}</tr>`;

    const secondRow = `<tr>${ganList.map(gan => `<td>${getUnseong(gan, hoverJiji)}</td>`).join('')}</tr>`;
    miniUnseongTd.innerHTML = `
      <div style="margin-bottom:2px;">
        <b style="color:red;">${hoverJiji}</b>에 대한 천간별 12운성
      </div>
      <table style="border-collapse:collapse; margin:auto;">
        ${firstRow}
        ${secondRow}
      </table>
    `;
    miniUnseongRow.style.display = "";   // 행 보이기
  });
  td.addEventListener('mouseleave', function() {
    miniUnseongTd.innerHTML = '';        // 내용 비우기
    miniUnseongRow.style.display = "none"; // 행 자체 숨기기
  });
});



/////////////////12신살,12운성출력 끝 /////////////////////////////////////








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

await showBirthInfo(data);  // 이 위치가 딱 좋아요!


// 여기서 바로!
renderGyeokFlowStyled(gyeok, saju, secondaryGyeokResult);







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


