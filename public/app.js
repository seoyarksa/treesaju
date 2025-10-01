// app.js


// git add .
// git commit -m "전화인증"   
// git push origin main
// git push
//강제실행   vercel --prod --force

//   vercel dev

//로그 다시 실행
//console.clear();  console.log("🔥 전체 다시 실행됨");  console.log("👉 현재 saju:", JSON.stringify(saju));
//신규확인


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



// =========================================
// 출력 제한 로직 (비로그인 사용자 하루 3회 제한)
// =========================================
// ✅ 출력 제한 체크 함수
// ✅ 출력 제한 체크 함수
// === 출력 제한 ===
/************************************
 /************************************
 * 1) 비로그인 출력 제한
 ************************************/
/************************************
 * 1) 비로그인 출력 제한
 ************************************/
// ===== app.js (안전망 포함, 전체 교체용) =====
// 파일 상단 어딘가

// app.js 맨 위
console.log("BUILD_TAG appjs-2025-09-29-04");

// 공통 fetch 유틸 (반드시 상단에)
// 공통 fetch 헬퍼
// 네 기존 호출부와 호환되지만, !res.ok면 Error를 던집니다.
async function postJSON(url, data, opts = {}) {
  const method = opts.method || 'POST';
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };

  // 타임아웃(기본 15초)
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 15000;
  const t = setTimeout(() => controller.abort('timeout'), timeoutMs);

  let res, raw, json;
  try {
    if (opts.debug) {
      console.log('[postJSON] →', method, url, { data, headers });
      console.time(`[postJSON] ${url}`);
    }

    res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(data ?? {}),
      cache: 'no-store',
      signal: controller.signal,
      credentials: opts.credentials || 'same-origin', // 필요시 'include'
    });

    raw = await res.text();
    try { json = JSON.parse(raw); } catch { /* raw 유지 */ }

    if (opts.debug) {
      console.timeEnd(`[postJSON] ${url}`);
      console.log('[postJSON] ←', res.status, json ?? raw);
    }
  } finally {
    clearTimeout(t);
  }

  // ❗여기서 실패를 던진다
  if (!res.ok) {
    const msg = (json?.error || json?.details || raw || res.statusText || 'Request failed');
    const err = new Error(msg);
    err.status = res.status;
    err.responseText = raw;
    err.responseJson = json;
    err.url = url;
    throw err;
  }

  // 성공이면 기존처럼 3종 반환
  return { status: res.status, json, text: raw };
}



// === 인증 버튼 ===
async function onVerify(){
  const phone = phoneInput.value.trim();
  const code  = codeInput.value.trim();

  const { status, json, text } = await postJSON('/api/otp?action=verify', { phone, code });

  // ✅ 성공 조건을 엄격히
  const ok = (status === 200) && !!json?.ok && !!json?.verified;
  if (!ok) {
    // 실패 메시지에 서버의 사유를 보여주면 디버그가 쉬움
    const reason = json?.error || text || `HTTP ${status}`;
    alert(`인증 실패: ${reason}`);
    return;
  }
  alert('인증 성공!');
  location.href = '/subscribe'; // 임시 결제/다음 단계
}



// ─── 전화번호 정규화 ───────────────────────────────────────────
function normalizePhoneKR(raw, mode = "intl") {
  const digits = String(raw || "").replace(/\D/g, "");

  // 010-xxxx-xxxx → +8210xxxxxxx (국제 포맷)
  if (digits.length === 11 && digits.startsWith("010")) {
    if (mode === "intl") {
      return "+82" + digits.slice(1); // 010 → +8210
    }
    return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }

  // 지역번호 포함 (예: 02-xxx-xxxx)
  if (digits.length === 10) {
    if (mode === "intl") {
      if (digits.startsWith("0")) {
        return "+82" + digits.slice(1);
      }
    }
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }

  // fallback: 그대로 반환
  return raw;
}

// 전역 보장
window.normalizePhoneKR = window.normalizePhoneKR || function (raw, mode = "intl") {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    return mode === "intl" ? "+82" + digits.slice(1)
                           : digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  if (digits.length === 10) {
    return mode === "intl" ? "+82" + digits.slice(1)
                           : digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  return raw;
};



// 부모 창 전역
window.addEventListener('message', async (e) => {
  if (e.origin !== location.origin) return;
  if (e.data?.type !== 'REQUEST_SUPABASE_SESSION') return;
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  const payload = session ? {
    access_token: session.access_token,
    refresh_token: session.refresh_token
  } : null;
  e.source?.postMessage({ type: 'SUPABASE_SESSION', session: payload }, e.origin);
});





let __lastFormKey = null;



// 입력을 안정적으로 키로 만드는 헬퍼
function makeFormKey(fd) {
  // 비교에 의미 없는 공백/대소문/형식을 정리
  const norm = {
    name: (fd.name || "").trim(),
    birthDate: (fd.birthDate || "").trim(),
    calendarType: (fd.calendarType || "").trim(),
    gender: (fd.gender || "").trim(),
    ampm: (fd.ampm || "").trim(),
    hour: String(fd.hour ?? "").padStart(2, "0"),
    minute: String(fd.minute ?? "").padStart(2, "0"),
  };
  return JSON.stringify(norm);
}


// 0) 안전 헬퍼
const $ = (sel) => document.querySelector(sel);
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
const supa = window.supabaseClient || window.client || null;


// ✅ 여기! (로거를 가장 위에 두면 아래 모든 함수에서 사용 가능)
const DEBUG = true;
const log = (...args) => DEBUG && console.log("[COUNT]", ...args);
const warn = (...args) => DEBUG && console.warn("[COUNT]", ...args);



function readyLog(stage, extra) {
  console.log(`[APP] ${stage}`, extra || "");
}

// 0-1) Supabase 준비 확인
if (!supa || !supa.auth) {
  console.error("[APP] Supabase client가 준비되지 않았습니다. index.html의 초기화 스크립트 순서 확인!");
  // 굳이 alert를 띄워 원인 파악을 빠르게:
  alert("Supabase 초기화가 안 되어 있습니다. 페이지를 강력 새로고침(Ctrl+F5) 하거나, index.html에서 Supabase SDK 및 초기화 스크립트가 app.js보다 먼저 로드되는지 확인하세요.");
}

// === 안전 로그: 앱 로드 확인
console.log("[app] loaded");

// === 1) 비로그인 출력 제한
// KST(Asia/Seoul) 기준 YYYY-MM-DD 키 만들기
function getKSTDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// ✅ 비로그인 1일 3회(한국 날짜 기준) 제한
// ✅ 출력횟수 표시 (회원 구분 없음)






// === 2) 로그인 UI 토글

async function updateAuthUI(session) {
  const authSection =
    document.getElementById("auth-section") ||
    document.getElementById("login-form") ||
    document.querySelector(".login-form");
  const profileSection = document.getElementById("profile-section");
  const nicknameEl = document.getElementById("user-nickname");
  const historySection = document.getElementById("saju-history-section");

  if (session && session.user) {
    // ✅ 여기서 토큰 저장 처리
    const token = session.access_token;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent);

    if (isMobile) {
      localStorage.setItem("authToken", token);
    } else {
      sessionStorage.setItem("authToken", token);
    }

    if (authSection) authSection.style.display = "none";
    if (profileSection) profileSection.style.display = "block";

    const user = session.user;

    // ✅ 프로필 role 불러오기
    const { data: profile } = await window.supabaseClient
      .from("profiles")
      .select("role, created_at, daily_limit")
      .eq("user_id", user.id)
      .single();

const role = profile?.role || "normal";
localStorage.setItem("userRole", role);


  // ✅ 여기 추가
  wireProfileEditEvents();
// ✅ 회원관리 메뉴 표시/숨김
const adminMenu = document.getElementById("admin-menu");
if (adminMenu) {
  adminMenu.style.display = role === "admin" ? "inline" : "none";
}

    let roleLabel = "";
    switch (profile?.role) {
      case "admin": roleLabel = "[관리자] "; break;
      case "premium": roleLabel = "[정기회원] "; break;
      case "special": roleLabel = "[특별회원] "; break;
      default: roleLabel = "[일반회원] "; break;
    }

    const nickname =
      user.user_metadata?.nickname ||
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.nickname ||
      user.name ||
      user.displayName ||
      (user.email ? user.email.split("@")[0] : null) ||
      "사용자";

    if (nicknameEl) nicknameEl.textContent = roleLabel + nickname;

    if (historySection) historySection.style.display = "block";
    loadSajuHistory(user.id);
    renderUserProfile();
} else {
  // ✅ 로그아웃 시 스토리지 정리
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
  localStorage.removeItem("userRole");   // ← 이 줄 추가

  // ✅ 로그아웃 시 회원관리 숨김
  const adminMenu = document.getElementById("admin-menu");
  if (adminMenu) adminMenu.style.display = "none";

  if (authSection) authSection.style.display = "block";
  if (profileSection) profileSection.style.display = "none";
  if (nicknameEl) nicknameEl.textContent = "";
  if (historySection) historySection.style.display = "none";
}

}

//첫한달간 회원별 제한 횟수 계산
function getDailyLimit(profile = {}) {
  // role 정규화
  const role = String(profile.role || "normal").toLowerCase();

  // admin은 고정
  if (role === "admin") return 1000;

  // special: 등급지정일로부터 6개월 200/일, 이후 0
  if (role === "special") {
    const addMonths = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };
    const createdAt = profile.created_at ? new Date(profile.created_at) : new Date();
    const basis = profile.special_assigned_at || profile.role_assigned_at || profile.created_at;
    const assignedAt = basis ? new Date(basis) : createdAt;
    return Date.now() <= addMonths(assignedAt, 6).getTime() ? 200 : 0;
  }

  // 개별 daily_limit(숫자)은 admin/special 외 등급에서만 허용
  const dl = Number(profile.daily_limit);
  if (Number.isFinite(dl)) return dl;

  const createdAt = profile.created_at ? new Date(profile.created_at) : new Date();
  const daysSinceJoin = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000));

  switch (role) {
    case "guest":
      return daysSinceJoin > 60 ? 0 : 3;

    case "normal":
      // ✅ 과거 프리미엄 이력이 있으면 normal은 0(재가입 유도)
      if (profile.has_ever_premium) return 0;
      // 기존 신규 normal 정책(가입 30일 20회)
      return daysSinceJoin >= 30 ? 0 : 20;

    case "premium": {
      // ✅ 프리미엄: 최초 프리미엄 부여의 첫 30일만 100, 그 외는 60
      const firstAt = profile.premium_first_assigned_at ? new Date(profile.premium_first_assigned_at) : null;
      const currAt  = profile.premium_assigned_at ? new Date(profile.premium_assigned_at) : null;

      // 정보가 없으면 보수적으로 혜택 미적용(=60)
      if (!firstAt || !currAt) return 60;

      const firstWindow = firstAt.getTime() + (30 * 86400000); // 최초 부여 +30일
      const isFirstWindow = Date.now() <= firstWindow && firstAt.getTime() === currAt.getTime();
      return isFirstWindow ? 100 : 60;
    }

    default:
      return 0;
  }
}







function getGuestId() {
  let guestId = localStorage.getItem("guest_id");
  if (!guestId) {
    guestId = crypto.randomUUID(); // 브라우저 내장 UUID 생성
    localStorage.setItem("guest_id", guestId);
  }
  return guestId;
}


async function buildGateFromDb(userId, profile) {
  const t0 = performance.now();
  const today = getKSTDateKey();
  log("buildGateFromDb → start", { userId, today, role: profile?.role, created_at: profile?.created_at, daily_limit: profile?.daily_limit });

  const { data: todayRow, error: e1 } = await window.supabaseClient
    .from("saju_counts")
    .select("count")
    .eq("user_id", userId)
    .eq("count_date", today)
    .maybeSingle();
  if (e1) warn("today select error", e1);
  const todayCount = Number(todayRow?.count || 0);
  log("todayCount", todayCount, "raw:", todayRow);

  const { data: allRows, error: e2 } = await window.supabaseClient
    .from("saju_counts")
    .select("count")
    .eq("user_id", userId);
  if (e2) warn("all select error", e2);

  let totalCount = 0;
  if (Array.isArray(allRows)) {
    console.table?.(allRows); // 각 row.count 확인
    totalCount = allRows.reduce((s, r) => s + (Number(r.count) || 0), 0);
  }
  log("totalCount(sum of rows)", totalCount, "rows:", allRows?.length ?? 0);

  const configured = Number(profile?.daily_limit ?? NaN);
  const limit = Number.isFinite(configured) ? configured : Number(getDailyLimit(profile));
  const remaining = !Number.isFinite(limit) ? Infinity : Math.max(limit - todayCount, 0);

  const gate = { limit, remaining, todayCount, totalCount };
  log("gate(final)", gate, `elapsed ${Math.round(performance.now() - t0)}ms`);

  // 비정상 패턴 자동 추적
  if (totalCount === 0 && Array.isArray(allRows) && allRows.length > 0) {
    console.trace("[COUNT] totalCount=0 but rows exist → check reduce and row.count types");
  }
  return gate;
}





//오늘의 카운트 증가 갱신

// 화면 갱신은 이 함수로만!
function updateCountDisplayFromGate(gate) {
  const el = document.getElementById("count-display");
  if (!el) return;

  const total = Number(gate?.totalCount) || 0;

  if (gate?.limit === Infinity || gate?.remaining === Infinity) {
    el.textContent = `오늘 남은 횟수 (∞/∞) / 누적 총 ${total}회`;
    return;
  }
  const remain = Number(gate?.remaining) || 0;
  const limit  = Number(gate?.limit) || 0;
  el.textContent = `오늘 남은 횟수 (${remain}/${limit}) / 누적 총 ${total}회`;
}









// 오늘 카운트 증가 + 로그/화면 동기화
async function increaseTodayCount(userId, profile) {
  const today = getKSTDateKey(); // ✅ KST 날짜키

  // 1) 현재값 조회
  const { data: beforeRow, error: selErr } = await window.supabaseClient
    .from("saju_counts")
    .select("count")
    .eq("user_id", userId)
    .eq("count_date", today)           // ⚠️ count_date는 DATE 타입이 가장 안전
    .maybeSingle();

  if (selErr) {
    console.error("카운트 조회 오류:", selErr);
    return;
  }

  const nextCount = (Number(beforeRow?.count) || 0) + 1;

  // 2) upsert (오늘 카운트 증가)
  const { error: upsertErr } = await window.supabaseClient
    .from("saju_counts")
    .upsert(
      { user_id: userId, count_date: today, count: nextCount },
      { onConflict: "user_id,count_date" }
    );

  if (upsertErr) {
    console.error("카운트 업데이트 오류:", upsertErr);
    return;
  }

  // 3) authoritative 재조회 (경쟁/지연 대비)
  const { data: todayRow, error: todayErr } = await window.supabaseClient
    .from("saju_counts")
    .select("count")
    .eq("user_id", userId)
    .eq("count_date", today)
    .maybeSingle();

  if (todayErr) {
    console.error("오늘 카운트 재조회 오류:", todayErr);
    return;
  }

  const todayCount = Number(todayRow?.count || nextCount);

  // 4) 누적 합
  let totalCount = 0;
  const { data: allRows, error: totalErr } = await window.supabaseClient
    .from("saju_counts")
    .select("count")
    .eq("user_id", userId);

  if (!totalErr && Array.isArray(allRows)) {
    totalCount = allRows.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
  }

  // 5) 회원별 limit
  const limit = Number(profile?.daily_limit ?? 20);
  const remaining = Math.max(limit - todayCount, 0);

  // 6) 단일 소스(gate)로 로그/화면 동기화
  const gate = { limit, remaining, todayCount, totalCount };
  console.log(`[limit] 오늘 남은 횟수: ${gate.remaining}/${gate.limit}`);
  updateCountDisplayFromGate(gate);
}






// === 사주 이력 불러오기 ===
// === 사주 이력 불러오기 ===
let currentPage = 1;
const pageSize = 10;
let currentUserId = null;
let currentSearch = "";

async function loadSajuHistory(userId, page = 1, search = "") {
  currentUserId = userId;
  currentPage = page;
  currentSearch = search;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = window.supabaseClient
    .from("saju_records")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("이력 조회 오류:", error);
    return;
  }

  // ✅ 표 전체 다시 그리기
  const tableContainer = document.getElementById("saju-history-table");
  tableContainer.innerHTML = `
    <table class="customer-table">
      <thead>
        <tr>
          <th>이름</th>
          <th>생년월일</th>
          <th>성별</th>
          <th>등록일</th>
          <th>비고</th> <!-- ✅ 마지막 열 제목 -->
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  const tbody = tableContainer.querySelector("tbody");

  data.forEach((record) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
<span class="saju-record-link"
      data-id="${record.id}"
      data-json='${JSON.stringify(record.input_json)}'
      style="cursor:pointer; color:blue; text-decoration:underline;">
  ${record.name}
</span>


      </td>
      <td>${record.birth_date}</td>
      <td>${record.gender}</td>
      <td>${new Date(record.created_at).toLocaleDateString()}</td>
      <td><button class="delete-record-btn" data-id="${record.id}">삭제</button></td>
    `;
    tbody.appendChild(tr);
  });

// ✅ 페이지네이션 계산
const { count } = await window.supabaseClient
  .from("saju_records")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId);

const totalPages = Math.ceil(count / pageSize);
let paginationHtml = "";

// 페이지 번호 출력 (버튼X, 텍스트형태)
for (let i = 1; i <= totalPages; i++) {
  paginationHtml += `
    <span class="page-num ${i === page ? "active" : ""}" data-page="${i}">
      ${i}
    </span>`;
}

document.getElementById("page-info").innerHTML = paginationHtml;

// 페이지 번호 클릭 이벤트 등록
document.querySelectorAll(".page-num").forEach((span) => {
  span.addEventListener("click", () => {
    const targetPage = parseInt(span.dataset.page, 10);
    loadSajuHistory(currentUserId, targetPage, currentSearch);
  });
});


}








// === 3) 회원가입 모달 (전화번호 포함)
function openSignupModal() {
  const existed = document.getElementById("signup-modal");
  if (existed) { existed.style.display = "block"; return; }

  const modal = document.createElement("div");
  modal.id = "signup-modal";
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.35);
    display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px;
  `;
  const panel = document.createElement("div");
  panel.style.cssText = `
    background: #fff; width: 100%; max-width: 420px; border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow: hidden;
  `;
  panel.innerHTML = `
    <div style="padding:14px 16px; background:#2c3e50; color:#fff; font-weight:bold;">회원가입</div>
    <div style="padding:16px;">
      <div style="margin-bottom:10px;">
        <label style="display:block; margin-bottom:4px;">닉네임</label>
        <input id="su-nickname" type="text" placeholder="표시할 닉네임" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px;">
      </div>
      <div style="margin-bottom:10px;">
        <label style="display:block; margin-bottom:4px;">이메일</label>
        <input id="su-email" type="email" placeholder="you@example.com" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px;">
      </div>
      <div style="margin-bottom:10px;">
        <label style="display:block; margin-bottom:4px;">비밀번호</label>
        <input id="su-password" type="password" placeholder="비밀번호(6자 이상)" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px;">
      </div>
      <div style="margin-bottom:10px;">
        <label style="display:block; margin-bottom:4px;">전화번호 (선택)</label>
        <input id="su-phone" type="tel" placeholder="010-1234-5678" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px;">
      </div>
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
        <button id="su-cancel" type="button" style="padding:8px 12px; border:1px solid #ddd; background:#f5f5f5; border-radius:6px;">취소</button>
        <button id="su-submit" type="button" style="padding:8px 12px; border:0; background:#27ae60; color:#fff; border-radius:6px;">가입하기</button>
      </div>
      <div style="margin-top:10px; font-size:12px; color:#666;">※ 이메일 인증을 켜두셨다면, 발송된 메일에서 인증을 완료해야 로그인됩니다.</div>
    </div>
  `;
  modal.appendChild(panel);
  document.body.appendChild(modal);

  document.getElementById("su-cancel").onclick = () => { modal.style.display = "none"; };
  document.getElementById("su-submit").onclick = async () => {
    const nickname = document.getElementById("su-nickname").value.trim();
    const email = document.getElementById("su-email").value.trim();
    const password = document.getElementById("su-password").value;
    const phoneRaw = document.getElementById("su-phone").value.trim();
    const phone =  phoneRaw ? window.normalizePhoneKR(phoneRaw, "intl") : "";  

    if (!nickname) return alert("닉네임을 입력하세요.");
    if (!email) return alert("이메일을 입력하세요.");
    if (!password || password.length < 6) return alert("비밀번호는 6자 이상 입력하세요.");
    if (phoneRaw) {
      const digits = phoneRaw.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 11) return alert("전화번호 형식이 올바르지 않습니다.");
    }

    try {
      const { data, error } = await window.supabaseClient.auth.signUp({
        email, password,
        options: {
          data: { nickname, phone }, // user_metadata
          emailRedirectTo: `${location.origin}${location.pathname}`,
        },
      });
      if (error) throw error;

      localStorage.setItem("pending_nickname", nickname);
      if (phone) localStorage.setItem("pending_phone", phone);

      alert("회원가입 요청 완료! 이메일 인증을 진행해 주세요.");
      modal.style.display = "none";

      const emailEl = document.getElementById("email");
      const passEl  = document.getElementById("password");
      if (emailEl) emailEl.value = email;
      if (passEl)  passEl.value  = password;

      updateAuthUI(data?.session ?? null);
    } catch (e) {
      console.error(e);
      alert(e.message || "회원가입에 실패했습니다.");
    }
  };
}


// ─── 전화 인증 모달 ───────────────────────────────────────────
function openPhoneOtpModal() {
  if (document.getElementById("phone-otp-modal")) {
    document.getElementById("phone-otp-modal").style.display = "block";
    return;
  }

  const modal = document.createElement("div");
  modal.id = "phone-otp-modal";
  modal.style.cssText = `
    position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center;
    background:rgba(0,0,0,.35); padding:16px;
  `;

  const panel = document.createElement("div");
  panel.style.cssText = `
    width:100%; max-width:420px; background:#fff; border-radius:10px; overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,.2); font-family:'Nanum Gothic',sans-serif;
  `;
  panel.innerHTML = `
    <div style="padding:14px 16px; background:#2c3e50; color:#fff; font-weight:700;">전화번호 인증</div>
    <div style="padding:16px; display:grid; gap:10px;">
      <div>
        <label style="display:block; margin-bottom:4px;">전화번호</label>
        <input id="otp-phone" type="tel" placeholder="010-1234-5678" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px;">
      </div>
      <div style="display:flex; gap:8px;">
        <button id="otp-send" type="button" class="btn-success" style="flex:1;">코드 받기</button>
        <button id="otp-close" type="button" style="flex:1; border:1px solid #ddd; background:#f5f5f5; border-radius:6px;">나중에</button>
      </div>
      <div>
        <label style="display:block; margin-bottom:4px;">인증 코드</label>
        <input id="otp-code" type="text" inputmode="numeric" placeholder="숫자 6자리" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:6px;">
      </div>
      <button id="otp-verify" type="button" class="btn-success">인증하기</button>
      <div id="otp-help" style="font-size:12px; color:#666;">
        ※ 휴대폰으로 전송된 코드를 입력해 주세요.
      </div>
    </div>
  `;

  modal.appendChild(panel);
  document.body.appendChild(modal);

  // 닫기
  document.getElementById("otp-close").onclick = () => {
    modal.style.display = "none";
  };

// ⚠️ 스크립트가 <head>에 있다면 이 블록으로 감싸 주세요.
// window.addEventListener("DOMContentLoaded", () => { ...handlers... });

/** 코드받기 */
document.getElementById("otp-send").onclick = async () => {
  const raw = document.getElementById("otp-phone").value.trim();
  if (!raw) return alert("전화번호를 입력하세요.");
  const phone = window.normalizePhoneKR(raw, "intl");

  try {
    const { status, json, text } = await postJSON("/api/otp?action=send", { phone });
    if (status === 200 && json?.ok) {
      if (json.code) console.log("개발용 인증코드:", json.code); // OTP_DEBUG=true일 때
      alert("인증 코드가 발송되었습니다.");
    } else {
      alert("코드 발송 실패: " + (json?.error || json?.details || text || `HTTP ${status}`));
    }
  } catch (err) {
    alert(err?.message || "인증 코드를 보낼 수 없습니다.");
  }
};

/** 인증하기 */
// ✅ 인증하기 (정식: 로그인 필요, postJSON = {status,json,text} 사용)
document.getElementById("otp-verify").onclick = async () => {
  const raw  = document.getElementById("otp-phone").value.trim();
  const code = document.getElementById("otp-code").value.trim();
  if (!raw || !code) return alert("전화번호와 인증 코드를 입력하세요.");

  const phone = window.normalizePhoneKR(raw, "intl");

  try {
    // 1) 로그인 세션 확인
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return alert("로그인 후 인증 가능합니다.");

    // 2) 서버 검증
    const { status, json, text } = await postJSON("/api/otp?action=verify", {
      phone,
      code,              // 서버는 'code' 필드 기대
      user_id: user.id   // profiles 매칭에 사용
    });

    const ok = (status === 200) && json?.ok && json?.verified;
    if (ok) {
      alert("전화번호 인증이 완료되었습니다!");
      const modal = document.getElementById("phone-otp-modal");
      if (modal) modal.style.display = "none";
      updateAuthUI({ user });
    } else {
      alert("인증 실패: " + (json?.error || json?.details || text || `HTTP ${status}`));
    }
  } catch (err) {
    alert(err?.message || "인증에 실패했습니다.");
  }
};



}





function getCurrentFormData() {
  return {
    name: document.getElementById("customer-name").value.trim(),
    birthDate: document.getElementById("birth-date").value,
    calendarType: document.getElementById("calendar-type").value,
    gender: document.getElementById("gender").value,
    ampm: document.querySelector("input[name='ampm']:checked")?.value,
    hour: document.getElementById("hour-select").value,
    minute: document.getElementById("minute-select").value,
  };
}





// ✅ 비회원/회원 출력 제한 체크
async function checkRenderAllowed() {
  // 1) 로그인 사용자 → 서버(DB)에서 제한
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
      return true; // 로그인 사용자는 서버 쪽에서 제한 처리
    }
  } catch (_) {}

  // 2) 비회원 → localStorage로 제한
  const todayKST = getKSTDateKey();
  const usage = JSON.parse(localStorage.getItem("sajuUsage") || "{}");

  // 오늘 카운트 증가
  usage[todayKST] = (usage[todayKST] || 0) + 1;

  // ✅ 월간 카운트 계산
  const monthKey = todayKST.slice(0, 7); // YYYY-MM
  let monthCount = 0;
  for (let key in usage) {
    if (key.startsWith(monthKey)) {
      monthCount += usage[key];
    }
  }

  // ✅ 최초 접속일 추적 (비회원 3개월 제한)
  if (!usage.firstVisit) {
    usage.firstVisit = todayKST; // 최초 접속일 저장
  }
  const firstVisitDate = new Date(usage.firstVisit);
  const now = new Date(todayKST);
  const diffDays = Math.floor((now - firstVisitDate) / (1000 * 60 * 60 * 24));

  // 제한 체크
  if (diffDays > 90) {
    alert("비회원 이용 가능 기간(3개월)이 만료되었습니다.\n회원가입 후 계속 이용해주세요.");
    return false;
  }
  if (usage[todayKST] > 3) {
    alert("비회원은 하루 3회까지만 출력 가능합니다.");
    return false;
  }
  if (monthCount > 20) {
    alert("비회원은 한 달 총 20회까지만 출력 가능합니다.");
    return false;
  }

  // 저장
  localStorage.setItem("sajuUsage", JSON.stringify(usage));
  return true;
}



// ✅ 비회원 월간 제한 (localStorage 이용)
function checkGuestMonthlyLimit() {
  const usage = JSON.parse(localStorage.getItem("sajuUsageMonthly") || "{}");
  const monthKey = new Date().toISOString().slice(0, 7); // 예: "2025-09"

  usage[monthKey] = (usage[monthKey] || 0) + 1;

  if (usage[monthKey] > 20) {
    alert("비회원은 한 달간 최대 20회까지만 이용 가능합니다.\n회원가입 후 더 많은 기능을 이용하세요!");
    return false;
  }

  localStorage.setItem("sajuUsageMonthly", JSON.stringify(usage));
  return true;
}




// === 4) 사주 제출 (완전한 한 개만 사용!)
// === 4) 사주 제출 (완전한 한 개만 사용!)
let lastOutputData = null;

async function handleSajuSubmit(e) {
  e.preventDefault();
  console.log("[DEBUG] handleSajuSubmit 실행됨");

  try {
    // 1) 입력 데이터 수집
    const formData = {
      name: document.getElementById("customer-name")?.value.trim(),
      birthDate: document.getElementById("birth-date")?.value,
      calendarType: document.getElementById("calendar-type")?.value,
      gender: document.getElementById("gender")?.value,
      ampm: document.querySelector("input[name='ampm']:checked")?.value,
      hour: document.getElementById("hour-select")?.value,
      minute: document.getElementById("minute-select")?.value,
    };
    if (!formData.gender) {
      alert("성별을 선택해야 합니다.");
      return;
    }

    const formKey = JSON.stringify(formData);

    // 2) 로그인 여부 확인
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
      // ── 비회원: '미리보기'로 초과 여부 먼저 판단 (증가 없음)
      const todayKST = getKSTDateKey();
      const usage = JSON.parse(localStorage.getItem("sajuUsage") || "{}");
      const todayCount = Number(usage[todayKST] || 0);
      const guestProfile = { role: "guest", created_at: new Date().toISOString() };
      const limitGuest = getDailyLimit(guestProfile); // 정책 반영(60일 이후 0, 이전 3)
      const remainingPreview = (limitGuest === Infinity) ? Infinity : Math.max(limitGuest - todayCount, 0);

      if (limitGuest !== Infinity && remainingPreview <= 0) {
        alert("오늘 사용 가능한 횟수를 모두 소진하셨습니다.");
        updateCountDisplayFromGate({
          limit: limitGuest,
          remaining: 0,
          todayCount,
          totalCount: Object.values(usage).filter(v => typeof v === "number").reduce((a,b)=>a+b,0),
        });
        return; // ✅ 출력 차단
      }

      // ✅ 직전과 동일할 때만 '카운트 없이' 출력 허용
      if (lastOutputData === formKey) {
        console.log("⚠️ 동일 입력(직전과 동일, 게스트) → 카운트 증가 없이 출력만");
        renderSaju(formData);
        return;
      }

      // 실제 증가 수행
      const ok = await checkRenderAllowed(); // 이 함수가 localStorage 증가/월간 제한까지 처리
      if (!ok) return;

      // 출력 실행 + 직전키 갱신
      renderSaju(formData);
      lastOutputData = formKey;

      // 화면 갱신(선택): 방금 증가한 값으로 다시 표시
      const usage2 = JSON.parse(localStorage.getItem("sajuUsage") || "{}");
      const today2 = Number(usage2[todayKST] || 0);
      const total2 = Object.values(usage2).filter(v => typeof v === "number").reduce((a,b)=>a+b,0);
      const remain2 = (limitGuest === Infinity) ? Infinity : Math.max(limitGuest - today2, 0);
      updateCountDisplayFromGate({ limit: limitGuest, remaining: remain2, todayCount: today2, totalCount: total2 });
      return;
    }

    // ── 로그인 사용자 ──
    const userId = session.user.id;

    // ✅ 반드시 풀프로필 확보 (정책 필드 포함)
    let { data: profile, error: pErr } = await window.supabaseClient
      .from("profiles")
      .select("role, created_at, daily_limit, special_assigned_at, has_ever_premium, premium_assigned_at, premium_first_assigned_at")
      .eq("user_id", userId)
      .single();

    if (pErr || !profile || !profile.role) {
      console.warn("[handleSajuSubmit] profile 보정 발생:", pErr);
      profile = {
        role: "normal",
        created_at: session.user.created_at || new Date().toISOString(),
        daily_limit: null,
      };
    }

    // 2-1) 사전 차단 (증가 없이 현재 잔여 확인)
    const preGate = await buildGateFromDb(userId, profile);
    if (preGate.limit !== Infinity && preGate.remaining <= 0) {
      // 등급별 메시지 커스터마이즈 가능
      alert("오늘 사용 가능한 횟수를 모두 소진하셨습니다.");
      updateCountDisplayFromGate(preGate);
      return; // ✅ 출력 차단
    }

    // ✅ 직전과 동일할 때만 '카운트 없이' 출력 허용
    if (lastOutputData === formKey) {
      console.log("⚠️ 동일 입력(직전과 동일, 로그인) → 카운트 증가 없이 출력만");
      renderSaju(formData);
      return;
    }

    if (profile.role !== "admin") {
      // 2-2) 서버에서 제한/증가 처리
      const { data: ok, error } = await window.supabaseClient.rpc("can_render_and_count");
      if (error) {
        console.error("[RPC] 오류:", error);
        alert("이용 제한 확인 중 오류가 발생했습니다.");
        return;
      }
      if (!ok?.allowed) {
        let reason = "이용이 제한되었습니다.";
        if (ok?.remaining === 0) reason = "오늘 사용 가능한 횟수를 모두 소진하셨습니다.";
        else if (ok?.limit === 0) reason = "구독이 필요합니다. 결제를 진행해주세요.";
        else if (ok?.message) reason = ok.message;
        alert(reason);
        return;
      }
    }

    // 2-3) 사후 동기화(최신 DB 기준 표시)
    const gateDb = await buildGateFromDb(userId, profile);
    console.log(`[limit] 오늘 남은 횟수: ${gateDb.remaining}/${gateDb.limit}`);
    updateCountDisplayFromGate(gateDb);

    // 3) 출력 실행 + 직전키 갱신
    renderSaju(formData);
    lastOutputData = formKey;

    // 4) 로그인 사용자 → 이름이 있으면 기록 저장 (중복키 에러는 무시)
    if (session?.user) {
      try {
        if (formData.name) {
          const { data: newRecord, error: insertErr } = await window.supabaseClient
            .from("saju_records")
            .insert([{
              user_id: session.user.id,
              name: formData.name,
              birth_date: formData.birthDate,
              birth_time: `${formData.ampm} ${formData.hour}:${formData.minute}`,
              gender: formData.gender,
              calendar_type: formData.calendarType,
              input_json: formData,
            }])
            .select()
            .single();

          if (insertErr) {
            if (insertErr.code === "23505" || insertErr.code === "409") {
              console.log("⚠️ 중복된 데이터 → 저장하지 않음");
            } else {
              console.error("❌ 저장 오류:", insertErr);
              alert("사주 데이터 저장 중 오류가 발생했습니다.");
            }
          } else if (newRecord) {
            console.log("✅ 사주 데이터 저장 완료:", newRecord);
          }
        } else {
          console.log("⚠️ 이름 없음 → 저장 건너뜀");
        }

        // ❌ (중요) 여기서 별도 카운트 증가는 하지 않음!
        //  - 이유: 로그인 사용자는 위 RPC(can_render_and_count)에서
        //          이미 카운트를 처리한다고 가정하고 UI는 buildGateFromDb로 갱신.
        //  - 만약 RPC가 '체크 전용'이라면:
        //      1) 별도 increaseTodayCount(userId, profile) 호출
        //      2) const gateDb = await buildGateFromDb(userId, profile);
        //      3) updateCountDisplayFromGate(gateDb);
        //     로 단일 경로 유지하세요.

      } catch (err) {
        console.error("❌ DB 처리 오류:", err);
        alert("요청 처리 중 오류가 발생했습니다.");
      }
    }
  } catch (err) {
    console.error("❌ handleSajuSubmit error:", err);
    alert("요청 처리 중 오류가 발생했습니다.");
  }
}





async  function renderSaju(formdata) {

    // 2) 🔻 여기부터 사주 출력/DB 저장 로직 🔻
    console.log("사주 출력 로직 실행 준비 완료!");







const MONTH_TO_SOLAR_TERM = {
  1: '소한',
  2: '입춘',
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
// 추가 영역 HTML 추출


const basicSectionHTML = document.getElementById("basic-section")?.innerHTML || "";
const sinsalSectionHTML = document.getElementById("sinsal-section")?.innerHTML || "";
  // 최종 이메일 본문 (HTML로 구성)
// 긴 HTML은 줄이고 링크만 포함
const emailBody = `
  <div style="font-family: 'Nanum Gothic', sans-serif; line-height: 1.6;">
    <h2>질문 내용</h2>
    <p>${userMessage.replace(/\n/g, "<br />")}</p>

    <hr />

    <h3>사용자 생일 사주</h3>
    <pre style="background:#f9f9f9; padding:10px; border:1px solid #ddd;">${birthInfoText}</pre>

    <strong>사주출력 페이지 보기:</strong> 
    <a href="${sajuUrl}" target="_blank" rel="noopener noreferrer">${sajuUrl}</a>

    <hr />

    <h3>사주 요약</h3>
    <div>${daeyunHTML.slice(0, 2000)} ... (생략)</div>

    <hr />

    <p>📌 전체 사주 결과와 신살/연운은 아래 링크에서 확인하세요:</p>
    <p><a href="${sajuUrl}" target="_blank">사주 전체 결과 페이지</a></p>
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
            window.outputMode = window.outputMode || 'basic'; // ← 추가
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
const gender = document.getElementById("gender")?.value || "";
if (!gender) {
  alert("성별을 선택해야 저장할 수 있습니다.");
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
  // 🔹 모드 전환은 이 함수 맨 끝쯤에서:
  document.getElementById("result").style.display = "block";
  document.getElementById("common-section").style.display = "block";
  if (window.outputMode === "basic") {
    document.getElementById("basic-section").style.display = "block";
    document.getElementById("sinsal-section").style.display = "none";
  } else {
    document.getElementById("basic-section").style.display = "none";
    document.getElementById("sinsal-section").style.display = "block";
  }




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
  const sortedIndex = highlightCurrentDaeyunByAge(correctedStartAge, birthDateYMD, {
    container: document,
    clsSelected: 'daeyun-selected'
  });

  if (sortedIndex < 0) {
    console.warn('[daeyun] highlight failed: sortedIndex', sortedIndex);
  }

  // -------------------------------
  // 오늘의 사주표 부분
  // -------------------------------
  const today = new Date();
  const todayPayload = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
    hour: today.getHours(),
    minute: today.getMinutes(),
    calendarType: 'solar',
    gender: window.gender || 'male'
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
    birthSaju: { yearGanji, monthGanji, dayGanji, timeGanji }
  });

} catch (error) {
  alert('에러 발생: ' + error.message);
}


  console.log("[saju] OK to render");
  // ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆// ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆// ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆// ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆
// ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆// ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆// ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆// ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆
// ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆// ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆// ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆// ⬆⬆⬆ 기존 로직 끝 ⬆⬆⬆

  }









// renderUserProfile 정의는 그대로 유지
async function renderUserProfile() {
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  if (!user) return;


}


  // 여기서는 이벤트 바인딩만!
document.getElementById("subscribeBtn").onclick = async () => {
  // 현재 로그인 사용자 가져오기
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  if (!user) return alert("로그인 후 이용해 주세요.");

  // phone_verified 확인
  const { data: profile } = await window.supabaseClient
    .from("profiles")
    .select("phone_verified")
    .eq("user_id", user.id)
    .single();

  if (!profile?.phone_verified) {
    return openPhoneOtpModal(); // 인증 먼저
  }

// 인증된 경우 → 결제 API 호출
try {
  let data;
  try {
    data = await postJSON("/api/pay?action=start", { user_id: user.id });
  } catch (e1) {
    console.warn("[pay] /api/pay?action=start 실패, /api/start-subscription 재시도:", e1?.message);
    data = await postJSON("/api/start-subscription", { user_id: user.id });
  }
  window.location.href ='/subscribe'; // 임시 결제창
} catch (err) {
  alert(err.message);
}


};




 

// === 초기화 (하나로 통합)
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("[app] DOM ready");

    // ✅ 세션 확인 및 UI 갱신
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    updateAuthUI(session);

    // ✅ 출력횟수 초기화
    if (session && session.user) {
      // 프로필에 daily_limit 포함
      const { data: profile, error: profErr } = await window.supabaseClient
        .from("profiles")
        .select("role, created_at, daily_limit, special_assigned_at, has_ever_premium, premium_assigned_at, premium_first_assigned_at")
        .eq("user_id", session.user.id)
        .single();

      if (!profErr && profile) {
        // ✅ KST 기준 날짜
        const today = getKSTDateKey();

        // 오늘 카운트
        const { data: countRow } = await window.supabaseClient
          .from("saju_counts")
          .select("count")
          .eq("user_id", session.user.id)
          .eq("count_date", today)
          .maybeSingle();
        const todayCount = Number(countRow?.count || 0);

        // 누적 합
        let totalCount = 0;
        const { data: allRows } = await window.supabaseClient
          .from("saju_counts")
          .select("count")
          .eq("user_id", session.user.id);
        if (Array.isArray(allRows)) {
          totalCount = allRows.reduce((s, r) => s + (Number(r.count) || 0), 0);
        }

        // 회원별 일일 제한 (프로필 daily_limit 우선, 없으면 getDailyLimit)
        const configured = Number(profile.daily_limit ?? NaN);
        const limit = Number.isFinite(configured) ? configured : Number(getDailyLimit(profile));
        const remaining = !Number.isFinite(limit) ? Infinity : Math.max(limit - todayCount, 0);

        // ✅ 단일 소스 gate로 화면 출력
        updateCountDisplayFromGate({ limit, remaining, todayCount, totalCount });
      }
    } else {
      // ✅ 출력횟수 초기화 (세션 없음 = 비로그인)
      const todayKST = getKSTDateKey();

      // 비회원 프로필( getDailyLimit 이 role/created_at을 쓰므로 최소 필드 채움 )
      const guestProfile = { role: "guest", created_at: new Date().toISOString() };

      // 오늘/누적 집계 (localStorage)
      const usage = JSON.parse(localStorage.getItem("sajuUsage") || "{}");
      const todayCount = Number(usage[todayKST] || 0);
      const totalGuest = Object
        .values(usage)
        .filter(v => typeof v === "number")
        .reduce((a, b) => a + b, 0);

      // 회원별(=게스트) 하루 제한
      const limitGuest = Number(getDailyLimit(guestProfile)); // 보통 3
      const remainingGuest = Math.max(limitGuest - todayCount, 0);

      // ✅ 단일 소스 gate 로 출력
      updateCountDisplayFromGate({
        limit: limitGuest,
        remaining: remainingGuest,
        todayCount,
        totalCount: totalGuest,
      });
    }

 // ✅ 여기부터 넣으세요: 프로필 실시간 반영 (Realtime)
    if (session?.user) {
      const userId = session.user.id;

      // 중복 구독 방지
      if (window.__profileCh) {
        try { window.supabaseClient.removeChannel(window.__profileCh); } catch (_) {}
        window.__profileCh = null;
      }

      window.__profileCh =
        window.supabaseClient
          .channel("profile-changes")
.on(
  "postgres_changes",
  { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${userId}` },
  async (payload) => {
    console.log("[PROFILE RT]", payload);

    // 최신 프로필 로드 (에러/누락 시 안전 폴백)
    const { data: profile, error: pErr } = await window.supabaseClient
      .from("profiles")
      .select("role, created_at, daily_limit, special_assigned_at")
      .eq("user_id", userId)
      .single();

    const safeProfile = (pErr || !profile)
      ? { role: "normal", created_at: new Date().toISOString() }
      : profile;

    const gate = await buildGateFromDb(userId, safeProfile);
    updateCountDisplayFromGate(gate);

    // 프로필 영역 갱신 필요 시
    renderUserProfile?.();
  }
)

          .subscribe((status) => {
            console.log("[PROFILE RT] status:", status);
          });
    }

    // (DOMContentLoaded try{} 안, Realtime 구독 설정한 뒤에)
window.addEventListener("beforeunload", () => {
  if (window.__profileCh) {
    try { window.supabaseClient.removeChannel(window.__profileCh); } catch (_) {}
    window.__profileCh = null;
  }
});

    // 이미 있는 onAuthStateChange는 유지하되,
    // SIGNED_OUT 때 구독 정리만 추가하면 좋아요.

    // ✅ 로그인 상태 변경 감시 (이중 새로고침 방지)
    let __reloading = false;
    window.supabaseClient.auth.onAuthStateChange((event, newSession) => {
      console.log("[AuthStateChange]", event);

      if (event === "SIGNED_OUT") {
        if (window.__profileCh) {
          try { window.supabaseClient.removeChannel(window.__profileCh); } catch (_) {}
          window.__profileCh = null;
        }
      }

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        if (!__reloading) {
          __reloading = true;
          if (window.location.hash) {
            history.replaceState(null, "", window.location.pathname + window.location.search);
          }
          window.location.reload();
        }
        return;
      }
      updateAuthUI(newSession);
    });

    // ✅ 사주 기록 클릭 → 입력폼 채워넣기 + 출력
    document.addEventListener("click", async (e) => {
      if (e.target.classList.contains("saju-record-link")) {
        e.preventDefault();

        const record = JSON.parse(e.target.dataset.json);
        const recordId = e.target.dataset.id;

        if (recordId) {
          await window.supabaseClient
            .from("saju_records")
            .update({ view_count: (record.view_count || 0) + 1 })
            .eq("id", recordId);
        }

        // 입력폼 채우기
        document.getElementById("customer-name").value = record.name || "";
        document.getElementById("birth-date").value = record.birthDate || "";
        document.getElementById("calendar-type").value = record.calendarType || "";
        document.getElementById("gender").value = record.gender || "";
        if (record.ampm) document.querySelector(`input[name="ampm"][value="${record.ampm}"]`).checked = true;
        if (record.hour) document.getElementById("hour-select").value = record.hour;
        if (record.minute) document.getElementById("minute-select").value = record.minute;

        // 버튼 상태
        const sajuBtn = document.getElementById("sajuSubmit");
        const sinsalBtn = document.getElementById("sinsalBtn");
        sajuBtn.classList.remove("active");
        sinsalBtn.classList.add("active");

        handleSajuSubmit(new Event("click"));

        // ✅ 고객 데이터 모달 닫기
        const modal = document.getElementById("saju-history-panel");
        if (modal) {
          modal.style.display = "none";
        }
      }
    });

    // 삭제 버튼 이벤트 (이벤트 위임)
    document.addEventListener("click", async (e) => {
      if (e.target.classList.contains("delete-record-btn")) {
        const recordId = e.target.dataset.id;
        if (!recordId) return;

        if (!confirm("정말 이 기록을 삭제하시겠습니까?")) return;

        const { error } = await window.supabaseClient
          .from("saju_records")
          .delete()
          .eq("id", recordId);   // ✅ uuid가 아니라 id 컬럼 사용

        if (error) {
          console.error("삭제 오류:", error);
          alert("삭제 중 문제가 발생했습니다.");
          return;
        }

        // 삭제 성공 시 UI에서도 제거
        e.target.closest("tr").remove();
        console.log("삭제 완료:", recordId);
      }
    });

    // ✅ 내 사주 기록 버튼
    document.getElementById("toggle-history-btn")?.addEventListener("click", async () => {
      const panel = document.getElementById("saju-history-panel");
      if (!session) {
        alert("로그인 후 이용할 수 있습니다.");
        return;
      }
      currentUserId = session.user.id;

      if (panel.style.display === "none") {
        panel.style.display = "block";
        currentPage = 1;
        currentSearch = "";
        await loadSajuHistory(currentUserId, currentPage, currentSearch);
      } else {
        panel.style.display = "none";
      }
    });

    // ✅ 검색
    document.getElementById("search-btn")?.addEventListener("click", () => {
      const keyword = document.getElementById("search-name").value.trim();
      loadSajuHistory(currentUserId, 1, keyword);
    });
    document.getElementById("search-name")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const keyword = e.target.value.trim();
        loadSajuHistory(currentUserId, 1, keyword);
      }
    });

    // ✅ 페이지 네비게이션
    document.getElementById("prev-page")?.addEventListener("click", async () => {
      if (currentPage > 1 && currentUserId) {
        currentPage--;
        await loadSajuHistory(currentUserId, currentPage, currentSearch);
      }
    });
    document.getElementById("next-page")?.addEventListener("click", async () => {
      if (currentUserId) {
        currentPage++;
        await loadSajuHistory(currentUserId, currentPage, currentSearch);
      }
    });

    // ✅ 로그인/회원가입/소셜 로그인/로그아웃 바인딩
    document.getElementById("loginBtn")?.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email")?.value?.trim();
      const password = document.getElementById("password")?.value ?? "";
      if (!email || !password) return alert("이메일과 비밀번호를 입력하세요.");
      try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        updateAuthUI(data?.session ?? null);
      } catch (err) {
        console.error(err);
        alert(err.message || "로그인에 실패했습니다.");
      }
    });
    document.getElementById("signupBtn")?.addEventListener("click", (e) => { e.preventDefault(); openSignupModal(); });
    document.getElementById("googleLogin")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await window.supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}${location.pathname}` },
      });
    });
    document.getElementById("kakaoLogin")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await window.supabaseClient.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: `${location.origin}${location.pathname}` },
      });
    });
    document.getElementById("logoutBtn")?.addEventListener("click", async () => {
      await window.supabaseClient.auth.signOut();
      updateAuthUI(null);
    });


  showIfAdmin('#admin-menu');   // 회원관리 메뉴



 

    // ✅ 사주 폼 바인딩
    const form = document.getElementById("saju-form");
    if (form) {
      form.addEventListener("submit", handleSajuSubmit);
      document.getElementById("sajuSubmit")?.addEventListener("click", () => {
        window.outputMode = "basic";
        form.requestSubmit();
      });
      document.getElementById("sinsalBtn")?.addEventListener("click", () => {
        window.outputMode = "sinsal";
        form.requestSubmit();
      });
    }

    // ✅ 로그인 후 프로필/정기구독/로그아웃 UI 세팅
    renderUserProfile();

wireProfileEditEvents();

  } catch (err) {
    console.error("[init] fatal:", err);
  }
});

