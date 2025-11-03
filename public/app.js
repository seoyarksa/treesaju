// app.js


// git add .
// git commit -m "결제전환보정"   
// git push origin main
// git push
//강제실행   vercel --prod --force


//로그 다시 실행
//console.clear();  console.log("🔥 전체 다시 실행됨");  console.log("👉 현재 saju:", JSON.stringify(saju));


// app.js
// 상수
import { TERM_HELP } from './explain.js';
window.TERM_HELP = TERM_HELP;
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



console.log('🔥 app.js loaded');

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
// ▼ 전역 한 번만! (렌더 함수 밖)
if (!window.__miniSajuDelegated) {
  document.addEventListener('click', (e) => {
    const mini = document.getElementById('saju-mini');
    if (!mini) return;

    // 축소 버튼
    if (e.target.closest('#saju-mini-min')) {
      mini.classList.toggle('is-min');
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 닫기 버튼
    if (e.target.closest('#saju-mini-close')) {
      mini.remove();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }, { capture: true }); // ← 캡처 단계에서 가로채 재렌더/버블 이슈 방지

  window.__miniSajuDelegated = true;
}



// ===== app.js (안전망 포함, 전체 교체용) =====
// 파일 상단 어딘가
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


// ✅ 공용 fetch 헬퍼 (전역 등록)
async function postJSON(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {})
  });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  if (!res.ok) {
    const msg = json?.error || json?.details || text || `HTTP ${res.status}`;
    const err = new Error(msg); err.status = res.status; err.responseText = text; err.responseJson = json;
    throw err;
  }
  return { status: res.status, json, text };
}
// 전역 보강 (중복 정의 방지)
window.postJSON ||= postJSON;


// 실패해도 버튼이 반드시 풀리도록 try/finally
async function withBtnLock(btn, task) {
  if (!btn) return;
  if (btn.dataset.locked === '1') return;      // 더블클릭 방지
  btn.dataset.locked = '1';
  const prevDisabled = btn.disabled;
  btn.disabled = true;
  btn.style.opacity = '0.6';
  try {
    await task();
  } finally {
    btn.disabled = prevDisabled;
    btn.style.opacity = '';
    delete btn.dataset.locked;
  }
}

// fetch 안전 래퍼: 네트워크 오류도 잡고, JSON 파싱 실패해도 죽지 않게
async function safeFetch(url, options) {
  try {
    const res = await fetch(url, options);
    let json = null;
    try { json = await res.json(); } catch {}
    return { res, json, error: null };
  } catch (e) {
    return { res: null, json: null, error: e };
  }
}


// 짧은 대기
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 에러 메시지를 조금 더 자세히 합성
function buildErrMsg(json, fallback = '전환 실패') {
  const bits = [];
  if (json?.message) bits.push(json.message);
  if (json?.error && json.error !== json.message) bits.push(json.error);
  if (json?.detail) bits.push(`상세: ${json.detail}`);
  if (Number.isFinite(json?.remainingDays)) bits.push(`남은일수: ${json.remainingDays}`);
  return bits.length ? bits.join('\n') : fallback;
}


function normalizePhoneKR(raw, mode = 'intl') {
  const digits = String(raw || '').replace(/\D/g, '');
  // 010-xxxx-xxxx → +8210xxxxxxxx
  if (digits.length === 11 && digits.startsWith('010')) {
    return mode === 'intl' ? '+82' + digits.slice(1)
                           : digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  // 02/0xx-xxx-xxxx → +82x...
  if (digits.length === 10 && digits.startsWith('0')) {
    return mode === 'intl' ? '+82' + digits.slice(1)
                           : digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return raw; // 기타는 원본 유지
}
window.normalizePhoneKR ||= normalizePhoneKR;  // 전역 보강



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
  const badgeEl = document.getElementById("user-badge");   // ✅ 추가: 뱃지 span
  const historySection = document.getElementById("saju-history-section");

  if (session && session.user) {
    // 토큰 저장
    const token = session.access_token;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent);
    if (isMobile) localStorage.setItem("authToken", token);
    else sessionStorage.setItem("authToken", token);

    if (authSection) authSection.style.display = "none";
    if (profileSection) profileSection.style.display = "block";

    const user = session.user;

    // ✅ 프로필에서 role과 grade를 함께 가져온다 (라벨은 grade 기준!)
    const { data: profile } = await window.supabaseClient
      .from("profiles")
      .select("role, grade, nickname, created_at, daily_limit")
      .eq("user_id", user.id)
      .single();

    // role은 관리자 메뉴 표시용으로만 저장
    const role = (profile?.role || "normal").toLowerCase();
    localStorage.setItem("userRole", role);

    // 프로필 편집 이벤트 보강
    wireProfileEditEvents();

    // 관리자 메뉴 표시/숨김
    const adminMenu = document.getElementById("admin-menu");
    if (adminMenu) adminMenu.style.display = role === "admin" ? "inline" : "none";

    // ✅ grade → 라벨 매핑 (요청하신 스위치 그대로)
    const grade = (profile?.grade || "basic").toLowerCase();
    let roleLabel = "";
    switch (grade) {
      case "admin":   roleLabel = "[관리자] ";   break;
      case "premium3": roleLabel = "[정기회원3] "; break;
         case "premium6": roleLabel = "[정기회원6] "; break;
            case "premium": roleLabel = "[정기회원] "; break;
               case "premium_plus": roleLabel = "[정기회원+] "; break;
      case "special": roleLabel = "[특별회원] "; break;
      default:        roleLabel = "[일반회원] "; break;
    }

    // 표시 이름
    const nickname =
      profile?.nickname ||
      user.user_metadata?.nickname ||
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.nickname ||
      user.name ||
      user.displayName ||
      (user.email ? user.email.split("@")[0] : null) ||
      "사용자";

    // ✅ 뱃지 + 닉네임 각각 채우기
    if (badgeEl)    badgeEl.textContent = roleLabel;
    if (nicknameEl) nicknameEl.textContent = nickname;

    // 히스토리 섹션/데이터 로드
    if (historySection) historySection.style.display = "block";
    loadSajuHistory(user.id);
    renderUserProfile();
  } else {
    // 로그아웃 시 정리
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    localStorage.removeItem("userRole");

    const adminMenu = document.getElementById("admin-menu");
    if (adminMenu) adminMenu.style.display = "none";

    if (authSection) authSection.style.display = "block";
    if (profileSection) profileSection.style.display = "none";
    if (badgeEl) badgeEl.textContent = "";         // ✅ 뱃지도 비우기
    if (nicknameEl) nicknameEl.textContent = "";
    if (historySection) historySection.style.display = "none";
  }
}


// 첫한달간(정책 반영) 회원별 제한 횟수 계산 - grade 기반
function getDailyLimit(profile = {}) {
  // grade 정규화 (role 백워드 호환)
  const grade = String(profile.grade || profile.role || "basic").toLowerCase();

  // admin은 고정
  if (grade === "admin") return 1000;

  // special: 등급지정일로부터 6개월 100/일, 이후 0
  if (grade === "special") {
    const addMonths = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };
    const createdAt = profile.created_at ? new Date(profile.created_at) : new Date();
    // 가능한 기준 필드들 중 가장 그럴싸한 걸 사용 (백워드 호환)
    const basis =
      profile.special_assigned_at ||
      profile.grade_assigned_at ||
      profile.role_assigned_at ||
      profile.created_at;
    const assignedAt = basis ? new Date(basis) : createdAt;
    return Date.now() <= addMonths(assignedAt, 6).getTime() ? 100 : 1;
  }

  // 개별 daily_limit(숫자)은 admin/special 외 등급에서만 허용
  const dl = Number(profile.daily_limit);
  if (Number.isFinite(dl) && grade !== "admin" && grade !== "special") return dl;

  const createdAt = profile.created_at ? new Date(profile.created_at) : new Date();
  const daysSinceJoin = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000));

  switch (grade) {
    case "basic": {
      // 과거 프리미엄 이력 있으면 1
      if (profile.has_ever_premium) return 1;
      // 가입 후 10일 동안 20, 이후 1  (SQL의 else 20 분기와 동일)
      return daysSinceJoin >= 10 ? 1 : 20;
    }

    case "premium": {
      // 프리미엄: 최초 부여 후 10일 동안 100, 그 외 60
      const firstAt = profile.premium_first_assigned_at ? new Date(profile.premium_first_assigned_at) : null;
      const currAt  = profile.premium_assigned_at ? new Date(profile.premium_assigned_at) : null;

      // 정보 부족 시 기본 60
      if (!firstAt || !currAt) return 60;

      const tenDaysMs = 10 * 86400000;
      const isFirstWindow =
        firstAt.getTime() === currAt.getTime() &&
        Date.now() <= (firstAt.getTime() + tenDaysMs);

      return isFirstWindow ? 100 : 60;
    }

    default:
      // 인지하지 못한 등급은 보수적으로 1
      return 1;
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
// 기존 함수 덮어쓰기 (비동기로 변경)
async function updateCountDisplayFromGate(gate) {
  const el = document.getElementById("count-display");
  if (!el) return;

  const total = Number(gate?.totalCount) || 0;

  // 1) DB에서 오늘 사용/리밋을 직접 가져와서 계산 (진실 소스)
  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (user) {
      const { data: prof } = await window.supabaseClient
        .from('profiles')
        .select('daily_usage_count, daily_limit')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prof) {
        const used  = Math.max(0, Number(prof.daily_usage_count ?? 0));
        const limit = Number(prof.daily_limit ?? 0);

        if (!Number.isFinite(limit) || limit <= 0) {
          el.textContent = `오늘 남은 횟수 (∞/∞) / 누적 총 ${total}회`;
          return;
        }

        const remain = Math.max(0, limit - used);
        el.textContent = `오늘 남은 횟수 (${remain}/${limit}) / 누적 총 ${total}회`;
        return; // ✅ DB 기준으로 끝
      }
    }
  } catch (e) {
    // DB 조회 실패 시 아래 게이트 값으로 폴백
    console.warn('[usage display] fallback to gate values:', e);
  }

  // 2) 폴백: 기존 gate 값 사용(예전 동작 유지)
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
  //console.log(`[limit] 오늘 남은 횟수: ${gate.remaining}/${gate.limit}`);
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
           <th>달력</th> <!-- ✅ 추가: 음력/양력 -->
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
  // ✅ 달력 표기 추출 (DB/JSON 어디에 있든 최대한 받아줌)
  const calTypeRaw =
    record.calendar_type ??
    record.calendar ??
    (typeof record.is_lunar === "boolean" ? (record.is_lunar ? "lunar" : "solar") : null) ??
    (record.input_json?.calendar ??
     record.input_json?.calendarType ??
     (record.input_json?.isLunar ? "lunar" :
      (record.input_json?.isSolar ? "solar" : null)));

  const calLabel =
    calTypeRaw === "lunar" || calTypeRaw === "음력" || calTypeRaw === "L" ? "음력" :
    calTypeRaw === "solar" || calTypeRaw === "양력" || calTypeRaw === "S" ? "양력" :
    ""; // 모르면 빈칸

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
    <td>${calLabel}</td> <!-- ✅ 추가된 칼럼 값 -->
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
    const phone = phoneRaw ? window.normalizePhoneKR(phoneRaw, "intl") : ""; // ✅ 국제 포맷 적용

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
          emailRedirectTo: "https://treesaju.vercel.app",
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


async function openPhoneOtpModal() {
  // ── 내부 유틸: 전화번호 가져오기 + 포맷
  async function __fetchProfilePhone() {
    try {
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (!user) return "";
      const { data: prof } = await window.supabaseClient
        .from("profiles")
        .select("phone")
        .eq("user_id", user.id)
        .maybeSingle();
      return prof?.phone || user.user_metadata?.phone || "";
    } catch (e) {
      console.warn("[OTP prefill] fetch error:", e);
      return "";
    }
  }
  function __formatKR(raw) {
    const only = String(raw || "").replace(/\D+/g, "");
    if (only.length === 11) return `${only.slice(0,3)}-${only.slice(3,7)}-${only.slice(7)}`;
    if (only.length === 10) return `${only.slice(0,3)}-${only.slice(3,6)}-${only.slice(6)}`;
    return only;
  }
  async function __prefillPhoneIntoModal() {
    const el = document.getElementById("otp-phone");
    if (!el) return;
    // 이미 값이 있으면 덮어쓰지 않음
    if (el.value && el.value.trim() !== "") return;
    const raw = await __fetchProfilePhone();
    if (!raw) return;
 // 항상 toKRNational로 국내 하이픈 포맷화(+82 → 0 변환 포함)
 const val = toKRNational(raw);
    el.value = val;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // +82, 공백/하이픈 섞인 입력 → 국내 하이픈 포맷으로
function toKRNational(raw) {
  let n = String(raw || "").replace(/\D+/g, ""); // 숫자만
  if (n.startsWith("82")) n = "0" + n.slice(2);  // +82 → 0
  // 11자리(010 모바일) → 3-4-4
  if (n.length === 11) return `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7)}`;
  // 10자리: 서울(02)은 2-4-4, 그 외 3-3-4
  if (n.length === 10 && n.startsWith("02")) return `${n.slice(0,2)}-${n.slice(2,6)}-${n.slice(6)}`;
  if (n.length === 10) return `${n.slice(0,3)}-${n.slice(3,6)}-${n.slice(6)}`;
  return n; // 그 외는 원본 숫자열 반환
}

// 파일 상단 util 근처에 추가 (내부 표준화 함수)
function normalizePhoneKR(input, mode = "intl") {
  let n = String(input || "").replace(/\D+/g, "");
  if (mode === "intl") {
    if (n.startsWith("82")) return `+${n}`;
    if (n.startsWith("0"))  return `+82${n.slice(1)}`;
    if (n.startsWith("+"))  return n;
    return `+${n}`;
  } else if (mode === "nat") {
    if (n.startsWith("82")) n = "0" + n.slice(2);
    if (n.length === 11) return `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7)}`;
    if (n.length === 10 && n.startsWith("02")) return `${n.slice(0,2)}-${n.slice(2,6)}-${n.slice(6)}`;
    if (n.length === 10) return `${n.slice(0,3)}-${n.slice(3,6)}-${n.slice(6)}`;
    return n;
  }
  return input;
}


  // ── 모달이 이미 있으면: 보여주고 → ★ 자동 채움도 시도
  if (document.getElementById("phone-otp-modal")) {
    document.getElementById("phone-otp-modal").style.display = "block";
    // ★ [AUTO-PREFILL] 열릴 때마다 채움 시도
    setTimeout(__prefillPhoneIntoModal, 0);
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

  // ★ [AUTO-PREFILL] 새 모달 생성 직후에도 자동 채움
  setTimeout(__prefillPhoneIntoModal, 0);

  // 닫기
  document.getElementById("otp-close").onclick = () => {
    modal.style.display = "none";
  };

// ───────────────────────────────────────────────
// 보조 유틸: 한국 번호 → E.164(+82) 표준화
function toE164KR(raw) {
  const digits = String(raw || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("82")) return `+${digits}`;     // 82XXXXXXXXXX
  if (digits.startsWith("0"))  return `+82${digits.slice(1)}`; // 0XXXXXXXXXX
  if (digits.startsWith("+"))  return digits;           // 이미 + 포함
  return `+${digits}`;                                  // 최후 보정
}
// ───────────────────────────────────────────────

// 코드 받기
document.getElementById("otp-send").onclick = async (e) => {
  const btn = e.currentTarget;
  if (btn.disabled) return;     // 중복 클릭 방지
  btn.disabled = true;

  try {
    // 1) 입력칸에서 먼저 가져오고, 없으면 프로필에서 끌어와 자동 채움
    let raw = (document.getElementById("otp-phone").value || "").trim();
    if (!raw) {
      raw = await __fetchProfilePhone();
      if (raw) {
        const nat = toKRNational(raw); // 기존 네 함수 유지
        document.getElementById("otp-phone").value = nat;
        raw = nat;
      }
    }
    if (!raw) {
      alert("전화번호를 입력하세요.");
      return;
    }

    // 2) 서버에는 국제 포맷(E.164)으로 전송
    const phone = toE164KR(raw);
    if (!phone) {
      alert("유효한 전화번호 형식이 아닙니다.");
      return;
    }

    const res = await fetch("/api/otp?action=send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });

    const text = await res.text();
    let data = null; try { data = JSON.parse(text); } catch {}

    if (!res.ok || !data?.ok) {
      const msg = data?.error || data?.details || text || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    if (data.code) console.log("[DEV] 인증 코드:", data.code);
    alert("인증 코드가 발송되었습니다. (개발중이면 콘솔에서 코드 확인)");
  } catch (err) {
    console.error("[OTP send] error:", err);
    alert(err?.message || "인증 코드를 보낼 수 없습니다.");
  } finally {
    btn.disabled = false;
  }
};

// 인증하기
document.getElementById("otp-verify").onclick = async (e) => {
  const btn = e.currentTarget;
  if (btn.disabled) return;     // 중복 클릭 방지
  btn.disabled = true;

  try {
    const raw   = (document.getElementById("otp-phone").value || "").trim();
    const token = (document.getElementById("otp-code").value  || "").trim();
    if (!raw || !token) {
      alert("전화번호와 인증 코드를 입력하세요.");
      return;
    }

    // postJSON 가드
    if (typeof window.postJSON !== "function") {
      console.error("[OTP verify] postJSON is not defined");
      alert("내부 오류: postJSON 미정의");
      return;
    }

    const phone = (typeof window.normalizePhoneKR === "function")
      ? window.normalizePhoneKR(raw, "intl")
      : toE164KR(raw);

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) {
      alert("로그인 후 인증 가능합니다.");
      return;
    }

    const { status, json, text } = await postJSON("/api/otp?action=verify", {
      phone,
      code: token,
      user_id: user.id
    });

    const ok = (status === 200) && json?.ok && json?.verified;
    if (!ok) {
      console.error("[OTP verify] fail:", { status, json, text });
      alert("인증 실패: " + (json?.error || json?.details || text || `HTTP ${status}`));
      return;
    }

    alert("전화번호 인증이 완료되었습니다!");
    modal.style.display = "none";

    await window.supabaseClient
      .from("profiles")
      .update({
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (typeof window.openSubscriptionModal === "function") {
      window.openSubscriptionModal();
    } else {
      const subModal = document.getElementById("subscriptionModal");
      if (subModal) subModal.style.display = "block";
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    updateAuthUI(session);

  } catch (err) {
    console.error("[OTP verify] catch:", err);
    try {
      const phoneIntl = (typeof window.normalizePhoneKR === "function")
        ? window.normalizePhoneKR(document.getElementById("otp-phone").value.trim(), "intl")
        : toE164KR(document.getElementById("otp-phone").value.trim());

      const { data: me } = await window.supabaseClient.auth.getUser();
      const myId = me?.user?.id || null;

      const { data: dup } = await window.supabaseClient
        .from("profiles")
        .select("user_id")
        .eq("phone", phoneIntl)
        .neq("user_id", myId)
        .maybeSingle();

      if (dup) {
        alert("이미 존재하는 번호입니다.\n다른 번호를 입력하거나, 해당 번호로 가입된 계정으로 로그인해 주세요.");
        return;
      }
    } catch (_) {}

    const rawMsg = `${err?.message || ''} ${err?.text || ''} ${err?.json?.error || ''} ${err?.json?.details || ''}`.trim();
    alert(`인증 실패: ${rawMsg || '서버 오류'}`);
  } finally {
    btn.disabled = false;
  }
};

}


// ✅ 전화인증 모달 열릴 때 DB 전화번호 자동 채우기 (드롭인 패치)
// ✅ 전화인증 모달: DB 전화번호 자동 채우기(견고 버전)
// - 모달 DOM 렌더 타이밍 이슈 대응 (MutationObserver + 타임아웃 폴백)
// - 셀렉터 여러개 트라이
// - 이미 패치된 경우 중복 방지
(function () {
  if (window.__otpPrefillPatched2) return;
  window.__otpPrefillPatched2 = true;

  // ── 유틸: 숫자만 추출 + 보기 좋은 포맷(11자리면 010-0000-0000)
  function formatPhone(raw) {
    const only = String(raw || "").replace(/\D+/g, "");
    if (only.length === 11) return `${only.slice(0,3)}-${only.slice(3,7)}-${only.slice(7)}`;
    return only;
  }

  async function fetchUserPhone() {
    try {
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (!user) return "";
      // profiles.phone 우선
      const { data: prof } = await window.supabaseClient
        .from("profiles")
        .select("phone")
        .eq("user_id", user.id)
        .maybeSingle();
      return prof?.phone || user.user_metadata?.phone || "";
    } catch (e) {
      console.warn("[otp prefill] fetchUserPhone error:", e);
      return "";
    }
  }

  // ── 입력칸 찾기 시도 (모달 내부 렌더 완료를 기다리며)
  function findPhoneInput() {
    const CANDIDATES = [
      "#otpPhoneInput",
      'input[name="phone"]',
      'input[type="tel"]',
      '.otp-phone input',
      '.phone-input input',
      '.phone input',
    ];
    for (const sel of CANDIDATES) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  async function prefillWhenReady(value) {
    // 1) 즉시 시도
    let input = findPhoneInput();
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      try { input.selectionStart = input.selectionEnd = input.value.length; } catch {}
      return true;
    }

    // 2) MutationObserver로 3초 동안 기다리기
    const done = await new Promise((resolve) => {
      let resolved = false;
      const obs = new MutationObserver(() => {
        const el = findPhoneInput();
        if (el) {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          try { el.selectionStart = el.selectionEnd = el.value.length; } catch {}
          resolved = true;
          obs.disconnect();
          resolve(true);
        }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });

      // 3초 타임아웃 폴백
      setTimeout(() => {
        if (!resolved) {
          obs.disconnect();
          resolve(false);
        }
      }, 3000);
    });

    // 3) 폴백: 0.5초 간격 2초 추가 폴링
    if (!done) {
      const end = Date.now() + 2000;
      while (Date.now() < end) {
        await new Promise(r => setTimeout(r, 500));
        const el = findPhoneInput();
        if (el) {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          try { el.selectionStart = el.selectionEnd = el.value.length; } catch {}
          return true;
        }
      }
    }
    return false;
  }

  // ── 원본 래핑
  const originalOpen = window.openPhoneOtpModal;
  window.openPhoneOtpModal = async function (...args) {
    // 원본 먼저 호출(모달 열림)
    const ret = typeof originalOpen === "function" ? originalOpen.apply(this, args) : undefined;

    try {
      const raw = await fetchUserPhone();
      const formatted = formatPhone(raw);
      if (!formatted) return ret;

      // 모달 DOM이 그려질 시간을 한 틱 줌
      await new Promise(r => setTimeout(r, 0));
      const ok = await prefillWhenReady(formatted);
      if (!ok) console.warn("[otp prefill] 입력칸을 찾지 못했습니다. 셀렉터 확인 필요");
    } catch (e) {
      console.warn("[otp prefill] failed:", e);
    }
    return ret;
  };

  // 수동 테스트용(원할 때 호출)
  window.__testOtpPrefill = async () => {
    const raw = await fetchUserPhone();
    const formatted = formatPhone(raw);
    const ok = await prefillWhenReady(formatted);
    console.log("[__testOtpPrefill]", { raw, formatted, ok });
  };
})();





// ✅ 카카오 정기결제창 (V1 기준, 통합 API 버전)
// tier: 'basic' | 'plus'  (기본값: 'basic')
window.startKakaoSubscription = async function(tier = 'basic') {
  try {
    // 1️⃣ Supabase 로그인 확인
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");

    // ── 플랜 매핑 (금액/일일한도/표시명/내부코드) ─────────────────────────
    const PLAN = {
      basic: { amount: 11000, daily_limit: 60,  name: "Kakao 정기구독 (월간)",  planId: "recurring_monthly_60"  },
      plus:  { amount: 16500, daily_limit: 150, name: "Kakao 정기구독+ (월간)", planId: "recurring_monthly_150" },
    };
    const sel = PLAN[tier] || PLAN.basic;

    const IMP = window.IMP;
    IMP.init("imp81444885"); // ✅ 아임포트 V1 고객사 식별코드

    const userId = user.id;
    // ⚠️ 동시에 두 플랜을 운용할 수도 있으니 tier를 붙여 UID를 구분(권장)
    const customerUid = `kakao_${userId}_${tier}`; // 고객별·플랜별 고유 빌링 UID

    // 2️⃣ 결제창 호출
    IMP.request_pay({
      pg: "kakaopay.TCSUBSCRIP",          // ✅ 테스트용 카카오페이 PG상점 ID
      pay_method: "card",
      merchant_uid: `order_${tier}_` + new Date().getTime(), // 주문번호에 tier 반영
      name: sel.name,                      // ★ 플랜명
      amount: sel.amount,                  // ★ 금액(기본 11,000원 / 플러스 16,500원)
      customer_uid: customerUid,           // 플랜별 빌링키 UID
      buyer_email: user.email || "user@example.com",
      buyer_name: user.user_metadata?.name || "홍길동",
      buyer_tel: user.user_metadata?.phone || "01012345678",
    }, async function (rsp) {
      if (rsp.success) {
        alert("결제 성공 🎉\n결제번호: " + rsp.imp_uid);

        try {
          // 3️⃣ 서버로 정기결제 등록 요청 (플랜 정보 함께 전달)
          const res = await fetch("/api/payment/manage-subscription?action=register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imp_uid: rsp.imp_uid,
              customer_uid: rsp.customer_uid || customerUid,
              user_id: userId,
              // ↓ 서버에서 플랜/가격/일일한도 저장·검증할 수 있게 함께 보냄
              tier,                               // 'basic' | 'plus'
              planId: sel.planId,                 // 예: 'recurring_monthly_150'
              price: sel.amount,                  // 11000 | 16500
              daily_limit: sel.daily_limit,       // 60 | 150
            }),
          });

          const data = await res.json();
          if (res.ok) {
            alert("✅ 정기결제 등록 및 프리미엄 등급 적용 완료");
            setTimeout(() => { window.location.reload(); }, 300);
          } else {
            alert("❌ 서버 등록 실패: " + (data.error || "서버 오류"));
          }
        } catch (err) {
          console.error("[fetch error]", err);
          alert("❌ 서버 통신 오류: " + err.message);
        }

      } else {
        console.warn("[결제 실패]", rsp);
        alert("❌ 결제 실패: " + rsp.error_msg);
      }
    });
  } catch (err) {
    console.error("[startKakaoSubscription error]", err);
    alert("내부 오류: " + err.message);
  }
};

// (선택) 버튼에서 쓰기 편하도록 얇은 래퍼 제공
window.startKakaoSubscriptionBasic = () => window.startKakaoSubscription('basic'); // 1일 60회 · 11,000원
window.startKakaoSubscriptionPlus  = () => window.startKakaoSubscription('plus');  // 1일 150회 · 16,500원


//카카오 3개월 6개월 정기구독
// ───────────────────────────────────────────────────────────
// 3/6개월 선결제: Iamport KakaoPay 일반결제 → 서버에 활성화 등록
// ───────────────────────────────────────────────────────────
async function startFixedTermPay({ months, amount, productId, dailyLimit = 60 }) {
  // 1) 로그인 체크
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  if (!user) return alert("로그인이 필요합니다.");

  // 2) Iamport 초기화
  const IMP = window.IMP;
  IMP.init("imp81444885"); // 아임포트 V1 고객사 식별코드 (정기결제와 동일)

  // 3) 주문번호 생성
  const merchantUid = `order_fixed_${months}m_${Date.now()}`;

  // 4) 결제창 호출 (일반결제: pg='kakaopay')
  IMP.request_pay({
    pg: "kakaopay.TC0ONETIME",    // ★ 원타임(테스트 MID)
    pay_method: "card",
    merchant_uid: merchantUid,
    name: `${months}개월 구독 (1일 ${dailyLimit}회)`,
    amount,                       // ★ 3개월=60000, 6개월=100000
    buyer_email: user.email || "user@example.com",
    buyer_name: user.user_metadata?.name || "홍길동",
    buyer_tel: user.user_metadata?.phone || "01012345678",
  }, async (rsp) => {
    if (!rsp.success) {
      console.warn("[fixed pay fail]", rsp);
      return alert("❌ 결제 실패: " + rsp.error_msg);
    }

    // 5) 서버에 활성화 요청 (검증 + 기간부여)
    try {
      const res = await fetch("/api/payment/manage-subscription?action=activate_fixed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imp_uid: rsp.imp_uid,        // 아임포트 결제건 식별자
          merchant_uid: rsp.merchant_uid,
          user_id: user.id,
          productId,                   // 예: 'sub_3m_60_60000'
          termMonths: months,          // 3 | 6
          dailyLimit,                  // 60
          price: amount,               // 60000 | 100000
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ 결제가 완료되었습니다. 구독이 활성화됐어요!");
        setTimeout(() => window.location.reload(), 300);
      } else {
        alert("❌ 서버 처리 실패: " + (data.error || "서버 오류"));
      }
    } catch (err) {
      console.error("[fixed activate error]", err);
      alert("❌ 서버 통신 오류: " + err.message);
    }
  });
}


// 버튼 핸들러 (이미 바인딩되어 있으니 함수만 존재하면 됩니다)
// ★ 전역에 올려서 어디서든 호출 가능하게
window.startThreeMonthPlan = function () {
  return startFixedTermPay({ months: 3, amount: 60000, productId: "sub_3m_60_60000", dailyLimit: 60 });
};
window.startSixMonthPlan = function () {
  return startFixedTermPay({ months: 6, amount: 100000, productId: "sub_6m_60_100000", dailyLimit: 60 });
};



// 결제수단 선택 모달

// ───────────────────────────────────────────────
// 카카오 진입 지점만 선택창을 중간에 끼우는 최소 패치
// (기존 버튼/화면은 손대지 않음)
// ───────────────────────────────────────────────







// ───────────────────────────────────────────────────────────
// INICIS(이니시스) - PortOne(아임포트) 결제 모듈 (라우트 불필요)
//  - 정기결제: startInicisSubscription('basic'|'plus')
//  - 선결제(3/6개월): startInicisThreeMonthPlan(), startInicisSixMonthPlan()
// ───────────────────────────────────────────────────────────

// ───────────────────────────────────────────────────────────
// INICIS(이니시스) - PortOne(아임포트) 결제 모듈 (라우트 불필요)
//  - 정기결제: startInicisSubscription('basic'|'plus')
//  - 선결제(3/6개월): startInicisThreeMonthPlan(), startInicisSixMonthPlan()
//  - 변경점: 결제 성공 시 서버로 receipt_hint(영수증 힌트) 함께 전달
// ───────────────────────────────────────────────────────────
(function () {
  // ====== 환경 스위치 ======
  const USE_TEST = true; // ← 운영 전환 시 false 로 변경

  // 테스트 MID
  const PG_ONETIME_TEST   = "html5_inicis.INIpayTest"; // 단건(일반)
  const PG_RECURRING_TEST = "html5_inicis.INIBillTst"; // 정기(빌링)

  // 운영 MID (필요 시 교체)
  const PG_ONETIME_PROD   = "html5_inicis.MOI9890153";    // 일반(예시)
  const PG_RECURRING_PROD = "html5_inicis.MOI0760015"; // 정기(빌링) MID 입력

  const PG = {
    onetime:   USE_TEST ? PG_ONETIME_TEST   : PG_ONETIME_PROD,
    recurring: USE_TEST ? PG_RECURRING_TEST : PG_RECURRING_PROD,
  };

  const IMP_CODE = "imp81444885"; // ← 본인 프로젝트 imp 코드로 교체

  // 중복 클릭 방지
  let __inicisLock = false;
  function withLock(fn) {
    return async (...args) => {
      if (__inicisLock) return;
      __inicisLock = true;
      try { return await fn(...args); }
      finally { __inicisLock = false; }
    };
  }

  function ensureIMP() {
    if (!window.IMP || typeof window.IMP.init !== "function") {
      alert("결제 모듈이 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      throw new Error("IMP not loaded");
    }
    const IMP = window.IMP;
    try { IMP.init(IMP_CODE); } catch (_) {}
    return IMP;
  }

  function normalizeTel(tel) {
    if (!tel) return "01012345678";
    const only = String(tel).replace(/\D+/g, "");
    return only || "01012345678";
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  /**
   * 공통 결제 요청
   * - PortOne 콜백(rsp)에서 가능한 한 많은 필드를 수집해 receipt_hint로 반환
   */
  async function requestPayInicis({ name, amount, merchant_uid, customer_uid }) {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    const IMP = ensureIMP();

    // customer_uid 있으면 정기(빌링), 없으면 단건
    const pgToUse = customer_uid ? PG.recurring : PG.onetime;
    console.log(`[INICIS] MODE=${USE_TEST ? "TEST" : "PROD"} PG=${pgToUse}`);

    const payload = {
      pg: pgToUse,
      pay_method: "card",
      merchant_uid,
      name,
      amount: Number(amount),
      buyer_email: user.email || "user@example.com",
      buyer_name: user.user_metadata?.name || "홍길동",
      buyer_tel: normalizeTel(user.user_metadata?.phone),
      m_redirect_url: location.origin + "/payment/complete",
    };
    if (customer_uid) payload.customer_uid = customer_uid;

    return new Promise((resolve) => {
      IMP.request_pay(payload, (rsp) => {
        console.log("[INICIS rsp]", rsp);
        if (!rsp || !rsp.success) {
          return resolve({ ok: false, error: rsp?.error_msg || "결제 실패", rsp });
        }

        // 프론트에서 알고 있는 최소/안전값 수집 (서버 검증으로 최종 확정)
        const receipt_hint = {
          provider: "inicis",
          kind: customer_uid ? "recurring_start" : "fixed",
          amount: Number(rsp.paid_amount ?? payload.amount),
          price: Number(rsp.paid_amount ?? payload.amount),
          imp_uid: rsp.imp_uid || null,
          merchant_uid: rsp.merchant_uid || merchant_uid || null,
          customer_uid: customer_uid || null,
          pay_method: rsp.pay_method || "card",
          pg_provider: rsp.pg_provider || "inicis",
          pg_tid: rsp.pg_tid || rsp.apply_num || null,   // 없을 수도 있음
          paid_at_unix: typeof rsp.paid_at === "number" ? rsp.paid_at : null, // 없으면 서버 검증에서 보완
          at: new Date().toISOString(),
        };

        resolve({ ok: true, rsp, receipt_hint });
      });
    });
  }

  // ───────── 정기결제 시작 ─────────
  async function _startInicisSubscription(tier = "basic") {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");

    const PLAN = {
      basic: { amount: 11000, daily_limit: 60,  name: "INICIS 정기구독 (월간)",  planId: "recurring_monthly_60" },
      plus:  { amount: 16500, daily_limit: 150, name: "INICIS 정기구독+ (월간)", planId: "recurring_monthly_150" },
    };
    const sel = PLAN[tier] || PLAN.basic;

    const customerUid = `inicis_${user.id}_${tier}`;
    const merchantUid = `inicis_subs_${tier}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const res = await requestPayInicis({
      name: sel.name,
      amount: sel.amount,
      merchant_uid: merchantUid,
      customer_uid: customerUid,
    });

    if (!res.ok) return alert("❌ 결제 실패: " + res.error);
    alert("결제 성공 🎉\n결제번호: " + res.rsp.imp_uid);

    // 서버에 등록(+ receipt_hint 전달)
    const r = await postJSON("/api/payment/manage-subscription?action=register", {
      provider: "inicis",
      imp_uid: res.rsp.imp_uid,
      customer_uid: res.rsp.customer_uid || customerUid,
      user_id: user.id,
      tier,
      planId: sel.planId,
      price: sel.amount,
      daily_limit: sel.daily_limit,
      receipt_hint: res.receipt_hint || null, // ★ 추가
    });
    if (!r.ok) return alert("❌ 서버 등록 실패: " + (r.data.error || r.status));

    alert("✅ 정기결제 등록 및 프리미엄 등급 적용 완료");
    setTimeout(() => location.reload(), 300);
  }

  window.startInicisSubscription = withLock(_startInicisSubscription);
  window.startInicisSubscriptionBasic = () => window.startInicisSubscription("basic");
  window.startInicisSubscriptionPlus  = () => window.startInicisSubscription("plus");

  // ───────── 3/6개월 선결제 ─────────
  async function _startInicisFixedTermPay({ months, amount, productId, dailyLimit = 60 }) {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");

    const merchantUid = `inicis_fixed_${months}m_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const res = await requestPayInicis({
      name: `INICIS ${months}개월 구독 (일 ${dailyLimit}회)`,
      amount,
      merchant_uid: merchantUid,
    });

    if (!res.ok) return alert("❌ 결제 실패: " + res.error);

    // 서버 활성화(+ receipt_hint 전달)
    const r = await postJSON("/api/payment/manage-subscription?action=activate_fixed", {
      provider: "inicis",
      imp_uid: res.rsp.imp_uid,
      merchant_uid: res.rsp.merchant_uid,
      user_id: user.id,
      productId,
      termMonths: months,
      dailyLimit,
      price: amount,
      receipt_hint: res.receipt_hint || null, // ★ 추가
    });
    if (!r.ok) return alert("❌ 서버 처리 실패: " + (r.data.error || r.status));

    alert("✅ 결제가 완료되었습니다. 구독이 활성화됐어요!");
    setTimeout(() => location.reload(), 300);
  }

  window.startInicisThreeMonthPlan = withLock(() =>
    _startInicisFixedTermPay({ months: 3, amount: 60000, productId: "sub_3m_60_60000", dailyLimit: 60 })
  );
  window.startInicisSixMonthPlan = withLock(() =>
    _startInicisFixedTermPay({ months: 6, amount: 100000, productId: "sub_6m_60_100000", dailyLimit: 60 })
  );
})();






// ─── 로그인된 유저가 전화 인증 필요하면 모달을 띄우는 검사 ───
// 기존 함수 덮어쓰기(리턴값 추가: true/false)
// ✅ 전화인증 가드: 인증 OK면 true, 모달 띄우면 false 반환
// ✅ 전화인증 가드: 인증 OK면 true, 모달 띄우면 false
// daysValid: 인증 유효일수(기본 3일). 테스트로 항상 모달 띄우려면 daysValid=0 로 호출.
// ✅ 전화번호 인증 유효기간: 시간 단위 (기본 1시간)
window.requirePhoneVerificationIfNeeded = async function(daysValid = 3) {
  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) { openPhoneOtpModal?.(); return false; }

    const { data: prof, error } = await window.supabaseClient
      .from("profiles")
      .select("phone_verified, phone_verified_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("[requirePhoneVerificationIfNeeded] profiles 조회 오류:", error); // ← 여기 꼭 찍어보세요
      openPhoneOtpModal?.();
      return false;
    }

    const isFlagTrue = prof?.phone_verified === true;     // 플래그 우선
    if (isFlagTrue) return true;          // ✅ 전화인증 플래그가 true면 기간 무시하고 바로 통과
// ✅ 플래그가 false면 기간과 무관하게 즉시 모달
if (!isFlagTrue) {
  typeof openPhoneOtpModal === "function" ? openPhoneOtpModal() : alert("전화 인증이 필요합니다.");
  return false;
}
    const ts = prof?.phone_verified_at ? new Date(prof.phone_verified_at).getTime() : 0;
    const validMs = Math.max(0, daysValid) * 24 * 60 * 60 * 1000;
    const isWithinWindow = daysValid > 0 && ts > 0 && (Date.now() - ts) <= validMs;

    const ok = isFlagTrue || isWithinWindow;
    if (!ok) { openPhoneOtpModal?.(); return false; }
    return true;
  } catch (e) {
    console.warn("[requirePhoneVerificationIfNeeded] 예외:", e);
    openPhoneOtpModal?.();
    return false;
  }
};






// ✅ 정기구독 버튼 클릭 시
// 전역: 자동 닫힘 타이머(있으면 유지)




window.__subModalTimer = window.__subModalTimer || null;

window.openSubscriptionModal = async function () {
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  if (!user) return alert("로그인이 필요합니다.");
  // ★ 추가: 결제 모달 열기 전, 휴대폰 인증 유효성 검사

  // ─────────────────────────────────────────────────────────────
  // [NEW] 플랜 메타: 타입(onetime/subs), 코드, 금액
  const PLANS = {
    "3m":  { type: "onetime", plan_code: "premium3",       amount: 60000,  label: "3개월 구독" },
    "6m":  { type: "onetime", plan_code: "premium6",       amount: 100000, label: "6개월 구독" },
    "rb":  { type: "subs",    plan_code: "premium",        amount: 11000,  label: "정기구독(기본)" },
    "rp":  { type: "subs",    plan_code: "premium_plus",   amount: 16500,  label: "정기구독+" },
  };
  let __pendingChoice = null; // { planKey }

  function msLeftUntil(endDate) {
    if (!endDate) return Infinity;
    return Math.max(0, new Date(endDate).getTime() - Date.now());
  }
function formatRemaining(endDate) {
  const ms = msLeftUntil(endDate);
  if (!Number.isFinite(ms)) return '-';
  if (ms <= 0) return '0';

  const ONE_DAY = 24 * 60 * 60 * 1000;

  // 일 단위 표기는 기존 로직 유지 (반올림은 그대로)
  if (ms >= ONE_DAY) {
    const days = Math.ceil(ms / ONE_DAY);
    return `${days}일`;
  }

  // ⏱ 분/시간 계산: floor로 정확히 자르고, 1분 미만은 별도 표기
  const totalMins = Math.floor(ms / 60000);
  if (totalMins <= 0) return '1분 미만';

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours === 0) return `${totalMins}분`;
  if (mins === 0)  return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

  function formatKSTDate(dateLike) {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
    });
  }

  const modal = document.getElementById("subscriptionModal");
  if (!modal) return;

  const close = () => {
    modal.style.display = "none";
    if (window.__subModalTimer) { clearTimeout(window.__subModalTimer); window.__subModalTimer = null; }
  };

  modal.style.display = "block";
  modal.innerHTML = `
    <div class="modal-panel" style="background:#fff; border-radius:10px; padding:16px; max-width:520px; margin:0 auto;">
      <h3 style="margin:0 0 8px;">구독</h3>
      <p style="margin:0;">불러오는 중...</p>
    </div>
  `;

  if (!modal.__outsideCloseBound) {
    modal.addEventListener("mousedown", (e) => {
      const panel = modal.querySelector(".modal-panel") || modal.firstElementChild || null;
      if (panel && !panel.contains(e.target)) close();
    });
    modal.__outsideCloseBound = true;
  }
  if (!window.__subEscBound) {
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    window.__subEscBound = true;
  }

  // ─────────────────────────────────────────────────────────────
  // [NEW] 결제수단 선택 미니 모달 생성/열기/닫기
  function ensureGatewayChooser() {
    if (document.getElementById("gwChooser")) return;
    const wrap = document.createElement("div");
    wrap.id = "gwChooser";
    wrap.style.cssText = `
      display:none; position:fixed; inset:0; z-index:9999;
      background:rgba(0,0,0,0.35);
      align-items:center; justify-content:center;
    `;
    wrap.innerHTML = `
      <div class="gw-card" style="background:#fff; border-radius:10px; padding:16px; width:min(360px, 92vw); box-shadow:0 10px 30px rgba(0,0,0,.15);">
        <h4 style="margin:0 0 8px; font-size:18px;">결제수단 선택</h4>
        <p id="gwDesc" style="margin:0 0 12px; font-size:13px; color:#555;"></p>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button id="gwBtnInicis" class="btn-outline" style="border:1px solid #ddd; background:#fff; border-radius:6px; padding:8px 12px;">이니시스 (카드/계좌)</button>
          <button id="gwBtnKakao"  class="btn-success" style="border-radius:6px; padding:8px 12px;">카카오페이 간편결제</button>
          <button id="gwBtnClose"  class="btn-ghost"   style="border:1px solid #eee; background:#f5f5f5; border-radius:6px; padding:8px 12px;">취소</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    // 닫기
    wrap.addEventListener("mousedown", (e) => {
      const card = wrap.querySelector(".gw-card");
      if (card && !card.contains(e.target)) closeGatewayChooser();
    });
    document.getElementById("gwBtnClose").addEventListener("click", closeGatewayChooser);

    // 이니시스 분기
    // 이니시스 버튼 클릭 시: 라우트 호출(x) → PortOne 함수 직접 호출(o)
document.getElementById("gwBtnInicis").addEventListener("click", () => {
  if (!__pendingChoice) return;
  const key = __pendingChoice.planKey;

  try {
    switch (key) {
      case "3m":
        (window.startInicisThreeMonthPlan || startInicisThreeMonthPlan)();
        break;
      case "6m":
        (window.startInicisSixMonthPlan || startInicisSixMonthPlan)();
        break;
      case "rb":
        (window.startInicisSubscriptionBasic || startInicisSubscriptionBasic)();
        break;
      case "rp":
        (window.startInicisSubscriptionPlus || startInicisSubscriptionPlus)();
        break;
      default:
        alert("선택한 플랜을 찾을 수 없습니다.");
    }
  } finally {
    closeGatewayChooser();
  }
});


    // 카카오 분기(기존 함수 재사용)
    document.getElementById("gwBtnKakao").addEventListener("click", async () => {
      if (!__pendingChoice) return;
      const { planKey } = __pendingChoice;
      try {
        if (planKey === "3m") {
          (window.startThreeMonthPlan || startThreeMonthPlan)();
        } else if (planKey === "6m") {
          (window.startSixMonthPlan || startSixMonthPlan)();
        } else if (planKey === "rb") {
          (window.startKakaoSubscriptionBasic || startKakaoSubscriptionBasic)();
        } else if (planKey === "rp") {
          (window.startKakaoSubscriptionPlus || startKakaoSubscriptionPlus)();
        }
      } finally {
        closeGatewayChooser();
      }
    });
  }
  function openGatewayChooser(planKey) {
    ensureGatewayChooser();
    __pendingChoice = { planKey };
    const meta = PLANS[planKey];
    const desc = document.getElementById("gwDesc");
    if (desc) desc.textContent = `${meta.label} - 결제수단을 선택하세요.`;
    const layer = document.getElementById("gwChooser");
    if (layer) layer.style.display = "flex";
  }
  function closeGatewayChooser() {
    __pendingChoice = null;
    const layer = document.getElementById("gwChooser");
    if (layer) layer.style.display = "none";
  }
  // ─────────────────────────────────────────────────────────────

  function renderPurchaseChoices() {
    modal.innerHTML = `
      <style>
        .modal-panel{
          background:#fff; border-radius:10px; padding:16px; max-width:520px; margin:0 auto;
          font-size:16px; line-height:1.55; -webkit-text-size-adjust:100%;
        }
        .modal-panel h3{ margin:0 0 8px; font-size:20px; }
        .modal-panel p{  margin:0 0 12px; font-size:14px; }
        .modal-panel .plan{ background:#f9fafb; border:1px solid #eee; border-radius:8px; padding:12px; margin-bottom:12px; }
        .modal-panel ul{ margin:0; padding-left:18px; line-height:1.6; }
        .modal-panel li{ font-size:14px; }
        @media (max-width:480px){
          .modal-panel{ max-width:94vw; padding:14px; font-size:14px; }
          .modal-panel h3{ font-size:18px; }
          .modal-panel p, .modal-panel li{ font-size:13px; }
        }
        @media (max-width:360px){
          .modal-panel{ padding:12px; font-size:13px; }
          .modal-panel h3{ font-size:16px; }
          .modal-panel p, .modal-panel li{ font-size:12px; }
        }
      </style>
      <div class="modal-panel">
        <h3>구독 결제</h3>
        <p>전화번호 인증이 완료되었습니다. 상품을 선택하여 결제하세요.</p>

        <div class="plan">
          <ul>
            <li><strong>3개월 일반 결제</strong>: 1일 60회 · <strong>3개월간 60,000원[일시불]</strong></li>
            <li><strong>6개월 일반 결제</strong>: 1일 60회 · <strong>6개월간 100,000원[일시불]</strong></li>
            <li><strong>프리미엄 정기구독 결제</strong> (기본): 1일 60회 · <strong>월 11,000원</strong></li>
            <li><strong>프리미엄+ 정기구독 결제</strong> (플러스): 1일 150회 · <strong>월 16,500원</strong></li>
          </ul>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn-success" id="btn3m">3개월 일반 결제</button>
          <button class="btn-success" id="btn6m">6개월 일반 결제</button> <br>
          <button class="btn-success" id="btnRecurringBasic">프리미엄 정기구독 결제</button> 
          <button class="btn-success" id="btnRecurringPlus">프리미엄+ 정기구독 결제</button>
          <button id="subCloseBtn" style="border:1px solid #ddd; background:#f5f5f5; border-radius:6px; padding:6px 10px;">닫기</button>
        </div>
      </div>
    `;

    // [변경점] 카카오 직행 → 결제수단 선택으로 변경
// 결제 모달 렌더 이후 바인딩 부분만 수정
document.getElementById("btn3m")?.addEventListener("click", async () => {
  const ok = await requirePhoneVerificationIfNeeded();
  if (!ok) return;                 // 인증 완료 전엔 진행 X
  openGatewayChooser("3m");        // 기존 흐름
});

document.getElementById("btn6m")?.addEventListener("click", async () => {
  const ok = await requirePhoneVerificationIfNeeded();
  if (!ok) return;
  openGatewayChooser("6m");
});

document.getElementById("btnRecurringBasic")?.addEventListener("click", async () => {
  const ok = await requirePhoneVerificationIfNeeded();
  if (!ok) return;
  openGatewayChooser("rb");
});

document.getElementById("btnRecurringPlus")?.addEventListener("click", async () => {
  const ok = await requirePhoneVerificationIfNeeded();
  if (!ok) return;
  openGatewayChooser("rp");
});

    document.getElementById("subCloseBtn")?.addEventListener("click", close);
  }

  // ── 헬퍼: memberships.metadata에서 customer_uid 읽기
  async function readCustomerUid() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    const { data, error } = await window.supabaseClient
      .from("memberships")
      .select("metadata")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    let meta = null;
    try {
      if (!data?.metadata) meta = null;
      else meta = (typeof data.metadata === "string") ? JSON.parse(data.metadata) : data.metadata;
    } catch { meta = null; }

    return meta?.customer_uid || null;
  }

  // 네트워크 오류 등으로 응답을 못 받았을 때, 정말 전환이 반영됐는지 짧게 확인
  async function confirmSwitchSuccess(userId, tier, tries = 3, delayMs = 500) {
    const expectPlan = tier === 'plus' ? 'premium_plus' : 'premium';
    for (let i = 0; i < tries; i++) {
      const { data, error } = await window.supabaseClient
        .from('memberships')
        .select('plan, status, current_period_end')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data && data.plan === expectPlan && data.status === 'active') {
        return true;
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
    return false;
  }

  // ── 헬퍼: 정기 전환 전에 빌링키 보장 (tier: 'basic' | 'plus')
async function ensureBillingKeyForTier(tier) {
  const existing = await readCustomerUid().catch(() => null);
  if (existing) return true;

  if (!confirm("정기 결제를 위해 카드(빌링키) 등록이 필요합니다. 지금 등록하시겠어요?")) {
    return false;
  }

  // ✅ 카카오/이니시스 선택창을 먼저 띄움
  // tier === 'basic' → 'rb', tier === 'plus' → 'rp'
  const planKey = (tier === 'plus') ? 'rp' : 'rb';
  if (typeof openGatewayChooser === 'function') {
    openGatewayChooser(planKey);
  } else {
    // (혹시 함수 스코프 문제로 접근 못할 때를 위한 안전장치)
    const opener = window.openGatewayChooser || openGatewayChooser;
    if (typeof opener === 'function') opener(planKey);
  }

  // ✅ 사용자가 결제수단 선택 후(카카오/이니시스 중 하나로 빌링 등록), 빌링키 생성될 때까지 폴링
  const timeoutMs = 60000;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise(r => setTimeout(r, 2000));
    const uid = await readCustomerUid().catch(() => null);
    if (uid) return true;
  }
  alert("카드 등록이 확인되지 않았습니다. 등록을 마친 후 다시 시도해 주세요.");
  return false;
}




  try {
    const { data, error } = await window.supabaseClient
      .from("memberships")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data || data.status === "inactive") {
      renderPurchaseChoices();
      return;
    }

    const plan = (data.plan || "").trim();
    const isFixed = plan === "premium3" || plan === "premium6";
    const isRecurring = plan === "premium" || plan === "premium_plus";
    const resumeLabel = isFixed ? "다시 구매하기" : "재구독 신청하기";
    const isCancelRequested = !!data.cancel_at_period_end;

    const dateLabel = isFixed ? "만료일" : (isCancelRequested ? "해지 예정일" : "다음 결제일");

    let statusText;
    if (isFixed) {
      statusText = (data.status === "active")
        ? (isCancelRequested ? "active (만료 예정)" : "active (선결제)")
        : data.status;
    } else {
      statusText = isCancelRequested ? `${data.status} (해지 신청됨)` : data.status;
    }

    const dateValue = data.current_period_end
      ? formatKSTDate(data.current_period_end)
      : "-";

    const end = data.current_period_end ? new Date(data.current_period_end) : null;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const canSwitchOrBuy = end ? msLeftUntil(end) <= ONE_DAY : true;
    const remainingLabel = end ? formatRemaining(end) : '-';

    const switchNotice = end
      ? `<div style="margin-top:6px;color:${canSwitchOrBuy ? '#0a7c0a' : '#c0392b'};font-size:12px;">
           ${canSwitchOrBuy
             ? `지금은 플랜 변경 or 새 구매가 가능합니다. (만료까지 약 ${remainingLabel} 남음)`
             : `플랜 변경 or 새 구매는 <b>만료 24시간 전부터</b> 가능합니다. (현재 남은 시간: 약 ${remainingLabel})`
           }
         </div>`
      : "";

    // ✅ 공통 가드 & 비활성화 유틸
    const guardSwitch = () => {
      if (!canSwitchOrBuy) {
        const remain = end ? formatRemaining(end) : '-';
        alert(
          `현재 플랜 만료까지 약 ${remain} 남았습니다.\n` +
          `플랜 변경 또는 새 구매는 만료 24시간 전부터 가능합니다.`
        );
        return false;
      }
      return true;
    };
    const disableIfLocked = (btnId) => {
      const el = document.getElementById(btnId);
      if (!el) return;
      if (!canSwitchOrBuy) {
        el.disabled = true;
        el.style.opacity = "0.5";
        el.style.cursor = "not-allowed";
        el.title = "만료 24시간 전부터 가능합니다.";
      }
    };

    let changeLabel = "플랜 변경";
    if (plan === "premium") changeLabel = "다른 플랜으로 전환";
    else if (plan === "premium_plus") changeLabel = "다른 플랜으로 전환";
    else if (plan === "premium3" || plan === "premium6") changeLabel = "다른 플랜으로 전환";

    modal.innerHTML = `
      <div class="modal-panel" style="background:#fff; border-radius:10px; padding:16px; max-width:520px; margin:0 auto;">
        <h3 style="margin:0 0 8px;">구독 정보</h3>
        <p style="margin:4px 0;"><strong>플랜:</strong> ${data.plan ?? "-"}</p>
        <p style="margin:4px 0;"><strong>상태:</strong> ${statusText}</p>
        <p style="margin:4px 0 12px;"><strong>${dateLabel}:</strong> ${dateValue}</p>
        ${switchNotice}<br>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          ${
            isRecurring
              ? (isCancelRequested
                  ? `<button id="resumeSubBtn" class="btn-success">${resumeLabel}</button>`
                  : `<button id="cancelSubBtn" style="border:1px solid #ddd; background:#fff; border-radius:6px; padding:6px 10px;">정기결제 해지 신청</button>`
                )
              : ''
          }

          <button id="changePlanBtn" class="btn-success">${changeLabel}</button>

          <button id="subCloseBtn2" class="btn-success">닫기</button>
        </div>

        ${
          isCancelRequested
            ? `<div style="margin-top:8px; color:#888; font-size:12px;">(현재 ${dateLabel}까지 이용 가능합니다. <br> *주의: 플랜전환시 즉시 전환되므로 1일 사주출력횟수 제한치도 즉시 전환됩니다!!!)</div>`
            : `<div style="margin-top:8px; color:#888; font-size:12px;">10초 후 자동으로 닫혀요.<br> *주의: 플랜전환시 즉시 전환되므로 1일 사주출력횟수 제한치도 즉시 전환됩니다!!!</div>`
        }
      </div>
    `;

    document.getElementById("subCloseBtn2")?.addEventListener("click", close);

    // ✅ 버튼 비활성화(UX)
    disableIfLocked("changePlanBtn");

    // ✅ 변경 버튼(전환/새구매 전체 가드)
    document.getElementById("changePlanBtn")?.addEventListener("click", async () => {

   // ✅ ✅ 결제/전환 진입 가드 (한 번만)
   const ok = await requirePhoneVerificationIfNeeded();  // (또는 ensurePhoneVerifiedForPayment())
   if (!ok) return;
      if (!guardSwitch()) return;
      const curPlan = plan;

      // A) 정기 (premium / premium_plus)
      if (curPlan === "premium" || curPlan === "premium_plus") {

        const howRaw = window.prompt(
          "변경 방법을 선택하세요:\n" +
          "1 = 정기 내에서 플랜 전환(기본↔플러스)\n" +
          "3 = 프리미엄3(선결제)로 전환\n" +
          "6 = 프리미엄6(선결제)로 전환",
          "1"
        );
        if (howRaw === null) return;
        const how = String(howRaw).trim();
        if (!["1", "3", "6"].includes(how)) return;

  if (how === "3") { openGatewayChooser("3m"); return; }
  if (how === "6") { openGatewayChooser("6m"); return; }

        if (how === "1") {
          const target = (curPlan === "premium_plus") ? "premium" : "premium_plus";
          const res = await fetch("/api/payment/manage-subscription?action=change_plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id, new_plan: target }),
          });
          const json = await res.json();

          if (res.status === 409 && json?.error === "NEED_BILLING_KEY") {
            if (json.next_plan === "premium_plus") {
              (window.startKakaoSubscriptionPlus || startKakaoSubscriptionPlus)();
            } else {
              (window.startKakaoSubscriptionBasic || startKakaoSubscriptionBasic)();
            }
            alert("정기 결제 등록 화면으로 이동합니다. 등록 완료 후 다시 전환을 눌러 주세요.");
            return;
          }

          if (!res.ok) {
            alert("변경 실패: " + (json.error || ""));
            return;
          }

          alert(json.message || "플랜이 변경되었습니다. 다음 결제부터 적용돼요.");
          window.location.reload();
          return;
        }
        return;
      }

      // B) 선결제 (premium3 / premium6) → 클릭 패널
      if (curPlan === "premium3" || curPlan === "premium6") {


        const old = document.getElementById("planSwitchSheet");
        if (old) { old.remove(); return; }

        const sheet = document.createElement("div");
        sheet.id = "planSwitchSheet";
        sheet.style.cssText = "margin-top:8px; border:1px solid #eee; background:#fafafa; border-radius:8px; padding:10px;";

        const primaryFixedLabel = (curPlan === "premium3")
          ? "프리미엄6(6개월)로 전환"
          : "프리미엄3(3개월)로 전환";

        sheet.innerHTML = `
          <div style="font-size:13px; color:#555; margin-bottom:8px;">변경 방법을 선택하세요</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <button id="optFixedToggle"    style="border:1px solid #ddd; background:#fff; border-radius:6px; padding:6px 10px;">${primaryFixedLabel}</button>
            <button id="optRecurringBasic" class="btn-success">정기(기본)으로 즉시 전환</button>
            <button id="optRecurringPlus"  class="btn-success">정기(플러스)로 즉시 전환</button>
            <button id="optCancel"         style="border:1px solid #ddd; background:#f5f5f5; border-radius:6px; padding:6px 10px;">닫기</button>
          </div>
        `;

        const panel = modal.querySelector(".modal-panel");
        (panel ? panel : modal).appendChild(sheet);

        // 선결제 ↔ 선결제 토글(구매 플로우 즉시 진입)
  sheet.querySelector("#optFixedToggle")?.addEventListener("click", async () => {
   // (선택) 여기서도 추가로 전화인증 가드를 걸고 싶으면 주석 해제
   // const ok2 = await requirePhoneVerificationIfNeeded();
   // if (!ok2) return;
   if (curPlan === "premium3") openGatewayChooser("6m");
   else                        openGatewayChooser("3m");
 });

        // 안전 헬퍼들
        async function callImmediateFromFixed(tier) {
          const res  = await fetch('/api/payment/manage-subscription?action=switch_from_fixed_to_recurring', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, next_tier: tier }) // 'basic' | 'plus'
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg = json?.message || json?.error || '전환 실패';
            throw new Error(msg);
          }
          return json;
        }

        // 선결제 → 정기(기본) 즉시 전환
        sheet.querySelector("#optRecurringBasic")?.addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          await withBtnLock(btn, async () => {
            try {
              const ok = await ensureBillingKeyForTier('basic');
              if (!ok) return;

              const { res, json, error } = await safeFetch(
                '/api/payment/manage-subscription?action=switch_from_fixed_to_recurring',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: user.id, next_tier: 'basic' }),
                }
              );

              if (error || !res) {
                const okAfter = await confirmSwitchSuccess(user.id, 'basic');
                if (okAfter) setTimeout(() => { try { window.location.reload(); } catch {} }, 200);
                return;
              }

              if (!res.ok) {
                const msg = json?.message || json?.error || '전환 실패';
                alert(`전환 실패: ${msg}`);
                return;
              }

              alert(json?.message || '정기(기본)으로 즉시 전환되었습니다. 새 주기는 기존 만료일 다음날부터 시작됩니다.');
              setTimeout(() => { try { window.location.reload(); } catch {} }, 200);
            } catch (err) {
              alert('전환 실패: ' + err.message);
            }
          });
        });

        // 선결제 → 정기(플러스) 즉시 전환
        sheet.querySelector("#optRecurringPlus")?.addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          await withBtnLock(btn, async () => {
            try {
              const ok = await ensureBillingKeyForTier('plus');
              if (!ok) return;

              const { res, json, error } = await safeFetch(
                '/api/payment/manage-subscription?action=switch_from_fixed_to_recurring',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: user.id, next_tier: 'plus' }),
                }
              );

              if (error || !res) {
                const okAfter = await confirmSwitchSuccess(user.id, 'plus');
                if (okAfter) setTimeout(() => { try { window.location.reload(); } catch {} }, 200);
                return;
              }

              if (!res.ok) {
                const msg = json?.message || json?.error || '전환 실패';
                alert(`전환 실패: ${msg}`);
                return;
              }

              alert(json?.message || '정기(플러스)로 즉시 전환되었습니다. 새 주기는 기존 만료일 다음날부터 시작됩니다.');
              setTimeout(() => { try { window.location.reload(); } catch {} }, 200);
            } catch (err) {
              alert('전환 실패: ' + err.message);
            }
          });
        });

        sheet.querySelector("#optCancel")?.addEventListener("click", () => {
          sheet.remove();
        });

        return;
      }

      // 그 외 플랜은 구매 선택 UI로
      renderPurchaseChoices();
    });

    // 정기 → 3/6 전환(빠른 버튼) 바인딩 (원래 로직 유지; 버튼이 있을 경우만)
    if (isRecurring) {
      document.getElementById("to3mBtn")?.addEventListener("click", async () => {
        if (!guardSwitch()) return;
        const r = await fetch("/api/payment/manage-subscription?action=schedule_to_fixed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, termMonths: 3 })
        });
        const j = await r.json();
        if (!r.ok) return alert("전환 예약 실패: " + (j.error || ""));
        alert(j.message || "만료일에 프리미엄3으로 자동 전환됩니다. 결제를 진행합니다.");
        (window.startThreeMonthPlan || startThreeMonthPlan)();
      });

      document.getElementById("to6mBtn")?.addEventListener("click", async () => {
        if (!guardSwitch()) return;
        const r = await fetch("/api/payment/manage-subscription?action=schedule_to_fixed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, termMonths: 6 })
        });
        const j = await r.json();
        if (!r.ok) return alert("전환 예약 실패: " + (j.error || ""));
        alert(j.message || "만료일에 프리미엄6으로 자동 전환됩니다. 결제를 진행합니다.");
        (window.startSixMonthPlan || startSixMonthPlan)();
      });
    }

    if (!isCancelRequested) {
      document.getElementById("cancelSubBtn")?.addEventListener("click", async () => {
        const targetText = end ? `다음 결제일(${formatKSTDate(end)}) 이후` : '다음 결제 주기 이후';
        const ok = confirm(`해지 신청 시 ${targetText} 자동 해지됩니다. 진행할까요?`);
        if (!ok) return;

        const res = await fetch("/api/payment/manage-subscription?action=cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id }),
        });
        const result = await res.json();
        if (res.ok) { alert("✅ " + (result.message || "해지 신청이 접수되었습니다.")); close(); }
        else       { alert("❌ " + (result.error || "요청에 실패했습니다.")); }
      });

      if (window.__subModalTimer) clearTimeout(window.__subModalTimer);
      window.__subModalTimer = setTimeout(close, 10000);
    } else {
      const resumeBtn = document.getElementById("resumeSubBtn");
      if (resumeBtn) {
        resumeBtn.addEventListener("click", async () => {
          if (plan === "premium3" || plan === "premium6") {
            renderPurchaseChoices();
            return;
          }
          try {
            const res = await fetch("/api/payment/manage-subscription?action=resume", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: user.id }),
            });
            const result = await res.json();
            if (res.ok) {
              alert("✅ 재구독 신청이 완료되었습니다.");
              setTimeout(() => window.location.reload(), 300);
            } else {
              alert("❌ " + (result.error || "요청에 실패했습니다."));
            }
          } catch (err) {
            console.error("[resume error]", err);
            alert("❌ 서버 통신 오류: " + err.message);
          }
        });
      }
    }
  } catch (e) {
    console.warn("[openSubscriptionModal] error:", e);
    renderPurchaseChoices();
  }
};











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
window.lastOutputData = null;   // ✅ 전역 변수로 선언

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

    console.log("🧩 [LOG1] formData (입력된 값):", formData);
    console.log("🧩 [LOG2] lastOutputData (이전 출력 데이터):", lastOutputData);

    if (!formData.gender) {
      alert("성별을 선택해야 합니다.");
      return;
    }

    const formKey = JSON.stringify(normalizeForm(formData));
        // 🟡 여기서 비교용 로그 추가
    console.log("🧩 [LOG3] normalizeForm(formData):", normalizeForm(formData));
    console.log("🧩 [LOG4] formKey (JSON):", formKey);
    console.log("🧩 [LOG5] lastOutputData (JSON 문자열):", lastOutputData);


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
      if (window.lastOutputData === formKey) {
        console.log("⚠️ 동일 입력(직전과 동일, 게스트) → 카운트 증가 없이 출력만");
        renderSaju(formData);
        return;
      }


// === 오늘 날짜 예외 처리 (년월일시까지만 비교) ===
const now = new Date();
const todayKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
const formDate = (formData.birthDate || '').replace(/-/g, '');

if (formDate === todayKey && window.lastOutputData) {
  try {
    const last = JSON.parse(window.lastOutputData);
    const lastDate = (last.birthDate || '').replace(/-/g, '');
    const sameDay = lastDate === formDate;
    const sameHour = String(last.hour || '') === String(formData.hour || '');
    const sameAmpm = String(last.ampm || '').toUpperCase() === String(formData.ampm || '').toUpperCase();

    if (sameDay && sameHour && sameAmpm) {
      console.log('✅ [LOG★] 오늘 날짜 & 같은 시각 → 카운트 제외');
      renderSaju(formData);
      return;
    }
  } catch (e) {
    console.warn('⚠️ 오늘날짜 예외 처리 중 JSON 파싱 실패:', e);
  }
}




      // 실제 증가 수행
      const ok = await checkRenderAllowed(); // 이 함수가 localStorage 증가/월간 제한까지 처리
      if (!ok) return;

      // 출력 실행 + 직전키 갱신
      renderSaju(formData);
      window.lastOutputData = formKey;

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
   .maybeSingle();   // ← 행이 없으면 null을 주고, throw 안 함

 if (pErr) console.warn("[handleSajuSubmit] profiles maybeSingle warn:", pErr);
 if (!profile || !profile.role) {
   console.warn("[handleSajuSubmit] profile이 없어 기본값으로 보정");
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
    if (window.lastOutputData === formKey) {
      console.log("⚠️ 동일 입력(직전과 동일, 로그인) → 카운트 증가 없이 출력만");
      renderSaju(formData);
      return;
    }

    // === 오늘 날짜 예외 처리 (년월일시까지만 비교) ===
const now = new Date();
const todayKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
const formDate = (formData.birthDate || '').replace(/-/g, '');

if (formDate === todayKey && window.lastOutputData) {
  try {
    const last = JSON.parse(window.lastOutputData);
    const lastDate = (last.birthDate || '').replace(/-/g, '');
    const sameDay = lastDate === formDate;
    const sameHour = String(last.hour || '') === String(formData.hour || '');
    const sameAmpm = String(last.ampm || '').toUpperCase() === String(formData.ampm || '').toUpperCase();

    if (sameDay && sameHour && sameAmpm) {
      console.log('✅ [LOG★] 오늘 날짜 & 같은 시각 → 카운트 제외');
      renderSaju(formData);
      return;
    }
  } catch (e) {
    console.warn('⚠️ 오늘날짜 예외 처리 중 JSON 파싱 실패:', e);
  }
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
   // console.log(`[limit] 오늘 남은 횟수: ${gateDb.remaining}/${gateDb.limit}`);
    updateCountDisplayFromGate(gateDb);

    // 3) 출력 실행 + 직전키 갱신
    renderSaju(formData);
    window.lastOutputData = formKey;

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


// === 첫 로딩 시 오늘 날짜 기준 사주 자동 출력 (카운트 제외) ===
window.addEventListener('load', async () => {
  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hour24 = now.getHours();
    const minute = now.getMinutes();

    // 🕒 오전/오후 판정
    const ampm = hour24 < 12 ? 'AM' : 'PM';
    const hour12 = hour24 % 12; // 0~11 범위

    // 요소가 모두 렌더될 때까지 대기 (SPA 대비)
    const waitFor = (sel) =>
      new Promise((resolve) => {
        const el = document.querySelector(sel);
        if (el) return resolve(el);
        const obs = new MutationObserver(() => {
          const e = document.querySelector(sel);
          if (e) {
            obs.disconnect();
            resolve(e);
          }
        });
        obs.observe(document.body, { childList: true, subtree: true });
      });

    await waitFor('#saju-form'); // 폼이 준비된 후 실행

    // === 입력값 자동 세팅 ===
    const birthInput = document.getElementById('birth-date');
    if (birthInput) birthInput.value = `${yyyy}${mm}${dd}`;

    const calendarSel = document.getElementById('calendar-type');
    if (calendarSel) calendarSel.value = 'solar';

    const genderSel = document.getElementById('gender');
    if (genderSel) genderSel.value = 'male';

    const ampmRadio = document.querySelector(`input[name='ampm'][value='${ampm}']`);
    if (ampmRadio) ampmRadio.checked = true;

    const hourSel = document.getElementById('hour-select');
    if (hourSel) hourSel.value = String(hour12); // 반드시 문자열로 세팅

    const minSel = document.getElementById('minute-select');
    if (minSel) minSel.value = String(minute);

    // === formData 구성 ===
    const todayForm = {
      name: '오늘 기준',
      birthDate: `${yyyy}${mm}${dd}`,
      calendarType: 'solar',
      gender: 'male',
      ampm,
      hour: String(hour12),
      minute: String(minute),
    };

    console.log(`[AUTO] ${yyyy}-${mm}-${dd} ${ampm} ${hour12}:${minute} (양력/남자 기준)`);

    // === 출력 실행 (카운트 제외) ===
    if (typeof renderSaju === 'function') {
      await renderSaju(todayForm);

      
   // 0.3초 후 lastOutputData 저장
  setTimeout(() => {
    const normalized = JSON.stringify({
      name: '오늘 기준',
      birthDate: `${yyyy}${mm}${dd}`,
      calendarType: 'solar',
      gender: 'male',
      ampm,
      hour: String(hour12),
      minute: String(minute),
    });

    lastOutputData = normalized;
    localStorage.setItem('lastSajuForm', normalized);
    console.log('[AUTO] lastOutputData 저장 완료 (hour/minute 포함):', normalized);

    // 저장 완료 후 버튼 다시 활성화
    sajuBtn.disabled = false;
  }, 300);



      // === 버튼 상태도 '신살보기'로 세팅 ===
      const sinsalBtn = document.getElementById('sinsalBtn');
      const sajuBtn = document.getElementById('sajuSubmit');
      sajuBtn?.classList.remove('active');
      sinsalBtn?.classList.add('active');

      // 내부 모드 변수 동기화 (있을 경우)
      window.currentMode = 'sinsal';

      // === 자동 로딩 입력값 정규화 후 저장 ===
      if (typeof normalizeForm === 'function') {
        const normalized = JSON.stringify(normalizeForm(todayForm));
        window.lastOutputData = normalized;
        localStorage.setItem('lastSajuForm', normalized);
        console.log('[AUTO] 신살보기 모드 자동 출력 후 상태 동기화 완료');
      } else {
        console.warn('⚠️ normalizeForm 함수가 정의되어 있지 않습니다.');
      }


    } else {
      console.warn('⚠️ renderSaju 함수가 아직 정의되지 않았습니다.');
    }
  } catch (err) {
    console.error('자동 사주 로딩 실패:', err);
  }
});



function normalizeForm(form) {
  if (!form) return {};
  const f = { ...form };

  // 날짜 형식 통일 (YYYYMMDD)
  if (f.birthDate) f.birthDate = f.birthDate.replace(/-/g, '');

  // AM/PM 통일
  if (f.ampm) f.ampm = f.ampm.toUpperCase();

  // 시간, 분은 카운트 비교에서 제외
  delete f.hour;
  delete f.minute;

  // 기본값 보정
  f.calendarType = f.calendarType || 'solar';
  f.gender = f.gender || 'male';
  f.name = f.name || '';

  return f;
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




/* 컨테이너 & 스크롤 래퍼 */
.Etcsinsal-tables {
  display: grid;
  gap: 16px;
}
.Etcsinsal-tables .table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgba(0,0,0,.06) inset;
}

/* 기본 반응형 테이블 설정 */
.Etcsinsal-tables .responsive-table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;                     /* 균등 분배 */
  font-size: clamp(11px, 1.6vw, 14px);
  line-height: 1.35;
  min-width: 720px;                        /* 좁은 화면에서 가로 스크롤 */
  hyphens: auto;                           /* 길고 연속된 라틴 텍스트 자동 하이픈 */
}

.Etcsinsal-tables .responsive-table th,
.Etcsinsal-tables .responsive-table td {
  padding: 6px 8px;
  /* ↓↓↓ 핵심 수정: 셀 밖으로 넘치지 않도록 줄바꿈 허용 */
  white-space: normal;                     /* 줄바꿈 허용 */
  overflow-wrap: anywhere;                 /* 너무 긴 단어/토큰도 강제 줄바꿈 */
  word-break: keep-all;                    /* 한글/한자는 단어 단위로 */
  border: 1px solid #ddd;
}

/* 첫 번째 열(신살류) sticky */
.Etcsinsal-tables .responsive-table th[rowspan],
.Etcsinsal-tables .responsive-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
}

/* 헤더 sticky */
.Etcsinsal-tables .responsive-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
}

/* 모바일 추가 축소 */
@media (max-width: 480px) {
  .Etcsinsal-tables .responsive-table {
    min-width: 600px;
    font-size: clamp(10px, 3.2vw, 12px);
  }
  .Etcsinsal-tables .responsive-table th,
  .Etcsinsal-tables .responsive-table td {
    padding: 4px 6px;
  }
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

.note-box .note-links {
  display: inline-block;
  white-space: normal; /* pre-line 영향 제거 */
  word-break: keep-all; /* 단어 단위로 줄바꿈 */
}

.note-box .note-links a {
  color: #333;
  text-decoration: none;
  margin: 0 4px;
}

.note-box .note-links a:hover {
  text-decoration: underline;
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


  <div id="basic-daeyun-table" class="basic-daeyun-container"></div>
  <div id="basic-yearly-ganji-container"></div>


`;


renderSajuMiniFromCurrentOutput({
  timeGanji, dayGanji, monthGanji, yearGanji,
  timeLines, dayLines, monthLines, yearLines,
  dayGanKorGan,
  getTenGod, convertHanToKorStem, convertKorToHanStem, colorize
});


    document.getElementById('basic-section').innerHTML = `

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

  <tr>
    <td colspan="2">
      <div id="etc-sinsal-box"></div>
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
      <div id="sinsal-box"></div>
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
// ✅ 전역 등록 (기존 구조 유지, 덮어쓰기 최소화)
if (typeof window !== 'undefined') {
  window.ilgan = ilgan;                 // 편의 전역
  window.saju = window.saju || {};      // saju가 없으면 생성
  if (!window.saju.ilgan) {             // 기존 값이 없을 때만 설정
    window.saju.ilgan = ilgan;          // 표준 경로: window.saju.ilgan
  }
  console.log('▶ 전역 일간 등록:', window.saju.ilgan);
}
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





// 기본 대운/세운표에서 현재 선택값을 읽는 최소 헬퍼
window.__readBasicFortune = {
  daeyun(){
    // 1) renderBasicDaeyunTable이 남겨둔 전역(있다면)
    if (window.basicDaeyunSelected?.stem && window.basicDaeyunSelected?.branch)
      return window.basicDaeyunSelected;

    // 2) fortuneState(이미 쓰고 있다면)
    if (window.fortuneState?.daeyun?.stem && window.fortuneState?.daeyun?.branch)
      return window.fortuneState.daeyun;

    // 3) DOM(기본표 컨테이너 기준)
    const td = document.querySelector('#daeyun-basic .daeyun-selected');
    return td ? { stem: td.dataset.stem?.trim(), branch: td.dataset.branch?.trim() } : {};
  },
  sewoon(){
    if (window.basicSewoonSelected?.stem && window.basicSewoonSelected?.branch)
      return window.basicSewoonSelected;
    if (window.fortuneState?.sewoon?.stem && window.fortuneState?.sewoon?.branch)
      return window.fortuneState.sewoon;
    const cell = document.querySelector('#sewoon-basic .sewoon-cell.selected');
    return cell ? { stem: cell.dataset.stem?.trim(), branch: cell.dataset.branch?.trim() } : {};
  }
};


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


// ─── 미니 사주창: CSS 주입 ───
(function injectMiniSajuCSS(){
  if (document.getElementById('mini-saju-style')) return;
  const s = document.createElement('style');
  s.id = 'mini-saju-style';
  s.textContent = `
    #saju-mini {
      position: fixed; right: 16px; bottom: 16px; z-index: 9999;
      width: 300px; max-width: calc(100vw - 24px);
      background:#fff; border:1px solid #e5e5ea; border-radius:12px;
      box-shadow:0 10px 30px rgba(0,0,0,.18); overflow:hidden; font-size:14px;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans KR", sans-serif;
    }
    #saju-mini .bar { display:flex; align-items:center; justify-content:space-between;
      padding:8px 10px; background:linear-gradient(180deg,#f7f7f9,#efeff3); border-bottom:1px solid #ececf1;
    }
    #saju-mini .body { max-height:260px; overflow:auto; padding:10px; }
    #saju-mini table { width:100%; border-collapse:collapse; }
    #saju-mini th, #saju-mini td { border-bottom:1px solid #f3f3f6; padding:4px 6px; text-align:left; vertical-align:top; }
    #saju-mini th { width:3.5em; color:#666; font-weight:600; }
    #saju-mini small { color:#777; }
    #saju-mini .chip { display:inline-block; padding:2px 6px; border:1px solid #eee; border-radius:6px; margin:2px 2px 0 0; background:#fbfbfe; }
    #saju-mini .btn { border:0; background:#f1f1f6; width:24px; height:24px; border-radius:6px; cursor:pointer; font-size:14px; line-height:1; }
    #saju-mini .btn:hover { background:#e9e9f2; }
    #saju-mini.is-min .body { display:none; }
  `;
  document.head.appendChild(s);
})();

// ─── 미니 사주창: 렌더러 ───
function renderSajuMiniFromCurrentOutput(ctx = {}) {
  // 1) 의존 함수(없으면 안전 폴백)
  const _getTenGod           = ctx.getTenGod           || window.getTenGod           || (() => '');
  const _convertHanToKorStem = ctx.convertHanToKorStem || window.convertHanToKorStem || (x => x);
  const _convertKorToHanStem = ctx.convertKorToHanStem || window.convertKorToHanStem || (x => x);
  const _colorize            = ctx.colorize            || window.colorize            || (x => x);

  // 2) 데이터 (ctx → window)
  const timeGanji  = ctx.timeGanji  || window.timeGanji;
  const dayGanji   = ctx.dayGanji   || window.dayGanji;
  const monthGanji = ctx.monthGanji || window.monthGanji;
  const yearGanji  = ctx.yearGanji  || window.yearGanji;

  const timeLines  = ctx.timeLines  || window.timeLines  || [];
  const dayLines   = ctx.dayLines   || window.dayLines   || [];
  const monthLines = ctx.monthLines || window.monthLines || [];
  const yearLines  = ctx.yearLines  || window.yearLines  || [];

  const dayGanKorGan = ctx.dayGanKorGan || window.dayGanKorGan || '';

  if (!dayGanji || !monthGanji || !yearGanji || !timeGanji) {
    console.warn('[mini] pillars missing — skip render');
    return;
  }

  // 3) 표 데이터 가공
  const data = {
    hour:  { gan: timeGanji.gan,  ten: _getTenGod(dayGanKorGan, _convertHanToKorStem(timeGanji.gan)),  jiji: timeGanji.ji,  hides: timeLines.map(s  => `${_convertKorToHanStem(s)} ${_getTenGod(dayGanKorGan, s)}`) },
    day:   { gan: dayGanji.gan,   ten: '일간',                                                         jiji: dayGanji.ji,   hides: dayLines.map(s   => `${_convertKorToHanStem(s)} ${_getTenGod(dayGanKorGan, s)}`) },
    month: { gan: monthGanji.gan, ten: _getTenGod(dayGanKorGan, _convertHanToKorStem(monthGanji.gan)), jiji: monthGanji.ji, hides: monthLines.map(s => `${_convertKorToHanStem(s)} ${_getTenGod(dayGanKorGan, s)}`) },
    year:  { gan: yearGanji.gan,  ten: _getTenGod(dayGanKorGan, _convertHanToKorStem(yearGanji.gan)),  jiji: yearGanji.ji,  hides: yearLines.map(s  => `${_convertKorToHanStem(s)} ${_getTenGod(dayGanKorGan, s)}`) },
  };

  // ─────────────────────────────────────────────
  // A) 고객명 읽기: id, name, data-attr까지 폭넓게 탐색
  function getCustomerName() {
    // 우선순위: input#customer-name.value → [name="customer-name"] → data-customer-name → window/customerName → ctx
    const byId = document.getElementById('customer-name');
    const byName = document.querySelector('[name="customer-name"]');
    const dataAttr = document.querySelector('[data-customer-name]');
    const vInput = byId && ('value' in byId) ? (byId.value ?? '') : '';
    const vNameInput = byName && ('value' in byName) ? (byName.value ?? '') : '';
    const vIdAttr = byId?.getAttribute?.('value') ?? '';
    const vNameAttr = byName?.getAttribute?.('value') ?? '';
    const vData = dataAttr?.getAttribute?.('data-customer-name') ?? '';
    const vText = byId && !('value' in byId) ? (byId.textContent ?? '') : '';
    const vWin  = window.customerName ?? '';
    const vCtx  = (typeof ctx.customerName === 'string' ? ctx.customerName : (ctx.name || ''));
    return (vInput || vNameInput || vIdAttr || vNameAttr || vData || vText || vWin || vCtx || '').trim();
  }

  // B) 제목 갱신
  const setMiniTitle = (label = 'setMiniTitle') => {
    const box = document.getElementById('saju-mini');
    if (!box) return;
    const titleEl = box.querySelector('#saju-mini-title') || box.querySelector('.bar strong');
    if (!titleEl) return;
    const name = getCustomerName();
    titleEl.textContent = name ? `사주팔자(${name})` : '사주팔자';
  };

  // C) 문서 위임 바인딩(1회): 고객명 요소가 늦게 생겨도 감지
  function wireMiniTitleDelegation() {
    if (window.__miniTitleDelegated) return;
    const onChange = () => setMiniTitle('doc-delegated');
    // input/textarea/select 모두 커버
    document.addEventListener('input',  (e) => {
      const t = e.target;
      if (!t) return;
      if (t.id === 'customer-name' || t.getAttribute?.('name') === 'customer-name') onChange();
    }, true);
    document.addEventListener('change', (e) => {
      const t = e.target;
      if (!t) return;
      if (t.id === 'customer-name' || t.getAttribute?.('name') === 'customer-name') onChange();
    }, true);
    window.__miniTitleDelegated = true;
  }
  // ─────────────────────────────────────────────

  // 5) CSS 1회 주입
  if (!document.getElementById('mini-saju-style')) {
    const s = document.createElement('style');
    s.id = 'mini-saju-style';
    s.textContent = `
      #saju-mini{position:fixed;right:16px;bottom:16px;z-index:9999;width:300px;max-width:calc(100vw - 24px);
        background:#fff;border:1px solid #e5e5ea;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.18);overflow:hidden;
        font-size:12px;font-family:system-ui,-apple-system,Segoe UI,Roboto,"Noto Sans KR",sans-serif;}
      #saju-mini .bar{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:linear-gradient(180deg,#f7f7f9,#efeff3);
        border-bottom:1px solid #ececf1;}
      #saju-mini .body{max-height:260px;overflow:auto;padding:10px;}
      #saju-mini table{width:100%;border-collapse:collapse;}
      #saju-mini th,#saju-mini td{border-bottom:1px solid #f3f3f6;padding:4px 6px;text-align:left;vertical-align:top;}
      #saju-mini th{color:#666;font-weight:600;}
      #saju-mini small{color:#777;}
      #saju-mini .saju-chip{display:inline-block;padding:1px 4px;border:1px solid #eee;border-radius:6px;margin:2px 2px 0 0;background:#fbfbfe;font-size:11px;}
      #saju-mini .btn{border:0;background:#f1f1f6;width:24px;height:24px;border-radius:6px;cursor:pointer;font-size:14px;line-height:1;}
      #saju-mini .btn:hover{background:#e9e9f2;}
      #saju-mini.is-min .body{display:none;}
    `;
    document.head.appendChild(s);
  }

  // 6) 박스 생성(없으면 만들고, 있으면 재사용)
  let box = document.getElementById('saju-mini');
  if (!box) {
    box = document.createElement('div');
    box.id = 'saju-mini';
    box.innerHTML = `
      <div class="bar">
        <strong id="saju-mini-title">사주팔자</strong>
        <div>
          <button class="btn" id="saju-mini-min" title="접기">—</button>
          <button class="btn" id="saju-mini-close" title="닫기">×</button>
        </div>
      </div>
      <div class="body" id="saju-mini-body"></div>
    `;
    document.body.appendChild(box);
    // 버튼
    box.querySelector('#saju-mini-min')?.addEventListener('click', () => box.classList.toggle('is-min'));
    box.querySelector('#saju-mini-close')?.addEventListener('click', () => box.remove());
    // 위임 바인딩(한 번만)
    wireMiniTitleDelegation();
    // 최초 세팅
    setMiniTitle('after-append');
  } else {
    if (!box.querySelector('#saju-mini-title')) {
      const strong = box.querySelector('.bar strong');
      if (strong) strong.id = 'saju-mini-title';
    }
  }

  // 7) 본문 표 렌더
  const body = box.querySelector('#saju-mini-body');
  const C = (txt) => (typeof _colorize === 'function' ? _colorize(txt) : (txt ?? ''));
  const coerceCol = (p) => (!p || typeof p !== 'object')
    ? { gan:'-', ten:'-', jiji:'-', hides:[] }
    : { gan: p.gan ?? '-', ten: p.ten ?? '-', jiji: p.jiji ?? '-', hides: Array.isArray(p.hides) ? p.hides : [] };

  const columns = [data.hour, data.day, data.month, data.year].map(coerceCol);

  body.innerHTML = `
    <table class="mini-grid">
      <thead>
        <tr>
          <th>시주</th>
          <th>일주</th>
          <th>월주</th>
          <th>년주</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          ${columns.map(p => `<td><strong>${C(p.gan)}</strong> <small>(${C(p.ten)})</small></td>`).join('')}
        </tr>
        <tr>
          ${columns.map(p => `<td><strong>${C(p.jiji)}</strong></td>`).join('')}
        </tr>
        <tr>
          ${columns.map(p => `<td>${p.hides.length ? p.hides.map(h => `<span class="saju-chip">(${h})</span>`).join('') : '-'}</td>`).join('')}
        </tr>
      </tbody>
    </table>
  `;

  // 8) 제목 즉시/지연 갱신(자동입력/URL 자동 채움 대응)
  setMiniTitle();
  requestAnimationFrame(() => setMiniTitle('raf'));
  setTimeout(() => setMiniTitle('t+300'), 300);

  // 수동 호출 용도(원하면 다른 코드에서 부를 수 있게)
  window.updateMiniTitle = () => setMiniTitle('manual');
}







(function wireMiniTitleLive(){
  if (window.__miniTitleWired) return;
  window.__miniTitleWired = true;

  const input = document.getElementById('customer-name');
  if (!input) return; // 페이지에 그 요소 없으면 패스

  input.addEventListener('input', () => {
    const el = document.querySelector('#saju-mini #saju-mini-title');
    if (!el) return;
    const v = input.value.trim();
    el.textContent = v ? `사주팔자(${v})` : '사주팔자';
  });
})();



// renderUserProfile 정의는 그대로 유지 (드롭인 교체)
async function renderUserProfile() {
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  if (!user) return;

  // ✅ 정기구독 및 결제 버튼
  const subscribeBtn = document.getElementById("subscribeBtn");
  if (subscribeBtn) {
    // 중복 이벤트 방지
    subscribeBtn._bound && subscribeBtn.removeEventListener("click", subscribeBtn._bound);
    subscribeBtn._bound = async (e) => {
      e.preventDefault();
      try {
        // 🔁 여기서는 전화인증 체크하지 않음 — 그냥 결제 모달만 열기
        await openSubscriptionModal();
      } catch (err) {
        console.error("[subscribeBtn] error:", err);
        alert(err?.message || "처리 중 오류가 발생했습니다.");
      }
    };
    subscribeBtn.addEventListener("click", subscribeBtn._bound);
  }

  // ✅ 로그아웃 버튼
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn._bound && logoutBtn.removeEventListener("click", logoutBtn._bound);
    logoutBtn._bound = async () => {
      await window.supabaseClient.auth.signOut();
      location.reload();
    };
    logoutBtn.addEventListener("click", logoutBtn._bound);
  }
}





 

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

  // ✅ 오늘 카운트: profiles를 최우선으로 사용 (수동 한도 변경 시 0으로 리셋된 값을 신뢰)
  const profDateKey = String(profile?.daily_usage_date || '').slice(0, 10);
  let todayCount;

  if (profDateKey === today) {
    // 프로필이 오늘 기준으로 갱신되어 있으면 그 값을 사용
    todayCount = Number(profile?.daily_usage_count) || 0;
  } else {
    // (백업 경로) 프로필 날짜가 오늘이 아니면 saju_counts에서 조회
    const { data: countRow } = await window.supabaseClient
      .from("saju_counts")
      .select("count")
      .eq("user_id", session.user.id)
      .eq("count_date", today)
      .maybeSingle();
    todayCount = Number(countRow?.count || 0);
  }

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

  // ✅ 남은 횟수는 limit - 오늘(profile 기준)로 계산
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
/***** 🔧 전역 플래그 (수동 로그아웃 구분용) *****/
let __MANUAL_LOGOUT__ = false;
let __AUTH_LISTENER_SET__ = false;
let __REALTIME_SET__ = false;

/***** 🔧 공통 POST 호출 헬퍼 *****/
// ✅ 기존 postJSON 교체본
async function postJSON(url, body, init = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    body: JSON.stringify(body),
    ...init,
  });

  // 본문 파싱 (JSON 우선)
  const ct = res.headers.get('content-type') || '';
  let json = null, text = '';
  try {
    if (ct.includes('application/json')) json = await res.json();
    else text = await res.text();
  } catch (_) {
    /* ignore parse error */
  }

  if (!res.ok) {
    // ❗️핵심: 에러에 status/json/text를 실어 던진다
    const err = new Error(json?.error || json?.message || text || `HTTP ${res.status}`);
    err.status = res.status;
    err.json = json;
    err.text = text;
    throw err;
  }

  return { status: res.status, json, text };
}

/***** ✅ 버튼: 로그인 시도만 수행 *****/
document.getElementById("loginBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value ?? "";
  if (!email || !password) return alert("이메일과 비밀번호를 입력하세요.");

  try {
    const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // 후처리는 onAuthStateChange에서 일괄 처리
  } catch (err) {
    console.error(err);
    alert(err.message || "로그인에 실패했습니다.");
  }
});

document.getElementById("signupBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  openSignupModal();
});

document.getElementById("googleLogin")?.addEventListener("click", async (e) => {
  e.preventDefault();
  await window.supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: "https://treesaju.vercel.app" },
  });
});

document.getElementById("kakaoLogin")?.addEventListener("click", async (e) => {
  e.preventDefault();
  await window.supabaseClient.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo: "https://treesaju.vercel.app" },
  });
});

/***** ✅ 로그아웃(수동) — 메시지 구분을 위해 플래그 사용 *****/
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  __MANUAL_LOGOUT__ = true;
  await window.supabaseClient.auth.signOut();
  updateAuthUI(null);
  __MANUAL_LOGOUT__ = false;
});

/***** ✅ 관리자 메뉴 표시 *****/
showIfAdmin("#admin-menu");

/***** ✅ 로그인/로그아웃 공통 파이프라인 — “한 계정 1세션” 강제 *****/
function bindAuthPipelines() {
  if (__AUTH_LISTENER_SET__) return;
  __AUTH_LISTENER_SET__ = true;

  window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
    try {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user?.id) {
        const userId = session.user.id;
        const sessionId = session.access_token; // (표시용) 현재 기기 식별

        // 1) 기존 로그인 세션 전부 종료 (다른 기기 즉시 무효화 상태로)
        await window.supabaseClient.auth.signOut({ scope: "others" });

        // 2) 현재 세션을 active_sessions에 기록 (Realtime 트리거 포인트)
        await postJSON("/api/update-session", { user_id: userId, session_id: sessionId });

        // ✅ 2-1) 다른 기기들에게 "지금 당장 나가라" 브로드캐스트
       window.supabaseClient
         .channel(`user:${userId}`)
         .send({ type: "broadcast", event: "force-logout", payload: { except: sessionId } });
        // 3) 실시간 감시 시작 (한 번만 구독)
        await initRealtimeWatcher();

        // 4) UI 반영
        updateAuthUI(session);
      }

      if (event === "SIGNED_OUT") {
        if (!__MANUAL_LOGOUT__) {
          alert("다른 기기에서 로그인되어 로그아웃되었습니다.");
        }
        updateAuthUI(null);
      }
    } catch (e) {
      console.error("[auth pipeline error]", e);
    }
  });
}

/***** ✅ 실시간 세션 변경 감시 (다른 기기 로그인 시 자동 로그아웃) *****/
// ✅ active_sessions 테이블에 "현재 세션"이 바뀌면, 이 기기 즉시 로그아웃
//    - 가능한 한 refresh_token(=session.refresh_token)을 기준으로 비교합니다.
//    - 만약 DB에 access_token을 저장 중이라면 기존 컬럼(session_id)도 함께 비교합니다.
//    - active_sessions 테이블 컬럼 예시:
//        user_id uuid
//        session_rt text   -- (권장) 현재 세션의 refresh_token
//        session_id text   -- (호환) 기존에 쓰던 access_token


let __FORCE_LOGOUT_FIRED__ = false;

async function initRealtimeWatcher() {
  if (__REALTIME_SET__) return;

  const { data: u } = await window.supabaseClient.auth.getUser();
  const user = u?.user;
  if (!user) return;

  // 현재 세션 토큰(둘 다 확보: refresh 우선, access 보조)
  async function getCurrentTokens() {
    const { data: s } = await window.supabaseClient.auth.getSession();
    return {
      access: s?.session?.access_token || null,
      refresh: s?.session?.refresh_token || null,
    };
  }

  // 동일 사용자 행만 수신하도록 필터
  const channel = window.supabaseClient
    .channel(`realtime:active_sessions:${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "active_sessions",
        filter: `user_id=eq.${user.id}`,
      },
      async (payload) => {
        // 이미 처리된 강제 로그아웃이면 중복 방지
        if (__FORCE_LOGOUT_FIRED__) return;

        // 현재 기기의 세션 토큰(실시간 비교용)
        const current = await getCurrentTokens();

        // DB에서 최신으로 기록된 토큰(가급적 refresh 기준)
        const latestRefresh = payload?.new?.session_rt || null;
        const latestAccess  = payload?.new?.session_id || null;

        // 1) refresh_token 기준 비교 (권장 & 안정적)
        if (latestRefresh && current.refresh && latestRefresh !== current.refresh) {
          __FORCE_LOGOUT_FIRED__ = true;
          alert("다른 기기에서 로그인되어 자동 로그아웃됩니다.");
          await window.supabaseClient.auth.signOut();
          updateAuthUI(null);
          return;
        }

        // 2) (호환) access_token 기준 비교
        //    주의: access_token은 주기적으로 갱신되므로 오탐 가능. refresh 정비 전 임시용으로만 사용.
        if (!latestRefresh && latestAccess && current.access && latestAccess !== current.access) {
          __FORCE_LOGOUT_FIRED__ = true;
          alert("다른 기기에서 로그인되어 자동 로그아웃됩니다.");
          await window.supabaseClient.auth.signOut();
          updateAuthUI(null);
          return;
        }
      }
    )
    .subscribe((status) => {
      console.log("[realtime] active_sessions:", status);
    });

  __REALTIME_SET__ = true;
}

// ✅ 최초 로드 시: 이미 로그인된 상태여도 즉시 구독 + 세션 기록 (중요!)
(async function bootstrapRealtime() {
  bindAuthPipelines();

  const { data: s } = await window.supabaseClient.auth.getSession();
  const session = s?.session;
  if (session?.user?.id) {
    // 이미 로그인된 탭도 즉시 구독 시작
    await initRealtimeWatcher();

    // 내 현재 세션을 DB에 기록해 둔다 (다른 기기가 비교하도록)
    try {
      await postJSON("/api/update-session", {
        user_id: session.user.id,
        session_id: session.access_token,
      });
    } catch (e) {
      console.warn("[bootstrap] update-session skip:", e?.message);
    }

    updateAuthUI(session);
  }
})();


 

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

// 1) 설명 사전 로드(전역 주입)
try {
  const explainMod = await import('./explain.js');
  if (explainMod?.TERM_HELP) {
    window.TERM_HELP = explainMod.TERM_HELP;
    console.log('[TERM_HELP] loaded groups:', Object.keys(window.TERM_HELP));
  } else {
    console.warn('[TERM_HELP] missing export');
  }
} catch (e) {
  console.warn('[TERM_HELP] load skipped:', e);
}

// 2) 툴팁 설치 (initTermHelp 존재 체크 후 호출)
try {
  const tipMod = await import('./utils/tooltip.js');
  console.log('[tooltip] module keys:', Object.keys(tipMod || {}));
  const init = tipMod?.initTermHelp || tipMod?.default?.initTermHelp || window.initTermHelp;
  if (typeof init === 'function') {
    init();
    console.log('[tooltip] installed OK');
  } else {
    console.warn('[tooltip] initTermHelp not found');
  }
} catch (e) {
  console.warn('[tooltip] install failed:', e);
}


  } catch (err) {
    console.error("[init] fatal:", err);
  }
});


