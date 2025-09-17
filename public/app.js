// app.js


// git add .
// git commit -m "일간왕쇠강약"   
// git push origin main
// git push
//강제실행   vercel --prod --force


//로그 다시 실행
//console.clear();  console.log("🔥 전체 다시 실행됨");  console.log("👉 현재 saju:", JSON.stringify(saju));



// 상수
import { 
  elementMap, 
  DANGRYEONGSHIK_MAP,
  yukshinToKey,  
  tenGodMap,
  tenGodMapKor,
  YANG_GAN, YIN_GAN,
  jijiToSibganMap,
  간합MAP, 
  SAMHAP_SUPPORT,
  GYEOKGUK_TYPES,
  jijiToSibganMap2,jijiToSibganMap3,
  HEESIN_GISIN_COMBINED, 
  HEESIN_BY_DANGRYEONG_POSITION,
  GISIN_BY_DANGRYEONG_POSITION, 
  johuBasis, johuMap, johuMeaning, SANGSAENG_MAP, SANGGEUK_MAP
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
  extractCheonganHeesinGisin, extractJijiHeesinGisin,   
  renderJohuCell, extractSajuGanList, getJohuApplyType, calculateTaegwaBulgeup,
  renderTaegwaBulgeupList, buildCountMap, makeSajuInfoTable, renderSimpleTable, updateSimpleTable
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
  arrangeByPosition, renderBasicDaeyunTable, handleBasicDaeyunClick,basicSewoonClick, 
  highlightInitialDaeyun, highlightInitialSewoon
} from './renderUtils.js';

import {
  getGyeokForMonth,
  hasSamhap,
  getGyeokName,
  getYukshin,
  getUseGuByGyeok,
  renderGyeokFlowStyled,
  getSecondaryGyeok, renderhapshinTable,
  renderIlganGyeokTable, getGyeokGrade
} from './gyeokUtils.js';

import { renderSinsalTable, 
         getUnseong, 
         getSinsal, 
         getSamhapKeyByJiji, 
         renderEtcSinsalTable
      } from './sinsalUtils.js';




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



let outputMode = "basic"; // 기본값: 사주출력


//
window.handleDaeyunClick = handleDaeyunClick;
window.handleSewoonClick = handleSewoonClick;
// ✅ 전역에 노출
window.handleBasicDaeyunClick = handleBasicDaeyunClick;
window.basicSewoonClick = basicSewoonClick;
// app.js 최상단
window.selectedDaewoon = {
  type: "daewoon",
  stem: null,     // 천간
  sibshin: null,  // 십신
  branch: null    // 지지
};

window.selectedSewoon = {
  type: "sewoon",
  year: null,
  stem: null,
  sibshin: null,
  branch: null
};

console.log("▶ 전역 초기화:", {
  selectedDaewoon: window.selectedDaewoon,
  selectedSewoon: window.selectedSewoon
});

async function initDaewoonSewoon() {
  highlightInitialDaeyun();
  highlightInitialSewoon();
  console.log("▶ 전역 초기화 완료:", {
    daewoon: window.selectedDaewoon,
    sewoon: window.selectedSewoon
  });

  
}

//사주+대운+세운 간, 지 리스트 모음
// 사주+대운+세운 간, 지 리스트 모음
function getAllCompareLists(saju) {
  if (!saju) {
    console.warn("⚠️ saju 객체가 없습니다:", saju);
    const empty = { 
      allStemList: [], allBranchList1: [], allBranchList2: [], allGanjiList: [],
      daewoonSewoonStemList: [], daewoonSewoonBranchList1: [], daewoonSewoonBranchList2: [],
      sajuStemList: [], sajuBranchList1: [], sajuBranchList2: []
    };
    Object.assign(window, empty); // 전역 등록
    return empty;
  }

  // 1. 배열로 변환
  const chunganArr = [saju.yearGan, saju.monthGan, saju.dayGan, saju.hourGan];
  const jijiArr    = [saju.yearBranch, saju.monthBranch, saju.dayBranch, saju.hourBranch];

  // --- (추가) 사주 전용 리스트 (사주만 별도 추출)
  const sajuStemList = chunganArr.map(x => ({ type: "saju", value: x }));
  const sajuBranchList1 = jijiArr.map(x => ({ type: "saju", value: x }));
  const sajuBranchList2 = [];
  sajuBranchList1.forEach(item => {
    const sibgans = jijiToSibganMap3[item.value] || [];
    sibgans.forEach(sib => {
      sajuBranchList2.push({
        type: "saju",
        value: sib,
        isMiddle: false
      });
    });
  });

  // --- 2. 천간 리스트 (사주+대운+세운)
  const allStemList = [
    ...sajuStemList
  ];
  if (window.selectedDaewoon?.stem) {
    allStemList.push({ type: "daewoon", value: window.selectedDaewoon.stem });
  }
  if (window.selectedSewoon?.stem) {
    allStemList.push({ type: "sewoon", value: window.selectedSewoon.stem });
  }

  // --- 3. 지지 리스트 (사주+대운+세운)
  const allBranchList1 = [
    ...sajuBranchList1
  ];
  if (window.selectedDaewoon?.branch) {
    allBranchList1.push({ type: "daewoon", value: window.selectedDaewoon.branch });
  }
  if (window.selectedSewoon?.branch) {
    allBranchList1.push({ type: "sewoon", value: window.selectedSewoon.branch });
  }

  // 지지→지장간 변환
  const allBranchList2 = [
    ...sajuBranchList2
  ];
  allBranchList1.forEach(item => {
    if (item.type === "saju") return; // 이미 사주는 위에서 처리됨
    const sibgans = jijiToSibganMap3[item.value] || [];
    sibgans.forEach(sib => {
      allBranchList2.push({
        type: item.type,
        value: sib,
        isMiddle: false
      });
    });
  });

  // --- 4. 간지 리스트 (사주+대운+세운)
  const allGanjiList = chunganArr.map((stem, i) => ({
    type: "saju",
    value: stem + (jijiArr[i] || "")
  }));
  if (window.selectedDaewoon?.stem && window.selectedDaewoon?.branch) {
    allGanjiList.push({
      type: "daewoon",
      value: window.selectedDaewoon.stem + window.selectedDaewoon.branch
    });
  }
  if (window.selectedSewoon?.stem && window.selectedSewoon?.branch) {
    allGanjiList.push({
      type: "sewoon",
      value: window.selectedSewoon.stem + window.selectedSewoon.branch
    });
  }

  // --- 5. 대운+세운 전용 리스트 ---
  const daewoonSewoonStemList = [];
  if (window.selectedDaewoon?.stem) {
    daewoonSewoonStemList.push({ type: "daewoon", value: window.selectedDaewoon.stem });
  }
  if (window.selectedSewoon?.stem) {
    daewoonSewoonStemList.push({ type: "sewoon", value: window.selectedSewoon.stem });
  }

  const daewoonSewoonBranchList1 = [];
  if (window.selectedDaewoon?.branch) {
    daewoonSewoonBranchList1.push({ type: "daewoon", value: window.selectedDaewoon.branch });
  }
  if (window.selectedSewoon?.branch) {
    daewoonSewoonBranchList1.push({ type: "sewoon", value: window.selectedSewoon.branch });
  }

  const daewoonSewoonBranchList2 = [];
  daewoonSewoonBranchList1.forEach(item => {
    const sibgans = jijiToSibganMap3[item.value] || [];
    sibgans.forEach(sib => {
      daewoonSewoonBranchList2.push({
        type: item.type,
        value: sib,
        isMiddle: false
      });
    });
  });

   const result = {
    allStemList,            // 사주+대운+세운 천간
    allBranchList1,         // 사주+대운+세운 지지
    allBranchList2,         // 사주+대운+세운 지장간
    allGanjiList,           // 사주+대운+세운 간지

    daewoonSewoonStemList,      // 대운+세운 천간
    daewoonSewoonBranchList1,   // 대운+세운 지지
    daewoonSewoonBranchList2,   // 대운+세운 지장간

    sajuStemList,           // (추가) 사주 천간
    sajuBranchList1,        // (추가) 사주 지지
    sajuBranchList2         // (추가) 사주 지장간
  };
  // 🔹 디버깅 로그
 // console.group("▶ getAllCompareLists 결과");
  //console.log("allStemList:", result.allStemList);
  //console.log("allBranchList1:", result.allBranchList1);
 // console.log("allBranchList2:", result.allBranchList2);
 // console.log("allGanjiList:", result.allGanjiList);
// console.log("daewoonSewoonStemList:", result.daewoonSewoonStemList);
 // console.log("daewoonSewoonBranchList1:", result.daewoonSewoonBranchList1);
 // console.log("daewoonSewoonBranchList2:", result.daewoonSewoonBranchList2);
 // console.log("sajuStemList:", result.sajuStemList);
 // console.log("sajuBranchList1:", result.sajuBranchList1);
 // console.log("sajuBranchList2:", result.sajuBranchList2);
 // console.groupEnd();
  // --- 🔹 전역 등록 ---
  Object.assign(window, result);

  return result;
}




window.getAllCompareLists = getAllCompareLists;

// 기존 할당 보존
const _origDaeyunClick = handleDaeyunClick;
const _origSewoonClick = handleSewoonClick;

// 대운 클릭 시 원래 로직 실행 후 신살 갱신
window.handleDaeyunClick = function(...args) {
  _origDaeyunClick(...args);
  setTimeout(() => rerenderSinsal(), 0);
};

// 세운 클릭 시 원래 로직 실행 후 신살 갱신
window.handleSewoonClick = function(...args) {
  _origSewoonClick(...args);
  setTimeout(() => rerenderSinsal(), 0);
};

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



////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// 버튼 이벤트 연결
document.querySelector('.btn-success').addEventListener('click', () => {
  outputMode = "basic";
  document.getElementById("saju-form").requestSubmit();
});

document.getElementById('sinsalBtn').addEventListener('click', () => {
  outputMode = "sinsal";
  document.getElementById("saju-form").requestSubmit();
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

// 서버 응답 후에 전역 등록
window.daeyunAge = data.daeyunAge;
window.ganji = data.ganji;  // {year, month, day, time}
window.jeolipDate = data.thisTerm?.date;
window.jeolipName = data.thisTerm?.name;
window.solarBirthday = data.solar; // {year, month, day, hour, minute}
window.yearStemKor = data.yearStemKor;
window.gender = data.gender;

// 확인용 로그
console.log("▶ 전역 등록:", {
  daeyunAge: window.daeyunAge,
  ganji: window.ganji,
  jeolipDate: window.jeolipDate,
  jeolipName: window.jeolipName,
  solarBirthday: window.solarBirthday,
  yearStemKor: window.yearStemKor,
    gender: window.gender,
 
});
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

const birthDateObj = new Date(window.birthYear, window.birthMonth - 1, window.birthDay, window.birthHour, window.birthMinute);
//console.log('▶ birthDateObj:', birthDateObj);
//console.log('window.birthYear:', window.birthYear);
//console.log('window.birthMonth:', window.birthMonth);
//console.log('window.birthDay:', window.birthDay);
//console.log('window.birthHour:', window.birthHour);
//console.log('window.birthMinute:', window.birthMinute);
// ----------------------
// 3. 대운 시작 나이/순행·역행

const yearStemKor = data.yearStemKor;
// 월간/월지 분리
const monthGanji3 = data.ganji.month;
const monthJi = monthGanji3.charAt(1);  // 두 번째 글자

// 전역 등록
window.monthGanji = data.ganji.month;     // "壬申"
window.monthGan = window.monthGanji.charAt(0); // "壬"
window.monthJi = window.monthGanji.charAt(1);  // "申"

console.log("▶ 월간지 등록:", {
  monthGanji: window.monthGanji,
  monthJi: window.monthJi
});
// 대운 관련 전역값도 함께 등록

window.daYunDirection = getDaYunDirection(window.gender, window.yearStemKor);

// ----------------------
// 4. 당령/사령 계산 (순서 보장됨)
// ----------------------
// 월지 기준으로 당령/사령 계산
const dangryeong = getDangryeong(window.monthJi, window.daeyunAge, window.daYunDirection);
const saryeong   = getSaryeong(window.monthJi, window.daeyunAge, window.daYunDirection);

// 전역 등록
window.dangryeong = dangryeong;
window.saryeong   = saryeong;
window.trueDangryeongChar = dangryeong; // 희·기신용


console.log("▶ 전역 등록2:", {
  daeyunAge: window.daeyunAge,
  daeyunDirection: window.daYunDirection,
  dangryeong: window.dangryeong,
  saryeong: window.saryeong,
  trueDangryeongChar: window.trueDangryeongChar
});

  // 절기테스트  임시////////////////////




// 1. 출생일 Date 객체 준비
// 1. 생일 객체 생성
const birthDate = new Date(window.birthYear, window.birthMonth - 1, window.birthDay, window.birthHour, window.birthMinute);
console.log("▶ 생년월일시 (KST):", birthDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));




// 2. 절입일 구하기 (동기 API 사용 가정)
// ✅ 올바른 방식으로 호출
//const jeolipDate = new Date(await getJeolipDateFromAPI(window.birthYear, window.birthMonth, window.birthDay));

let html = "";   // ✅ 반드시 선언

// ⚡ 먼저 분해 (이미 app.js 안에서 하고 있음)
const yearGanji = splitGanji(data.ganji.year); 
const monthGanji = splitGanji(data.ganji.month); 
const dayGanji = splitGanji(data.ganji.day); 
const timeGanji = splitGanji(data.ganji.time);


const ganList2 = [
  yearGanji.gan,  // 예: "己"
  monthGanji.gan, // 예: "壬"
  dayGanji.gan,   // 예: "庚"
  timeGanji.gan   // 예: "丁"

];
const jijiList = [
  data.ganji.year.slice(1),   // 酉
  data.ganji.month.slice(1),  // 申
  data.ganji.day.slice(1),    // 午
  data.ganji.time.slice(1)    // 丑
];




console.log("👉 jijiList:", jijiList);
console.log("👉 ganList2:", ganList2);

const target = document.querySelector("#saju-relations");
if (target) {
  target.innerHTML = makeSajuInfoTable(jijiList, ganList2);
}

// 원본 값 (소수점 유지)
const daeyunAgeRaw = data.daeyunAge;
window.daeyunAgeRaw = daeyunAgeRaw;

// 표시용 값 (소수점 1자리, 반올림 또는 버림)
const daeyunAge = Number(daeyunAgeRaw.toFixed(2));
window.daeyunAge = daeyunAge;

//console.log('▶ daeyunAge2:', daeyunAge);



    if (!response.ok) throw new Error('서버 오류 발생');






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

//const monthJi = monthGanji.ji;  // 월지(예: '子', '丑' 등)

const daYunDirection = getDaYunDirection(gender, yearStemKor);
//console.log('gender:', gender);
//console.log('yearStemKor:', yearStemKor);
//console.log('⚡ daYunDirection (1: 순행, -1: 역행):', daYunDirection);
//console.log('🎯 daeyunAge1[역행적용전]:', data.daeyunAge);

//createDangryeongTableHtml(dangryeong, saryeong, dangryeongShikArray, monthJi);
//console.log("사령:", saryeong);

// 당령 결과를 UI에 표시하거나 전역 변수로 저장 가능

// 사주 천간과 지지를 result에서 추출


 // console.log('월간 천간:', monthGanji.gan);
 // console.log('월지 지지:', monthGanji.ji);
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
  dangryeong,
    // ✅ 태과불급 태그 저장용
  johuTags: []
};

// 전역에서도 쓸 수 있게 등록
window.saju = saju;

window.sajuJijiArray = [
  saju.hourBranch,
  saju.dayBranch,
  saju.monthBranch,
  saju.yearBranch
];


const {
  allStemList,
  allBranchList1,
  allBranchList2,
  allGanjiList1,
  allGanjiList2
} = getAllCompareLists(saju);

console.log("함수 호출 결과:", {
  allStemList,
  allBranchList1,
  allBranchList2,
  allGanjiList1,
  allGanjiList2
});

// 사주 데이터가 준비된 시점

// 2. 천간/지지 리스트 뽑기
const ganList = extractSajuGanList(saju);

// 3. 글자 개수 맵 만들기
const countMap = buildCountMap(ganList);

// 4. 태과불급 + 조후 출력
console.log("호출 직전 saju:", saju);

// 여기서 renderTaegwaBulgeupList 호출
// ✅ 원본을 먼저 계산해서 넘겨라
const taegwaResult = calculateTaegwaBulgeup(saju, dangryeong);

// sanity check
//console.log("📦 taegwaResult type:", typeof taegwaResult, Array.isArray(taegwaResult) ? "Array" : "");
if (taegwaResult && typeof taegwaResult === "object") {
 // console.log("📦 taegwaResult keys:", Object.keys(taegwaResult));
  //console.log("📦 taegwaResult.detail len:", Array.isArray(taegwaResult.detail) ? taegwaResult.detail.length : "no detail");
  //console.log("📦 taegwaResult.list len:", Array.isArray(taegwaResult.list) ? taegwaResult.list.length : "no list");
}

console.log("🚩 renderTaegwaBulgeupList 호출 직전:", taegwaResult);
const { html: tb, johuTags } = renderTaegwaBulgeupList(taegwaResult, saju, ganList, countMap);
//console.log("✅ renderTaegwaBulgeupList 호출 이후:", tb, johuTags);

saju.johuTags = johuTags || [];

let combinedHTML = tb;
try {
  const johu = renderJohuCell(saju);
  combinedHTML += johu;
} catch (e) {
  console.error("❌ renderJohuCell 실행 중 에러:", e);
}
  

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
console.log("▶ saju:", saju);
const gyeokResult = getGyeokForMonth({ 
  monthJi, saryeong, chunganList, dayGan, daeyunAge, daYunDirection, saju, otherJijiArr 
});
console.log("▶ gyeokResult:", gyeokResult);
// 격 이름 (예: "건록격")
const gyeokName = gyeokResult?.char || "미판정";
console.log("▶ gyeokName:", gyeokName);
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
console.log("▶ secondaryGyeokResult:", secondaryGyeokResult);
// 격 기준이 된 천간 (예: "庚")
const gyeokGanHanja = gyeokResult.stem;

// 격 데이터 패키징 (여기서 바로 묶음)
const gyeokData = {
  primaryName: gyeokName || "미판정",                 
  primaryStem: gyeokGanHanja || "-",                  
  secondaryName: secondaryGyeokResult?.char || "X",   
  secondaryStem: secondaryGyeokResult?.stem || null   
};



//console.log("격국:", gyeok);
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
   // console.log('dangryeongShikArray:', dangryeongShikArray);
  //console.log('Array.isArray:', Array.isArray(dangryeongShikArray));

 const dangryeongHtml = createDangryeongTableHtml(
  dangryeong,
  saryeong,
  dangryeongShikArray,
  monthJi,
  jijiList,
  ganList2
);
 // console.log(dangryeongHtml);
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
// 기존 지역변수 → 전역으로 등록
window.dangryeongList = dangryeongArray.map((char, idx) => ({
  pos: idx + 1,
  char
}));

console.log("▶ 전역 dangryeongList:", window.dangryeongList);


//console.log('[DEBUG] 당령 포지션 포함 리스트:', dangryeongList);
  // 2. 희신/기신 리스트 추출

const sajuJijiCheonganListraw = sajuJijiList.flatMap(jiji => 
  jijiToSibganMap[jiji]?.map(entry => entry.char) || []
);



const sajuJijiArray =[timeGanji.ji, dayGanji.ji, monthGanji.ji, yearGanji.ji];
const flatSibganList = extractJijiSibgansWithMiddleInfo(sajuJijiArray);
const { cheonganHeesinList, cheonganGisinList } = extractCheonganHeesinGisin(dangryeong, sajuCheonganList);
const { jijiHeesinList, jijiGisinList } = extractJijiHeesinGisin(dangryeong, sajuJijiArray);

// ✅ 전역 등록
window.cheonganHeesinList = cheonganHeesinList;
window.cheonganGisinList = cheonganGisinList;
window.jijiHeesinList = jijiHeesinList;
window.jijiGisinList = jijiGisinList;

console.log("🌍 전역 등록 완료:", {
  cheonganHeesinList,
  cheonganGisinList,
  jijiHeesinList,
  jijiGisinList
});

//console.log('사주 천간:', sajuChungan);
//console.log('사주 지지:', sajuJijiList);
//console.log('[DEBUG] 사주 천간 리스트:', sajuCheonganList);
//console.log('[DEBUG] 사주 지지 리스트[raw]:', sajuJijiCheonganListraw);
// 기준 희신 리스트 생성 및 출력
const heesinMap = HEESIN_BY_DANGRYEONG_POSITION[dangryeong] || {};
const 기준희신리스트 = Object.entries(heesinMap).map(
  ([pos, char]) => ({ char, pos: Number(pos) })
);
//console.log('[DEBUG] 기준 희신 리스트:', 기준희신리스트);

// 기준 기신 리스트 생성 및 출력
const gisinMap = GISIN_BY_DANGRYEONG_POSITION[dangryeong] || {};
const 기준기신리스트 = [];
Object.entries(gisinMap).forEach(([pos, chars]) => {
  const sourcePos = Number(pos);
  chars.forEach(char => {
    기준기신리스트.push({ char, pos: Number(pos) });
  });
});
//console.log('[DEBUG] 기준 기신 리스트:', 기준기신리스트);
////console.log('[DEBUG] 지지 속 천간 리스트:', sajuJijiCheonganList);

  // 3. 각 리스트를 위치별 배열로 변환 (arrangeByPosition 함수 활용)
  /////////////////////////const cheonganGisinByPos = arrangeByPosition(cheonganGisinList);
  //const cheonganHeesinByPos = arrangeByPosition(cheonganHeesinList);

  //const jijiHeesinByPos = arrangeByPosition(jijiHeesinList);
  //const jijiGisinByPos = arrangeByPosition(jijiGisinList);
//console.log('[DEBUG] 추출한 천간 희신 리스트:', cheonganHeesinList);
//console.log('[DEBUG] 추출한 천간 기신 리스트:', cheonganGisinList);
//console.log('[DEBUG] 추출한 지지 희신 리스트:', jijiHeesinList);
//console.log('[DEBUG] 추출한 지지 기신 리스트:', jijiGisinList);
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
const dangryeongHtml = createDangryeongTableHtml(dangryeong, saryeong, dangryeongShikArray, monthJi, jijiList, ganList2);


const startStemKor = convertHanToKorStem(monthGanji.gan);
const startBranchKor = normalizeBranch(monthGanji.ji);
  //console.log('대운 시작 천간 (한글):', startStemKor);
  //console.log('대운 시작 지지 (한글):', startBranchKor);
 // console.log('✅ startBranchKor:', startBranchKor); // 예: '신'
//const rawBranchIndex = branchOrder.indexOf(startBranchKor);
//const offset = daYunDirection === 1 ? 2 : -2;
//const adjustedBranchIndex = (rawBranchIndex + offset + 12) % 12;
//const correctedBranchKor = branchOrder[adjustedBranchIndex];
//console.log('🎯 보정된 대운 지지 시작점 (한글):', correctedBranchKor);
// 기존 보정 로직 제거 후, 이 한 줄만 남깁니다
const correctedBranchKor = startBranchKor;



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

const ageLabels = [];  

for (let i = daeyunPairs.length - 1; i > 0; i--) {
  const ageValue = correctedStartAge + (i - 1) * 10;
  ageLabels.push(ageValue.toFixed(2));
}

// 마지막에 "월주" 추가
ageLabels.push("월주");


// 👉 정렬만 내림차순으로 적용
ageLabels.sort((a, b) => parseFloat(b) - parseFloat(a));

//console.log('daeyunPairs:', daeyunPairs.map(p => p.stem + p.branch).join(', '));
//console.log('pairsToRender:', pairsToRender.map(p => p.stem + p.branch).join(', '));
//console.log('ageLabels:', ageLabels);



//const result = calculateSewonYear(1969, 8, 23, 5.1);
//console.log('계산된 세운 시작년도:', result);


const sewonYear = calculateSewonYear(birthYear, birthMonth, birthDay, daeyunAgeRaw);
window.sewonYear = sewonYear; // 여기 추가!
//console.log('🎯 세운 시작년도 (소숫점1):', sewonYear);



const isEumYear = ['을', '정', '기', '신', '계'].includes(yearStemKor); // 음간 여부 체크
//console.log('daYunDirection:', daYunDirection);

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
  console.log("👉 showBirthInfo 진입, data:", data);

  let solarTerm = "절입시 정보 없음";

  if (data.thisTerm && data.nextTerm) {
    const pad = (n) => n.toString().padStart(2, '0');
    const fmt = (val) => {
      const d = (val instanceof Date) ? val : new Date(val);
      if (isNaN(d)) return "날짜 오류";
      return `${pad(d.getMonth() + 1)}월 ${pad(d.getDate())}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // ✅ 현재절기 = thisTerm.name
    solarTerm = `<span style="color:red;">${data.thisTerm.name}</span> 
                 (${fmt(data.thisTerm.date)}) 
                 ~ ${data.nextTerm.name} (${fmt(data.nextTerm.date)})`;

  } else if (data.jeolipDate) {
    console.log("📭 서버 thisTerm/nextTerm 없음, jeolipDate 사용:", data.jeolipDate);

    const jeolipDateObj = new Date(data.jeolipDate);
    if (!isNaN(jeolipDateObj)) {
      const pad = (n) => n.toString().padStart(2, '0');
      const jeolipStr = `${pad(jeolipDateObj.getMonth() + 1)}월 ${pad(jeolipDateObj.getDate())}일 ${pad(jeolipDateObj.getHours())}:${pad(jeolipDateObj.getMinutes())}`;
      solarTerm = `절입 (${jeolipStr})`;
    } else {
      console.log("⚠️ jeolipDate 파싱 실패:", data.jeolipDate);
      solarTerm = "절입시 정보 오류";
    }

  } else {
    console.log("❌ 서버 절입 데이터도 없고 jeolipDate도 없음");
  }

  const pad = (n) => n.toString().padStart(2, '0');
  // ✅ window 변수 대신 서버에서 내려준 data.solar 사용
  const solarDate = `${data.solar.year}-${pad(data.solar.month)}-${pad(data.solar.day)} ${pad(data.solar.hour)}:${pad(data.solar.minute)}`;

  const lunar = data.lunar;
  const lunarDate = lunar
    ? `${lunar.lunarYear}년 ${pad(lunar.lunarMonth)}월 ${pad(lunar.lunarDay)}일 ${lunar.hour}시 ${lunar.minute}분`
    : "정보 없음";

  const birthInfoText = `[양력] <span style="color:blue;">${solarDate}</span>  ||  [음력] ${lunarDate}  <br>  [절입시] ${solarTerm}`;

  const birthInfoDiv = document.getElementById('birth-info');
  if (birthInfoDiv) {
    birthInfoDiv.innerHTML = birthInfoText;
  } else {
    console.error("⚠️ birth-info 요소를 찾을 수 없습니다.");
  }
}







// ✅ 전역 등록 (중요!)
window.handleDaeyunClick = handleDaeyunClick;




    document.getElementById('common-section').innerHTML = `

    <div style="width:100%; max-width:100%; margin-left: 0;">
      <style>



#result .parent {
  border-collapse: collapse;
  border: none !important;
  margin: 0;
  padding: 0;
  width: 100%;
  table-layout: fixed;
}

#result .parent td,
#result .parent th {
  border: none !important;
  margin: 0;
  padding: 0;
}

.ganji-table {
  border-collapse: collapse;
  margin: 0;                  /* 바깥 여백 제거 */
  padding: 0;                 /* 안쪽 여백 제거 */
  width: 100%;                /* 부모셀 폭에 맞춰 자동 조정 */
  font-family: 'Nanum Gothic', sans-serif;
  font-size: 3rem;
  text-align: center;
  table-layout: fixed;        /* 화면 줄면 셀도 줄어듦 */
  border: none;               /* ✅ 외곽 큰 테두리 제거 */
}

.ganji-table th {
  background-color: #ddd;
  padding: 10px;
  font-size: 1.1rem;
  border: 1px solid #000;     /* ✅ 각 헤더 칸에만 테두리 */
}

.ganji-table td {
  padding: 2px 6px;
  line-height: 1.0;
  vertical-align: middle;
  border: 1px solid #000;     /* ✅ 각 데이터 칸에만 테두리 */
}



.daeyun-table {
  font-size: 0.85rem;
  text-align: center;
  width: 100%;              /* ✅ 부모 폭에 맞춤 */
  margin: 10px auto;
  border-collapse: collapse;
  table-layout: fixed;       /* ✅ 칸 비율로 강제 */
  word-break: break-word;
  white-space: normal;       /* ✅ 줄바꿈 허용 */
}

.daeyun-table,
.sewoon-table,
.wolwoon-table {
  margin: 0;              /* 위아래 여백 제거 */
  border-collapse: collapse;
}

#yearly-series,
#yearly-ganji-container {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.daeyun-table th,
.daeyun-table td {
  width: 14%;                /* ✅ 7칸이면 100/7 → 비율로 자동 */
  padding: 0.3rem;
}

/* 셀 내부 */
.daeyun-cell {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  font-size: 0.85rem;
  line-height: 1.2;
  text-align: center;
  word-break: break-word;
  white-space: normal;
}

/* 선택 효과는 그대로 */
.daeyun-table tbody tr:nth-child(2) td.daeyun-selected {
  background: rgba(255, 235, 59, 0.45) !important;
  box-shadow: inset 0 0 0 2px #f1c40f !important;
  border-radius: 6px;
}
.daeyun-cell.selected {
  border: 2px solid rgb(225, 231, 167);
  border-radius: 6px;
}

/* 세운/연간지 표도 동일하게 비율 기반 */
#yearly-series td,
#yearly-ganji-container td,
.sewoon-table td, 
.wolwoon-table td {
  width: auto;              /* ✅ px → auto */
  padding: 2px;
  font-size: 0.75rem;
  white-space: normal;       /* ✅ 줄바꿈 허용 */
  word-break: break-word;
  text-align: center;
  vertical-align: middle;
}
.sewoon-cell {
  padding: 2px !important;
  font-size: 0.7rem;
  line-height: 1.1;
  text-align: center;
  vertical-align: top;
  white-space: normal;
  word-break: break-word;
}



/* 세운/월운 테이블 전용 */
.sewoon-table td, 
.wolwoon-table td {
  width: 35px !important;   /* 셀 가로폭 줄이기 */
  padding: 1px !important;  /* 안쪽 여백 최소화 */
  font-size: 0.75rem;       /* 글자 크기 줄이기 */
  line-height: 1.1;         /* 줄 간격 압축 */
}

.sewoon-table,
.wolwoon-table {
  border-collapse: collapse;
  margin: 0 auto;        /* 위아래 여백 제거 */
}

.sewoon-table + .wolwoon-table {
  margin-top: 0;       /* 두 표 사이 간격만 최소 */
}


.dangryeong-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 1rem;
  text-align: center;
  table-layout: fixed;
  border: none; /* 전체 테두리 제거 */
}
.dangryeong-table td {
  border: none; /* 기본선 제거 */
}
.dangryeong-table td + td {
  border-left: 1px solid #ccc; /* 두 칸 사이 세로선만 표시 */
}


.sinsal-table {
  table-layout: fixed;
  width: 100%;
  word-wrap: break-word;
  white-space: normal;   /* 줄바꿈 허용 */
}

.sinsal-table td, 
.sinsal-table th {
  max-width: 80px;       /* 셀 최대 폭 제한 */
  overflow: hidden;      /* 넘치면 숨김 */
  text-overflow: ellipsis; /* ... 처리 */
}


.sewoon-cell.selected {
  background-color: #ffeaa7 !important;
  border: 2px solid #fdcb6e !important;
  border-radius: 6px;
}

#yearly-ganji-container .wolwoon-cell.selected {
  background: #ffeaa7 !important;
  border: 2px solid #fdcb6e !important;
  border-radius: 6px;
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

 
.note-box {
  font-size: 0.75rem;
  color: #555;
  line-height: 1.2;
  margin-left: 20px;
  white-space: pre-line;   /* 개행문자는 살림 */
  overflow-wrap: break-word; /* 화면 줄어들면 자동 줄바꿈 */
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

 #today-saju-container {
  margin: 0;              /* 부모셀에 딱 붙게 */
  padding: 0;             /* 내부 패딩 제거 */
  width: 100%;            /* 부모 td에 맞게 꽉 차도록 */
  max-width: 50%;        /* 부모보다 커지지 않게 */
  box-sizing: border-box; /* 패딩 포함 크기 계산 */
}

#today-saju-container table {
  width: 100%;            /* 안의 표도 td 크기에 맞춰서 */
  border-collapse: collapse;
}


.basic-daeyun-table {
  width: 80%;
  border-collapse: collapse;
  table-layout: fixed;
  margin-top: 8px;   /* ✅ 위쪽 여백 추가 */
}

.basic-daeyun-table th,
.basic-daeyun-table td {
  border: 1px solid #ccc;
  padding: 4px;
  text-align: center;
  vertical-align: middle;
  word-wrap: break-word;
  font-size: 0.7rem;
  display: table-cell; /* ✅ 강제로 table-cell 지정 */
}


.basic-daeyun-table th {
  background: #f5f5f5;
}

@media (max-width: 600px) {
  .basic-daeyun-table th,
  .basic-daeyun-table td {
    font-size: 0.7rem;
    padding: 2px;
  }
}

.basic-daeyun-table td.selected {
  background-color: #ffe08a !important;  /* 노란색 강조 */
  font-weight: bold;
}

td.classList.add("sewoon-cell");
td.onclick = () => {
  document.querySelectorAll('#basic-daeyun-table .sewoon-cell').forEach(x => x.classList.remove('selected'));
  td.classList.add("selected");
};
.basic-daeyun-table .sewoon-cell.selected {
  background-color: #c2e0ff !important; /* 파란빛 강조 */
  font-weight: bold;
}
const td = document.createElement("td");
td.classList.add("sewoon-cell");   // ✅ 세운은 반드시 sewoon-cell

td.classList.add("sewoon-cell");
td.setAttribute("data-year", year);   // ✅ 세운 연도 저장



/* 조후셀 안에 있는 표를 부모 td 안으로 가두기 */
#johuyongsin-cell {
  max-width: 100%;        /* 부모 td 크기 이상 커지지 않음 */
  min-width: 0;           /* 강제 최소 크기 제거 */
  overflow-x: hidden;     /* 넘치는 부분 잘라내기 */
  word-break: break-word; /* 긴 글자 강제 줄바꿈 */
  white-space: normal;    /* 줄바꿈 허용 */
  box-sizing: border-box;
}

/* 조후표 자체도 td 폭에 맞게 */
#johuyongsin-cell table {
  width: 100% !important;   /* 부모 td 폭에 맞게 */
  min-width: 0 !important;  /* 고정 크기 제거 */
  table-layout: fixed;      /* 내용이 커도 칸을 td 폭에 강제로 맞춤 */
}

/* 부모 div가 감싸면서 강제로 폭 제한 */
#dangryeong-cell {
  max-width: 100%;
  overflow-x: hidden;       /* 넘치면 잘라내기 */
  box-sizing: border-box;
}

/* 안쪽 표는 무조건 부모에 맞추기 */
#dangryeong-cell table {
  width: 100% !important;   /* 부모 폭에 맞게 강제 */
  min-width: 0 !important;  /* 고정 크기 제거 */
  table-layout: fixed;      /* 칸 강제 줄어들기 */
  border-collapse: collapse;
}

/* 셀 안의 글자 줄바꿈 허용 */
#dangryeong-cell td,
#dangryeong-cell th {
  white-space: normal;      /* 줄바꿈 허용 */
  word-break: break-word;   /* 긴 글자 강제 줄바꿈 */
  overflow-wrap: break-word;
}


  .responsive-table {
    width: 100%;
    max-width: 800px; /* 필요시 최대 크기 제한 */
    margin: auto;
    border-collapse: collapse;
    font-size: 14px;
  }

  .responsive-table th,
  .responsive-table td {
    padding: 4px;
    text-align: center;
    word-break: keep-all; /* 글자 줄바꿈 방지 */
  }

  /* 작은 화면에서 폰트와 간격 줄이기 */
  @media screen and (max-width: 600px) {
    .responsive-table {
      font-size: 12px;
    }
    .responsive-table th,
    .responsive-table td {
      padding: 2px;
    }
  }
        
  /* 부모 레이아웃 테이블 */
.layout-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;   /* 칸 크기 고정 배분 */
}

/* 셀 공통 스타일 */
.layout-table td {
  vertical-align: top;
  padding: 0.5rem;
  border: none;
  word-break: break-all;   /* 글자가 셀 크기보다 길면 줄바꿈 */
  white-space: normal;     /* 강제로 한 줄 유지하지 않음 */
  overflow-wrap: break-word;
}

/* 자식 박스가 부모를 뚫지 않게 */
.daeyun-table-container,
#yearly-series,
#yearly-ganji-container,
#sinsal-box,
#etc-sinsal-box {
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 내부 표도 같이 줄어들게 */
.daeyun-table-container table,
#sinsal-box table,
#etc-sinsal-box table {
  width: 100%;
  table-layout: fixed;
  font-size: 0.9rem; /* 기본 크기 */
}

/* 작은 화면에서는 글자 크기 줄이기 */
@media screen and (max-width: 768px) {
  .daeyun-table-container table,
  #sinsal-box table,
  #etc-sinsal-box table {
    font-size: 0.8rem;
  }
}
@media screen and (max-width: 480px) {
  .daeyun-table-container table,
  #sinsal-box table,
  #etc-sinsal-box table {
    font-size: 0.7rem;
  }
}

  
</style>

<table class="parent">
<tr><td>
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
</td>
 <!-- 오늘의 사주 -->
<td style="
  border:none; 
  font-size:0.85rem; 
  text-align:left; 
  padding:6px;
">
<div id="birth-info" style="max-width: 600px; margin-left: 20px; font-family: 'Nanum Gothic', sans-serif; font-size: 0.85rem; color: #333; margin-bottom: 8px;"></div>

  <div id="today-saju-container" style="margin-top:5px; display:none;"></div>
</td>
</tr>
</table>

</div>

`;


    document.getElementById('basic-section').innerHTML = `

<!-- 당령 표시용 영역 -->
  <div id="basic-daeyun-table" class="basic-daeyun-container"></div>
  <div id="basic-yearly-ganji-container"></div>
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
<td style="border:1px solid #ccc; padding:4px;">
  <div id="dangryeong-cell" style="margin-bottom:8px;">
    ${makeSajuInfoTable()}
  </div>
  ${dangryeongHtml || "-"}
</td>

  

        <td style="border:1px solid #ccc; padding:4px;"><div id="gyeok-display"></div><br>
                                                        <div id="hapshin-box"></div>
</td>
       
      </tr>
      <tr>
        <td style="border:1px solid #ccc; padding:4px;">
          <div id="dangryeongshik-container" style="margin-top: 0.5rem;"></div>
        </td>
        <td style="border:1px solid #ccc; padding:4px;"><div id="gyeok-flow"></div></td>
       
      </tr>
       <tr>
      <td style="border:1px solid #ccc; padding:4px;">
  <div id="johuyongsin-cell">${renderJohuCell()}</div>
</td>
       <td style="border:1px solid #ccc; padding:4px;">${renderIlganGyeokTable({gyeokName, secondaryGyeokResult})}</td>

        </tr>
        <!-- 태과불급 전용 한 칸 -->
<tr>
  <td colspan="2" style="border:1px solid #ccc; padding:4px; color:purple;" >
 <div id="taegwa-bulgeup-cell">${tb} </div><div id="simple-table-box"></div>
</td>
</tr>



    </tbody>
  </table>
</div>






`;





document.getElementById('sinsal-section').innerHTML = `


<table class="layout-table">
  <tr>
    <td style="width:50%;">
      <div class="daeyun-table-container"></div>
      <div id="yearly-series" style="margin-top: 1rem;"></div>
      <div id="yearly-ganji-container" style="margin-top: 20px;"></div>
    </td>
    <td style="width:50%;">
      <div id="sinsal-box"></div>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <div id="etc-sinsal-box"></div>
    </td>
  </tr>
</table>


`;




//console.log('renderDaeyunTable pairsToRender:', pairsToRender.map(p => p.stem + p.branch));
//console.log('daYunDirection:', daYunDirection);
//console.log('daeyunPairs:', daeyunPairs.map(p => p.stem + p.branch).join(', '));
//console.log('ageLabels:', ageLabels);
//console.log('pairsToRender 전체:', pairsToRender);
pairsToRender.forEach((p, i) => {
  //console.log(`index ${i} 타입: ${typeof p}, 값:`, p);
});


//console.log('🧪 getGyeokForMonth 결과:', gyeok);

// 3. 주격+보조격 출력
let gyeokDisplayText = '판별불가';

if (secondaryGyeokResult?.primary && secondaryGyeokResult?.secondary) {
  // 생지(복수격)
  gyeokDisplayText = `
    <span id="gyeok-primary" style="cursor:pointer; color:#2277ff;"><b>
      ${window.gyeokName}${window.gyeokStem ? '' : ''}
    </b></span>
    <span style="font-size:0.92em;"> (보조격: </span>
    <span id="gyeok-secondary" style="cursor:pointer; color:#ff8844;">
      <b>${secondaryGyeokResult.secondary.char}</b>
    </span>
    <span style="font-size:0.92em;">)</span>
    <div style="font-size:0.85em; color:#888; margin-top:2px;">
      (격이름을 클릭시 격국식을 볼 수 있습니다)
    </div>
  `;
} else if (secondaryGyeokResult && secondaryGyeokResult.char) {
  // 단일 보조격
  gyeokDisplayText = `
    <span id="gyeok-primary" style="cursor:pointer; color:#2277ff;">
      ${window.gyeokName}${window.gyeokStem ? '' : ''}
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
} else if (window.gyeokName) {
  // 보조격 없는 주격
  gyeokDisplayText = `
    <span id="gyeok-primary" style="cursor:pointer; color:#2277ff;">
      ${window.gyeokName}${window.gyeokStem ? '' : ''}
    </span>
  `;
}


// 격국 표시
// 격국 이름 계산

// 최종 격국 이름 만들기 (예: "건록격(庚)")
const gyeokDisplayText2 = getGyeokName(dayGan, gyeokGanHanja); // 단일 격 이름 + 천간
const gyeokDisplayEl = document.getElementById("gyeok-display");

if (gyeokDisplayEl) {
  // 정규화: 공백/괄호 제거
  const normalizedName = (gyeokDisplayText2 || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/\(.*?\)/g, "");

  console.log("▶ 격국이름 원본:", gyeokDisplayText2, "정규화:", normalizedName);

  // 합신 테이블 HTML 생성 (normalizedName 사용)
  const hapshinTableHtml = renderhapshinTable(
    normalizedName,
    saju,
    dayGan,
    gyeokGanHanja
  );

  // 출력은 기존의 주격+보조격 로직(gyeokDisplayText)을 유지
  gyeokDisplayEl.innerHTML = ` 격국: ${gyeokDisplayText} `;


}





if (gyeok && saju) {
  renderGyeokFlowStyled(gyeok, saju, secondaryGyeokResult);
}

// ▶ 클릭 이벤트 연결!
// ▶ 클릭 이벤트 연결!
// ▶ 주격 클릭
document.getElementById('gyeok-primary')?.addEventListener('click', () => {
  renderGyeokFlowStyled(gyeok, saju, secondaryGyeokResult);

  // ⚡ 전역 갱신 (주격 기준)
  window.gyeokName = gyeok.char;
  window.gyeokStem = gyeok.stem;

  console.log("▶ 주격 선택 → 전역 갱신:", window.gyeokName, window.gyeokStem);

  // 합신표 교체
  document.querySelector("#hapshin-box").innerHTML = renderhapshinTable();
});

// ▶ 보조격 클릭
document.getElementById('gyeok-secondary')?.addEventListener('click', () => {
  let selectedGyeok, otherGyeok;

  if (secondaryGyeokResult?.primary && secondaryGyeokResult?.secondary) {
    selectedGyeok = secondaryGyeokResult.secondary;
    otherGyeok   = secondaryGyeokResult.primary;
  } else {
    selectedGyeok = secondaryGyeokResult;
    otherGyeok   = gyeok;
  }

  renderGyeokFlowStyled(selectedGyeok, saju, otherGyeok);

  // ⚡ 전역 갱신 (보조격 기준)
  window.gyeokName = selectedGyeok.char;
  window.gyeokStem = selectedGyeok.stem;

  console.log("▶ 보조격 선택 → 전역 갱신:", window.gyeokName, window.gyeokStem);

  // 합신표 교체
  document.querySelector("#hapshin-box").innerHTML = renderhapshinTable();
});




document.querySelector("#hapshin-box").innerHTML = renderhapshinTable();

// ✅ 새로 분리된 simple table 출력
document.querySelector("#simple-table-box").innerHTML =
  renderSimpleTable();


///////////////////////// 12운성, 12신살  기타 신살류 출력부//////////////////////////////////////
// app.js — 한글→한자 보정 (이미 있으면 생략)
// (app.js 상단 어딘가) 한글→한자 폴백 맵
const KOR_HAN_STEM   = { 갑:'甲', 을:'乙', 병:'丙', 정:'丁', 무:'戊', 기:'己', 경:'庚', 신:'辛', 임:'壬', 계:'癸' };
const KOR_HAN_BRANCH = { 자:'子', 축:'丑', 인:'寅', 묘:'卯', 진:'辰', 사:'巳', 오:'午', 미:'未', 신:'申', 유:'酉', 술:'戌', 해:'亥' };
const toHanStem   = v => !v ? '' : /[甲乙丙丁戊己庚辛壬癸]/.test(v) ? v : (window.convertKorToHanStem?.(v) || KOR_HAN_STEM[v] || '');
const toHanBranch = v => !v ? '' : /[子丑寅卯辰巳午未申酉戌亥]/.test(v) ? v : (window.convertKorToHanBranch?.(v) || KOR_HAN_BRANCH[v] || '');

// (app.js) 현재 대운/세운을 “한자”로 리턴
function getCurrentRunContext() {
  // ---------- 대운 ----------
  let dStem = '';
  let dBranch = '';
  if (window.daeyunPairs && Number.isInteger(window.currentDaeyunIndex)) {
    const p = window.daeyunPairs[window.currentDaeyunIndex] || {};
    dStem = toHanStem(p.stem || '');
    dBranch = toHanBranch(p.branch || '');
  }

  // ---------- 세운 ----------
  let sewoon = null;
  const sel = document.querySelector('.sewoon-cell.selected');
  if (sel?.dataset.stem && sel?.dataset.branch) {
    const sStem = toHanStem(sel.dataset.stem);
    const sBranch = toHanBranch(sel.dataset.branch);
    sewoon = {
      stem: sStem,
      branch: sBranch,
      ganji: sStem + sBranch
    };
  }
  // 🚫 선택 없으면 null 유지 → 이후 '無' 처리

  // ---------- 컨텍스트 ----------
  const ctx = {
    daeyun: {
      stem: dStem,
      branch: dBranch,
      ganji: (dStem && dBranch) ? dStem + dBranch : ''
    },
    sewoon
  };

  //console.log('[CTX] getCurrentRunContext →', ctx);
  return ctx;
}








// app.js — 신살표 렌더 함수 (컨텍스트를 util에 전달)



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
const UNSEONG_GREEN = new Set(['장생', '제왕', '묘']);
const SINSAL_GREEN  = new Set(['지살', '장성살', '화개살']);

const jijiArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// 12운성
const unseongArr = jijiArr.map(jiji => getUnseong(ilgan, jiji));
document.getElementById('unseong-row').innerHTML =
  `<th>12운성</th>${
    unseongArr
      .map(txt => {
        const v = (txt ?? '').toString().trim();
        const cls = UNSEONG_GREEN.has(v) ? ' class="green-mark"' : '';
        return `<td${cls}>${v}</td>`;
      })
      .join('')
  }`;

// 12신살
const sinsalArr = jijiArr.map(jiji => getSinsal(samhapKey, jiji));
document.getElementById('sinsal-row').innerHTML =
  `<th>12신살</th>${
    sinsalArr
      .map(txt => {
        const v = (txt ?? '').toString().trim();
        const cls = SINSAL_GREEN.has(v) ? ' class="green-mark"' : '';
        return `<td${cls}>${v}</td>`;
      })
      .join('')
  }`;

// 8. 지지 td에 마우스 오버/아웃 이벤트로 미니표 안내
const miniUnseongRow = document.getElementById('mini-unseong-row');
const miniUnseongTd = miniUnseongRow.firstElementChild;

document.querySelectorAll('.jiji-clickable').forEach(td => {
  td.addEventListener('mouseenter', function() {
    const hoverJiji = this.dataset.jiji;
    const ganList = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const UNSEONG_GREEN = new Set(['장생', '제왕', '묘']);
    const myGanSet = new Set(sajuGanArr); // 내 사주 천간 조회용

    // 1) 첫 번째 행: 천간 (내 사주 천간 = 분홍 배경 + 파란 글씨)
    const firstRow = `<tr>${
      ganList.map(gan => {
        const isMyGan = myGanSet.has(gan);
        const style =
          (isMyGan
            ? 'background:#ffe3ef;box-shadow:inset 0 0 0 9999px rgba(255,105,180,.12);color:#1976d2;font-weight:bold;'
            : '') +
          'padding:2px 6px;text-align:center;';
        return `<td style="${style}">${gan}</td>`;
      }).join('')
    }</tr>`;

    // 2) 두 번째 행: 운성
    //    - 내 사주 천간 열: 분홍 배경
    //    - 장생/제왕/묘: 배경 없이 글자만 녹색+굵게
    const secondRow = `<tr>${
      ganList.map(gan => {
        const v = (getUnseong(gan, hoverJiji) ?? '').toString().trim();
        const isMyGan = myGanSet.has(gan);
        let style = (isMyGan
          ? 'background:#ffe3ef;box-shadow:inset 0 0 0 9999px rgba(255,105,180,.12);'
          : '');
        if (UNSEONG_GREEN.has(v)) {
          style += 'color:#0b5e0b;font-weight:bold;';
        }
        style += 'padding:2px 6px;text-align:center;';
        return `<td style="${style}">${v}</td>`;
      }).join('')
    }</tr>`;

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
    miniUnseongTd.innerHTML = '';
    miniUnseongRow.style.display = "none";
  });
});




// 기타 신살표 전용 영역
// 기타 신살표 전용 래퍼
let etcWrap = document.getElementById('etc-sinsal-box');
if (!etcWrap) {
  // 없으면 sinsal-box 바로 뒤에 동적으로 만들어 둡니다(1회)
  const wrap = document.getElementById('sinsal-box');
  etcWrap = document.createElement('div');
  etcWrap.id = 'etc-sinsal-box';
  if (wrap && wrap.parentNode) {
    wrap.parentNode.insertBefore(etcWrap, wrap.nextSibling);
  }
}

// ✅ 기본 신살표는 app.js 초기 렌더에서 기존대로 ↓↓↓
// document.getElementById('sinsal-box').innerHTML = renderSinsalTable({ ... });

function rerenderSinsal() {
  // 🔹 대운/세운 컨텍스트 (한자 변환 포함)
  const context = getCurrentRunContext({ disableSewoonFallback: true });


  // 🔹 사주 배열(etc용) — 전역 saju 사용
  const sajuGanArr = [saju.hourGan, saju.dayGan, saju.monthGan, saju.yearGan];
  const sajuJijiArr = [saju.hourBranch, saju.dayBranch, saju.monthBranch, saju.yearBranch];
  const sajuGanjiArr = [
    saju.hourGan + saju.hourBranch,
    saju.dayGan + saju.dayBranch,
    saju.monthGan + saju.monthBranch,
    saju.yearGan + saju.yearBranch
  ];

  // 🔹 기타 신살표만 다시 그림 (기본 신살표는 건드리지 않음!)
  if (etcWrap) {
    etcWrap.innerHTML = renderEtcSinsalTable({
      sajuGanArr,
      sajuJijiArr,
      sajuGanjiArr,
        context: {gender}
    });
  }
}

// 전역 노출
window.rerenderSinsal = rerenderSinsal;




/////////////////12신살,12운성출력 끝 /////////////////////////////////////

// ✅ 여기서 대운 테이블을 동적으로 렌더링!
// ✅ 대운 테이블 렌더
// ✅ 대운 테이블 렌더
renderDaeyunTable({
  daeyunAge,
  ageLabels,
  pairsToRender,
  birthYear: window.birthYear,
  birthMonth: window.birthMonth,
  birthDay: window.birthDay,
  sewonYear: window.sewonYear  // ✅ 유지
});

renderBasicDaeyunTable({
  daeyunAge,
  birthYear: window.birthYear,
  birthMonth: window.birthMonth,
  birthDay: window.birthDay,
  wolju: {
    stem: saju.monthGan,    // 월간
    branch: saju.monthBranch // 월지
  },
   direction: daYunDirection,
});

// ✅ 첫 로딩 시 현재 대운/세운 자동 선택
// 렌더 끝나면 바로 실행 (requestAnimationFrame: 렌더 후 1프레임 뒤)
requestAnimationFrame(() => {
  highlightInitialDaeyun();
  highlightInitialSewoon();

  // ✅ 대운/세운 값이 채워진 다음 hapshin 박스 갱신
  const hapshinBox = document.querySelector("#hapshin-box");
  if (hapshinBox) {
    hapshinBox.innerHTML = renderhapshinTable(
      window.gyeokName,
      window.saju,
      window.saju.dayGan,
      window.gyeokStem
    );
  }
});




  // ✅ 여기 추가
    // 공통은 항상 보이게
    document.getElementById("result").style.display = "block";
    document.getElementById("common-section").style.display = "block";

    // 모드 전환
    if (outputMode === "basic") {
      document.getElementById("basic-section").style.display = "block";
      document.getElementById("sinsal-section").style.display = "none";
    } else if (outputMode === "sinsal") {
      document.getElementById("basic-section").style.display = "none";
      document.getElementById("sinsal-section").style.display = "block";
    }



// 🔥 자동 출력 시작!

// 결과 영역 보여주기
document.getElementById("result").style.display = "block";

// 기본 정보 출력
await showBirthInfo({
  ...data,
  ...saju   // yearBranch, monthBranch, 등 전부 포함됨
});


// 사주 흐름(격) 렌더
renderGyeokFlowStyled(gyeok, saju, secondaryGyeokResult);

// 오늘 사주 영역 표시
document.getElementById("today-saju-container").style.display = "block";

// ✅ 생년 정보 객체 (하이라이트 계산에 사용)
const birthDateYMD = {
  year: window.birthYear,
  month: window.birthMonth,
  day: window.birthDay
};

// ✅ 하이라이트 1회만! (함수 내부에서 클릭 이벤트 dispatch 가정)
//    highlight 함수가 선택된 td에 'click'을 날리므로,
//    inline onclick="handleDaeyunClick(...)" 도 자동으로 실행됩니다.
const sortedIndex = highlightCurrentDaeyunByAge(correctedStartAge, birthDateYMD, {
  // 필요시 특정 컨테이너로 범위 제한 가능
  container: document,       // 또는 document.querySelector('.daeyun-wrapper') 처럼 좁힐 수 있음
  clsSelected: 'daeyun-selected'
});

// 선택 실패시 로깅 (디버깅용)
if (sortedIndex < 0) {
  //console.warn('[daeyun] highlight failed: sortedIndex', sortedIndex);
}

// -------------------------------
//오늘의 사주표 부분
// ✅ 오늘 날짜 기준 사주 요청 및 렌더
// -------------------------------
const today = new Date();
const todayPayload = {
  year: today.getFullYear(),
  month: today.getMonth() + 1,
  day: today.getDate(),
  hour: today.getHours(),
  minute: today.getMinutes(),
  calendarType: 'solar',
  gender: window.gender || 'male'  // window.gender가 없으면 기본값
};

const todayStr = `${todayPayload.year}-${String(todayPayload.month).padStart(2, '0')}-${String(todayPayload.day).padStart(2, '0')}`;

const todayResponse = await fetch('/api/saju', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(todayPayload),
});

if (!todayResponse.ok) {
  throw new Error(`오늘 사주 요청 실패: ${todayResponse.status}`);
}

const todayData = await todayResponse.json();

// 간지 분해
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
  todayStr,
    birthSaju: {
    yearGanji,
    monthGanji,
    dayGanji,
    timeGanji
  }
});





  } catch (error) {
    alert('에러 발생: ' + error.message);
  }
});

// 신살류 버튼 전용 이벤트
document.getElementById("sinsalBtn").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("basic-section").style.display = "none";
  document.getElementById("sinsal-section").style.display = "block";
});


