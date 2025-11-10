// api/payment/manage-subscription.js
import { createClient } from "@supabase/supabase-js";

// ── Supabase (service role) ───────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 전역 클라이언트 (읽기 전용 경로에서 사용)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
function getServiceClient() {
  // 쓰기 경로에서도 동일 옵션으로 새 인스턴스 반환 (안전)
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
console.log("[ENV CHECK] SRK exists:", !!SUPABASE_SERVICE_ROLE_KEY);

// ── KST helpers ───────────────────────────────────────────────────────────────
function kstNow() { return new Date(Date.now() + 9 * 3600 * 1000); }
function todayKstDateStr() {
  const k = kstNow();
  const y = k.getUTCFullYear();
  const m = String(k.getUTCMonth() + 1).padStart(2, "0");
  const d = String(k.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function parseMeta(raw) {
  if (raw == null) return {};
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof v === "string") { try { return JSON.parse(v); } catch { return {}; } }
    return v || {};
  } catch { return {}; }
}
function toJSONSafe(obj) { return JSON.parse(JSON.stringify(obj || {})); }
function buildRenewMerchantUid(customer_uid, attempt) {
  const ymd = todayKstDateStr().replaceAll("-", "");
  return `renew_${customer_uid}_${ymd}_a${attempt}`;
}
function utcRangeOfKstDay(kstBaseDate, dayOffset) {
  const k = new Date(kstBaseDate.getTime());
  k.setUTCHours(0, 0, 0, 0); // 그 날 KST 00:00
  const startKST = new Date(k.getTime() + dayOffset * 86400000);
  const endKST   = new Date(startKST.getTime() + 86400000);
  return {
    startUTC: new Date(startKST.getTime() - 9 * 3600 * 1000),
    endUTC:   new Date(endKST.getTime()   - 9 * 3600 * 1000),
  };
}

// (옵션) 스케줄러 헤더 토큰
const SCHED_TOKEN = process.env.SCHEDULER_TOKEN || "";
const HANDLER_VERSION = "manage-subscription#KST-2025-11-10-FIXED";
const HANDLER_FILE = "api/payment/manage-subscription.js";

// ── Iamport helpers ───────────────────────────────────────────────────────────
async function verifyIamportPayment(token, imp_uid) {
  const r = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, { headers: { Authorization: token } });
  const j = await r.json();
  if (j.code !== 0) throw new Error(j.message || "PAYMENT_LOOKUP_FAILED");
  return j.response;
}
async function getPayment(access_token, imp_uid) {
  const r = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, { headers: { Authorization: access_token } });
  const j = await r.json();
  if (j.code !== 0) throw new Error(j.message || "PAYMENT_LOOKUP_FAILED");
  return j.response;
}

function extractUserIdFromCustomerUid(cu) {
  if (!cu) return null;
  // ex) kakao_5713065a-966a-4c5b-a3b2-1cf21b7fb574_basic
  const m = /^kakao_([0-9a-f-]{36})_/i.exec(String(cu));
  return m ? m[1] : null;
}


// ── Router ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const rawAction = (req.query?.action ?? "").toString();
  const action = rawAction.toLowerCase().replace(/-/g, "_").trim();

  res.setHeader("Cache-Control", "no-store, max-age=0, s-maxage=0");
  res.setHeader("X-Handler-Version", HANDLER_VERSION);
  res.setHeader("X-Handler-File", HANDLER_FILE);

  if ((req.method === "GET" || req.method === "POST") && action === "health") {
    return res.status(200).json({ ok: true, version: HANDLER_VERSION, file: HANDLER_FILE, now: new Date().toISOString() });
  }
    if (req.method === "POST" && req.headers["content-type"]?.includes("application/json")) {
    try { if (typeof req.body === "string") req.body = JSON.parse(req.body); } catch {}
  }

  // --- Action routes (정리: 각 액션 1회만 매칭) ---
  if (req.method === "POST" && action === "switch_from_fixed_to_recurring") return await switchFromFixedToRecurring(req, res);
  if (req.method === "POST" && action === "activate_fixed")                return await activateFixedAfterPayment(req, res);
  if (req.method === "POST" && action === "schedule_from_fixed")          return res.status(409).json({ error: "SCHEDULING_DISABLED" });
  if (req.method === "POST" && action === "schedule_to_fixed")            return res.status(409).json({ error: "SCHEDULING_TO_FIXED_DISABLED" });
  if (req.method === "POST" && action === "register")                     return await registerBilling(req, res);
  if (req.method === "POST" && action === "cancel")                       return await cancelSubscription(req, res);
  if (req.method === "POST" && action === "resume")                       return await resumeSubscription(req, res);
  if (req.method === "POST" && action === "change_plan")                  return await changePlan(req, res);
  if (req.method === "GET"  && action === "autoCancel")                   return await autoCancelExpired(req, res);
  if (req.method === "GET"  && action === "scheduler")                    return await schedulerAllInOne(req, res);
  if (req.method === "GET"  && action === "charge")                       return await chargeBilling(req, res);

  return res.status(405).json({ error: "Invalid request" });
}

// ── Scheduler (단일 진입점) ───────────────────────────────────────────────────
async function schedulerAllInOne(req, res) {
  try {
    if (SCHED_TOKEN) {
      const h = req.headers["x-scheduler-token"] || req.headers["x-sched-token"];
      if (h !== SCHED_TOKEN) return res.status(401).json({ ok: false, error: "UNAUTHORIZED_SCHED" });
    }
    const nowK = kstNow().toISOString();
    const autoCancel = await autoCancelExpiredCore();
    const d3 = await chargeBillingByDayOffsetCore({ dayOffset: 3, attempt: 1 });
    const d2 = await chargeBillingByDayOffsetCore({ dayOffset: 2, attempt: 2 });
    const d1 = await chargeBillingByDayOffsetCore({ dayOffset: 1, attempt: 3 });
    return res.status(200).json({ ok: true, run_at_kst: nowK, autoCancel, charges: { d3, d2, d1 } });
  } catch (e) {
    console.error("[scheduler] error", e);
    return res.status(500).json({ ok: false, error: e?.message || "INTERNAL" });
  }
}

// ── 1) 정기 결제 등록 ─────────────────────────────────────────────────────────
async function registerBilling(req, res) {
  const sb = getServiceClient();
 const { imp_uid, customer_uid, tier } = req.body || {};
 if (!imp_uid || !customer_uid) return res.status(400).json({ error: "Missing parameters" });
 const user_id = extractUserIdFromCustomerUid(customer_uid);
 if (!user_id) return res.status(400).json({ error: "INVALID_CUSTOMER_UID", detail: "Cannot extract user_id" });

  try {
    const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imp_key: process.env.IAMPORT_API_KEY, imp_secret: process.env.IAMPORT_API_SECRET })
    });
    const access_token = tokenRes.ok ? (await tokenRes.json())?.response?.access_token : null;
    if (!access_token) throw new Error("Failed to get access_token");

    const vRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, { headers: { Authorization: access_token } });
    const payment = (await vRes.json())?.response;
    if (!payment || payment.status !== "paid") throw new Error("Payment not completed");

 // custom_data에서 자동 보완
    if (!merchant_uid) merchant_uid = payment?.merchant_uid || null;
    const cd = (() => { try { return payment.custom_data ? JSON.parse(payment.custom_data) : null; } catch { return null; } })();
   if (!termMonths) termMonths = cd?.termMonths ?? cd?.months ?? null;
    if (!price)      price      = cd?.price ?? payment?.amount ?? null;
    if (!user_id)    user_id    = cd?.user_id ?? cd?.uid ?? extractUserIdFromCustomerUid(cd?.customer_uid || payment?.customer_uid) ?? null;
    if (!merchant_uid || !user_id || !termMonths || !price) {
     return res.status(400).json({ error: "MISSING_PARAMS", detail: { merchant_uid, user_id, termMonths, price } });
    }

    const plan = (tier === "plus" || tier === "premium_plus") ? "premium_plus" : "premium";
    const now = new Date();
    const nextEnd = new Date(now); nextEnd.setMonth(nextEnd.getMonth() + 1);

    const { data: existing } = await sb.from("memberships").select("id, metadata").eq("user_id", user_id).maybeSingle();
    const oldMeta = parseMeta(existing?.metadata);

    const purchase = {
      kind: "recurring_start",
      imp_uid, merchant_uid: payment?.merchant_uid || null, amount: payment?.amount ?? (plan === "premium_plus" ? 16500 : 11000),
      at: now.toISOString(), pay_method: payment?.pay_method || "billing_key",
      pg_provider: payment?.pg_provider || null, pg_tid: payment?.pg_tid || null, paid_at_unix: payment?.paid_at || null
    };

    const newMeta = {
      ...oldMeta, provider: "kakao", kind: "recurring", customer_uid,
      last_purchase: purchase, purchases: [ ...(oldMeta?.purchases || []), purchase ],
    };

    const payload = {
      plan, status: "active", provider: "kakao",
      current_period_end: nextEnd.toISOString(), cancel_at_period_end: false, cancel_effective_at: null,
      metadata: toJSONSafe(newMeta), updated_at: now.toISOString(),
    };

    let result;
    if (existing) {
      const { data, error } = await sb.from("memberships").update(payload).eq("id", existing.id).select().single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await sb.from("memberships").insert({ user_id, ...payload, created_at: now.toISOString() }).select().single();
      if (error) throw error;
      result = data;
    }

    await sb.from("profiles").update({
      grade: plan === "premium_plus" ? "premium_plus" : "premium",
      daily_limit: plan === "premium_plus" ? 150 : 60,
      premium_assigned_at: now.toISOString(),
      has_ever_premium: true,
      updated_at: now.toISOString(),
    }).eq("user_id", user_id);

    return res.status(200).json({ ok: true, message: "정기결제 등록 및 프리미엄 등급 전환 완료 ✅", membership: result });
  } catch (err) {
    console.error("[registerBilling]", err);
    return res.status(500).json({ error: err.message });
  }
}

// ── 2) 해지 예약 ──────────────────────────────────────────────────────────────
async function cancelSubscription(req, res) {
  const sb = getServiceClient();
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  try {
    const { data: membership, error: fetchErr } = await sb
      .from("memberships").select("current_period_end, status").eq("user_id", user_id).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!membership) throw new Error("Membership not found");

    const nowIso = new Date().toISOString();
 const { data, error } = await sb
   .from("memberships")
   .update({
     cancel_at_period_end: true,
    cancel_effective_at: membership.current_period_end ?? null,  // ← 동기화
     updated_at: nowIso
   })
      .eq("user_id", user_id)
      .in("status", ["active", "past_due"])
      .select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("No active membership to cancel");

    const cancelDate = membership.current_period_end ? new Date(membership.current_period_end) : new Date();
    return res.status(200).json({
      ok: true,
      message: `해지 신청 완료. 다음 결제 주기(${cancelDate.toISOString().slice(0,10)}) 이후 자동 해지됩니다.`,
      membership: data,
    });
  } catch (err) {
    console.error("[cancelSubscription]", err);
    return res.status(500).json({ error: err.message });
  }
}

// ── 재구독(=자동연장 재개) ───────────────────────────────────────────────────
async function resumeSubscription(req, res) {
  const sb = getServiceClient();
  try {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: "MISSING_USER_ID" });

    // 최신 멤버십 1건
    const { data: m, error: fe } = await sb
      .from("memberships")
      .select("id, user_id, plan, status, cancel_at_period_end, cancel_effective_at, current_period_end, updated_at")
      .eq("user_id", user_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fe)   return res.status(500).json({ error: "DB_SELECT_FAILED", detail: fe.message });
    if (!m)   return res.status(404).json({ error: "NO_MEMBERSHIP" });

    const now    = Date.now();
    const endISO = m.cancel_effective_at ?? m.current_period_end;
    const endMs  = endISO ? new Date(endISO).getTime() : 0;
    const activeWindow = m.status === "active" && endMs > now;

    // A) 아직 유효 + 취소예약 상태 → 자동연장 재개(토글)
    if (activeWindow && m.cancel_at_period_end === true) {
      const nowIso = new Date().toISOString();
      const { data: upd, error: ue } = await sb
        .from("memberships")
        .update({
          cancel_at_period_end: false,
          cancel_effective_at: null,         // 명시적으로 NULL
          updated_at: nowIso,
        })
        .eq("id", m.id)
        .select()
        .maybeSingle();
      if (ue) return res.status(500).json({ error: "DB_UPDATE_FAILED", detail: ue.message });

      // (보조) profiles에도 즉시 반영 (트리거가 있더라도 안전하게)
      try {
        await sb.from("profiles").update({
          cancel_effective_at: null,
          updated_at: nowIso,
        }).eq("user_id", user_id);
      } catch {}

      return res.status(200).json({
        ok: true,
        mode: "resumed",
        message: "자동연장을 다시 켰습니다.",
        membership: upd,
      });
    }

    // B) 이미 만료이거나(=새 구매 필요) or 취소예약 아님 → 새 구매로 유도
    return res.status(409).json({
      ok: false,
      mode: "expired_or_not_pending_cancel",
      error: "NEED_NEW_PURCHASE",
      message: "유효기간이 지났거나 취소예약 상태가 아닙니다. 새로 구매해 주세요.",
    });
  } catch (e) {
    console.error("[resumeSubscription]", e);
    return res.status(500).json({ error: "INTERNAL_ERROR", detail: e?.message || "" });
  }
}

// ── 3) 자동 해지 (유예 12h) ───────────────────────────────────────────────────
async function autoCancelExpired(req, res) {
  try {
    const result = await autoCancelExpiredCore();
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error("[autoCancelExpired] error:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
async function autoCancelExpiredCore() {
  const now = new Date();
  const nowIso = now.toISOString();
  const kst = kstNow();
  const { data: targets, error } = await supabase
    .from("memberships")
    .select("id, user_id, plan, status, cancel_at_period_end, cancel_effective_at, current_period_end, metadata")
    .eq("cancel_at_period_end", true)
    .in("status", ["active", "past_due"]);
  if (error) throw error;

  if (!targets?.length) return { message: "대상 없음", count: 0, canceled: 0 };
  let canceled = 0;
  for (const t of targets) {
    const end = new Date(t.cancel_effective_at ?? t.current_period_end ?? nowIso);
    const endPlus12hKST = new Date(end.getTime() + (12 + 9) * 3600 * 1000);
    if (kst < endPlus12hKST) continue;
    const { error: upErr } = await supabase
      .from("memberships")
      .update({ status: "inactive", cancel_at_period_end: false, updated_at: nowIso })
      .eq("id", t.id)
      .eq("cancel_at_period_end", true)
      .in("status", ["active", "past_due"]);
    if (upErr) throw upErr;
    canceled++;
  }
  return { message: `해지 ${canceled}건`, count: canceled, canceled };
}

// ── 4) D-N 대상 과금(코어) ────────────────────────────────────────────────────
async function chargeBillingByDayOffsetCore({ dayOffset, attempt }) {
  const PRICE = { premium: 11000, premium_plus: 16500 };
  const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imp_key: process.env.IAMPORT_API_KEY,
      imp_secret: process.env.IAMPORT_API_SECRET,
    }),
  });
  const tokenJson = await tokenRes.json();
  const access_token = tokenJson?.response?.access_token;
  if (!access_token) throw new Error("IAMPORT_TOKEN_FAIL");

  const { startUTC, endUTC } = utcRangeOfKstDay(kstNow(), dayOffset);
  const baseSelect =
    "id, user_id, plan, status, provider, cancel_at_period_end, cancel_effective_at, current_period_end, renew_attempt_date, renew_attempt_count_today, metadata";

  const q1 = await supabase
    .from("memberships").select(baseSelect)
    .in("status", ["active", "past_due"])
    .eq("cancel_at_period_end", false)
    .is("cancel_effective_at", null)
    .gte("current_period_end", startUTC.toISOString())
    .lt("current_period_end", endUTC.toISOString());
  if (q1.error) throw q1.error;

  const q2 = await supabase
    .from("memberships").select(baseSelect)
    .in("status", ["active", "past_due"])
    .eq("cancel_at_period_end", false)
    .not("cancel_effective_at", "is", null)
    .gte("cancel_effective_at", startUTC.toISOString())
    .lt("cancel_effective_at", endUTC.toISOString());
  if (q2.error) throw q2.error;

  const map = new Map();
  [...(q1.data || []), ...(q2.data || [])].forEach(r => map.set(r.id, r));
  let candidates = [...map.values()];

  const todayKst = todayKstDateStr();
  candidates = candidates.filter(m => {
    const meta = parseMeta(m.metadata);
    const kind = (meta?.kind || "").toLowerCase();
    const customer_uid = meta?.customer_uid;
    if (!customer_uid) return false;
    if (kind === "fixed") return false;
    const isToday = m.renew_attempt_date && String(m.renew_attempt_date).startsWith(todayKst);
    const cnt = isToday ? (m.renew_attempt_count_today || 0) : 0;
    return cnt < attempt;
  });

  if (!candidates.length) return { message: `D-${dayOffset} 대상 없음`, count: 0, charged: 0, failed: 0, dayOffset, attempt };

  let charged = 0, failed = 0;
  const nowIso = new Date().toISOString();

  for (const m of candidates) {
    const meta = parseMeta(m.metadata);
    const customer_uid = meta?.customer_uid;
    const price = PRICE[m.plan] || PRICE.premium;
    const merchant_uid = buildRenewMerchantUid(customer_uid, attempt);

    let paidVerify = null, payOk = false, payMsg = "";
    try {
      const r = await fetch("https://api.iamport.kr/subscribe/payments/again", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": access_token },
        body: JSON.stringify({ customer_uid, merchant_uid, amount: price, name: `월간 구독 자동결제 (${m.plan})` }),
      });
      const j = await r.json();
      if (j.code === 0) {
        const rv = await fetch(`https://api.iamport.kr/payments/${j.response.imp_uid}`, { headers: { "Authorization": access_token } });
        const vj = await rv.json();
        paidVerify = vj?.response;
        payOk = !!paidVerify && paidVerify.status === "paid";
        if (!payOk) payMsg = "PAYMENT_NOT_CONFIRMED";
      } else {
        payMsg = j.message || "AGAIN_FAILED";
      }
    } catch (e) {
      payMsg = e?.message || "AGAIN_ERROR";
    }

    if (payOk) {
      charged++;
      const base = new Date(m.cancel_effective_at ?? m.current_period_end ?? nowIso);
      const baseLater = base > new Date() ? base : new Date();
      const nextEnd = new Date(baseLater); nextEnd.setMonth(nextEnd.getMonth() + 1);

      const newMeta = {
        ...(meta || {}),
        provider: m.provider || "kakao",
        last_purchase: {
          kind: "recurring_renew",
          imp_uid: paidVerify?.imp_uid,
          merchant_uid,
          amount: paidVerify?.amount ?? price,
          at: nowIso,
          pay_method: paidVerify?.pay_method || "billing_key",
          pg_provider: paidVerify?.pg_provider || null,
          pg_tid: paidVerify?.pg_tid || null,
          paid_at_unix: paidVerify?.paid_at || null,
        },
        purchases: [
          ...(meta?.purchases || []),
          {
            kind: "recurring_renew",
            imp_uid: paidVerify?.imp_uid,
            merchant_uid,
            amount: paidVerify?.amount ?? price,
            at: nowIso,
            pay_method: paidVerify?.pay_method || "billing_key",
            pg_provider: paidVerify?.pg_provider || null,
            pg_tid: paidVerify?.pg_tid || null,
            paid_at_unix: paidVerify?.paid_at || null,
          }
        ],
      };

      await supabase.from("memberships").update({
        status: "active",
        cancel_at_period_end: false,
        cancel_effective_at: null,
        current_period_end: nextEnd.toISOString(),
        renew_attempt_date: todayKst,
        renew_attempt_count_today: 0,
        metadata: toJSONSafe(newMeta),
        updated_at: nowIso,
      }).eq("id", m.id);

      console.log(`[chargeBilling D-${dayOffset}] SUCCESS`, { id: m.id, user_id: m.user_id, merchant_uid, next_end: nextEnd.toISOString() });
    } else {
      failed++;
      const isToday = m.renew_attempt_date && String(m.renew_attempt_date).startsWith(todayKst);
      const curCount = isToday ? (m.renew_attempt_count_today || 0) : 0;
      await supabase.from("memberships").update({
        renew_attempt_date: todayKst,
        renew_attempt_count_today: Math.max(curCount, attempt),
        updated_at: nowIso,
      }).eq("id", m.id);

      console.log(`[chargeBilling D-${dayOffset}] FAIL (no status change)`, { id: m.id, user_id: m.user_id, merchant_uid, payMsg });
    }
  }

  return { dayOffset, attempt, count: candidates.length, charged, failed };
}

// ── 5) 자동 과금 (HTTP 엔드포인트) ────────────────────────────────────────────
async function registerBilling(req, res) {
  const supabase = getServiceClient();
  // 변경: user_id가 없어도 처리
  const { imp_uid, customer_uid, user_id: reqUserId, tier } = req.body || {};
  const user_id = reqUserId || extractUserIdFromCustomerUid(customer_uid);

  if (!imp_uid || !customer_uid || !user_id) {
    return res.status(400).json({ error: "Missing parameters", need: { imp_uid: !!imp_uid, customer_uid: !!customer_uid, user_id: !!user_id } });
  }

  try {
    const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imp_key: process.env.IAMPORT_API_KEY, imp_secret: process.env.IAMPORT_API_SECRET })
    });
    const access_token = tokenRes.ok ? (await tokenRes.json())?.response?.access_token : null;
    if (!access_token) throw new Error("Failed to get access_token");

    // 결제 조회
    const vRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, { headers: { Authorization: access_token } });
    const payment = (await vRes.json())?.response;
    if (!payment || payment.status !== "paid") throw new Error("Payment not completed");

    // 🔧 완화: merchant_uid에 uuid 강제가 있었다면 완화/우회
    // (선택) 강제 검사 제거 또는 'custom_data.user_id' 허용
    const customUser = (() => {
      try { return JSON.parse(payment.custom_data || "{}")?.user_id || null; } catch { return null; }
    })();
    const uidOk =
      (payment.merchant_uid && String(payment.merchant_uid).includes(user_id)) ||
      (customUser && customUser === user_id);
    // uidOk를 필수로 두지 말고, 경고만 로그
    if (!uidOk) {
      console.warn("[registerBilling] merchant_uid does not include user uuid (tolerated)", {
        merchant_uid: payment.merchant_uid, user_id, custom_user: customUser
      });
    }

    const plan = (tier === "premium_plus") ? "premium_plus" : "premium";
    const now = new Date();
    const nextEnd = new Date(now); nextEnd.setMonth(nextEnd.getMonth() + 1);

    const { data: existing } = await supabase.from("memberships")
      .select("id, metadata").eq("user_id", user_id).maybeSingle();
    const oldMeta = parseMeta(existing?.metadata);

    const purchase = {
      kind: "recurring_start",
      imp_uid,
      merchant_uid: payment?.merchant_uid || null,
      amount: payment?.amount ?? (plan === "premium_plus" ? 16500 : 11000),
      at: now.toISOString(),
      pay_method: payment?.pay_method || "billing_key",
      pg_provider: payment?.pg_provider || null,
      pg_tid: payment?.pg_tid || null,
      paid_at_unix: payment?.paid_at || null
    };

    const newMeta = {
      ...oldMeta,
      provider: "kakao",
      kind: "recurring",
      customer_uid,
      last_purchase: purchase,
      purchases: [ ...(oldMeta?.purchases || []), purchase ],
    };

    const payload = {
      plan, status: "active", provider: "kakao",
      current_period_end: nextEnd.toISOString(),
      cancel_at_period_end: false, cancel_effective_at: null,
      metadata: toJSONSafe(newMeta), updated_at: now.toISOString(),
    };

    let result;
    if (existing) {
      const { data, error } = await supabase.from("memberships").update(payload).eq("id", existing.id).select().single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase.from("memberships").insert({ user_id, ...payload, created_at: now.toISOString() }).select().single();
      if (error) throw error;
      result = data;
    }

    // 프로필 보조
    await supabase.from("profiles").update({
      grade: plan === "premium_plus" ? "premium_plus" : "premium",
      daily_limit: plan === "premium_plus" ? 150 : 60,
      premium_assigned_at: now.toISOString(),
      has_ever_premium: true,
      updated_at: now.toISOString(),
    }).eq("user_id", user_id);

    return res.status(200).json({ ok: true, message: "정기결제 등록 및 프리미엄 등급 전환 완료 ✅", membership: result });
  } catch (err) {
    console.error("[registerBilling]", err);
    return res.status(500).json({ error: err.message });
  }
}

/* =====================
 * 6) 플랜 변경(정기↔정기 즉시 결제)
 * ===================== */
async function changePlan(req, res) {
  const supabase = getServiceClient();
  const { user_id, new_plan } = req.body || {};
  if (!user_id || !new_plan) return res.status(400).json({ error: "MISSING_PARAMS" });

  const allowed = new Set(["premium", "premium_plus", "premium3", "premium6"]);
  if (!allowed.has(new_plan)) return res.status(400).json({ error: "INVALID_PLAN" });

  const isRecurring = p => p === "premium" || p === "premium_plus";
  const isFixed = p => p === "premium3" || p === "premium6";

  const safeParse = raw => { try {
    const a = typeof raw === "string" ? JSON.parse(raw) : raw;
    return (typeof a === "string") ? JSON.parse(a) : (a || null);
  } catch { return null; } };

  const getToken = async () => {
    const r = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imp_key: process.env.IAMPORT_API_KEY, imp_secret: process.env.IAMPORT_API_SECRET })
    });
    const j = await r.json(); const t = j?.response?.access_token; if (!t) throw new Error("IAMPORT_TOKEN_FAILED"); return t;
  };
  const payNow = async (customer_uid, token, amount, name) => {
    const r = await fetch("https://api.iamport.kr/subscribe/payments/again", {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": token },
      body: JSON.stringify({ customer_uid, merchant_uid: "plan_switch_" + Date.now(), amount, name })
    });
    const j = await r.json(); if (j.code !== 0) throw new Error(j.message || "PAYMENT_FAILED"); return j.response;
  };

  const { data: cur, error: fe } = await supabase
    .from("memberships")
    .select("id, user_id, plan, status, current_period_end, cancel_at_period_end, provider, metadata")
    .eq("user_id", user_id).maybeSingle();
  if (fe) return res.status(400).json({ error: "DB_SELECT_FAILED", detail: fe.message });
  if (!cur) return res.status(404).json({ error: "NOT_FOUND" });

  const nowIso = new Date().toISOString();

  if (isRecurring(cur.plan) && isRecurring(new_plan)) {
    try {
      const amountMap = { premium: 11000, premium_plus: 16500 };
      const amount = amountMap[new_plan];
      const meta = safeParse(cur.metadata) || {};
      const customer_uid = meta?.customer_uid;
      if (!customer_uid) return res.status(409).json({ ok: false, error: "NEED_BILLING_KEY", message: "빌링키 필요", next_plan: new_plan });

      const token = await getToken();
      const paid = await payNow(customer_uid, token, amount, new_plan === "premium_plus" ? "정기구독+ 플랜 변경 결제" : "정기구독(기본) 플랜 변경 결제");
      const v = await verifyIamportPayment(token, paid.imp_uid);
      if (v.status !== "paid") return res.status(402).json({ error: "PAYMENT_NOT_CONFIRMED" });

      const baseEnd = cur.current_period_end ? new Date(cur.current_period_end) : new Date();
      const base = baseEnd > new Date() ? baseEnd : new Date();
      const nextEnd = new Date(base); nextEnd.setMonth(nextEnd.getMonth() + 1);

      const newMeta = {
        ...(meta || {}),
        provider: cur.provider || "kakao",
        last_purchase: { kind: "recurring_switch", imp_uid: paid?.imp_uid, merchant_uid: paid?.merchant_uid, amount: paid?.amount, at: nowIso,
          to_plan: new_plan, pay_method: v?.pay_method || "billing_key", pg_provider: v?.pg_provider || null, pg_tid: v?.pg_tid || null, paid_at_unix: v?.paid_at || null },
        purchases: [ ...(meta?.purchases || []), { kind: "recurring_switch", imp_uid: paid?.imp_uid, merchant_uid: paid?.merchant_uid, amount: paid?.amount, at: nowIso,
          to_plan: new_plan, pay_method: v?.pay_method || "billing_key", pg_provider: v?.pg_provider || null, pg_tid: v?.pg_tid || null, paid_at_unix: v?.paid_at || null } ],
      };

      const { data: updated, error: upErr } = await supabase.from("memberships").update({
        plan: new_plan, status: "active", cancel_at_period_end: false, cancel_effective_at: null,
        current_period_end: nextEnd.toISOString(), metadata: toJSONSafe(newMeta), updated_at: nowIso,
      }).eq("id", cur.id).select().maybeSingle();
      if (upErr) return res.status(500).json({ error: "DB_UPDATE_FAILED", detail: upErr.message });

      // (보조) 프로필
      await supabase.from("profiles").update({
        grade: new_plan === "premium_plus" ? "premium_plus" : "premium",
        daily_limit: new_plan === "premium_plus" ? 150 : 60,
        updated_at: nowIso
      }).eq("user_id", user_id);

      return res.status(200).json({
        ok: true, mode: "recurring_changed_charged_now",
        message: `정기(${new_plan === "premium_plus" ? "플러스" : "기본"})로 전환되었습니다. 새 다음 결제일: ${nextEnd.toISOString().slice(0,10)}`,
        membership: updated,
      });
    } catch (e) {
      console.error("[changePlan recurring->recurring]", e);
      return res.status(500).json({ error: "PLAN_SWITCH_PAYMENT_FAILED", detail: e?.message || "" });
    }
  }

  if (isRecurring(cur.plan) && isFixed(new_plan)) {
    return res.status(200).json({ ok: true, mode: "switch_to_fixed", message: "선결제 상품 결제가 필요합니다.", membership: cur });
  }
  if (isFixed(cur.plan) && isRecurring(new_plan)) {
    return res.status(200).json({ ok: true, mode: "switch_to_recurring", message: "정기 구독 등록(결제)을 진행해 주세요.", membership: cur });
  }
  if (isFixed(cur.plan) && isFixed(new_plan)) {
    return res.status(200).json({ ok: true, mode: "fixed_to_fixed", message: "새 선결제 상품으로 재구매해 주세요.", membership: cur });
  }
  return res.status(400).json({ error: "UNSUPPORTED_CHANGE" });
}

/* =====================
 * 7) 선결제→정기 (즉시 전환)
 * ===================== */
async function switchFromFixedToRecurring(req, res) {
  const supabase = getServiceClient();
  try {
    const { user_id, next_tier } = req.body || {};
    if (!user_id || !next_tier) return res.status(400).json({ error: "MISSING_PARAMS" });

    const raw = String(next_tier).trim().toLowerCase();
    const tier = { plus: "plus", premium_plus: "plus", "premium+": "plus", basic: "basic", premium: "basic" }[raw];
    if (!tier) return res.status(400).json({ error: "INVALID_TIER" });
    const nextPlan = tier === "plus" ? "premium_plus" : "premium";

    const { data: mem, error: se } = await supabase
      .from("memberships").select("id, user_id, plan, status, provider, current_period_end, metadata").eq("user_id", user_id).maybeSingle();
    if (se) return res.status(500).json({ error: "DB_SELECT_FAILED", detail: se.message });
    if (!mem) return res.status(404).json({ error: "MEMBERSHIP_NOT_FOUND" });
    if (!["premium3", "premium6"].includes(mem.plan || "")) {
      return res.status(400).json({ error: "ONLY_FIXED_ALLOWED", detail: `current plan: ${mem.plan}` });
    }
    if (!mem.current_period_end) return res.status(400).json({ error: "NO_EXPIRE_DATE" });

    const meta = parseMeta(mem.metadata);
    const customer_uid = meta?.customer_uid;
    if (!customer_uid) return res.status(409).json({ error: "NEED_BILLING_KEY", next_plan: nextPlan });

    const tokRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imp_key: process.env.IAMPORT_API_KEY, imp_secret: process.env.IAMPORT_API_SECRET })
    });
    const access_token = (await tokRes.json())?.response?.access_token;
    if (!access_token) return res.status(500).json({ error: "IAMPORT_TOKEN_FAIL" });

    const amount = nextPlan === "premium_plus" ? 16500 : 11000;
    const merchant_uid = `switch-fixed2recurring-${Date.now()}`;
    const againRes = await fetch("https://api.iamport.kr/subscribe/payments/again", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": access_token },
      body: JSON.stringify({ customer_uid, merchant_uid, amount, name: `정기(${nextPlan}) 시작 결제` }),
    });
    const again = await againRes.json();
    if (again.code !== 0) return res.status(400).json({ error: "PAYMENT_FAILED", detail: again.message || "again failed" });

    const v = await getPayment(access_token, again.response.imp_uid);
    if (v.status !== "paid") return res.status(402).json({ error: "PAYMENT_NOT_CONFIRMED" });

    const prevEnd = new Date(mem.current_period_end);
    const base = prevEnd > new Date() ? prevEnd : new Date();
    const nextEnd = new Date(base); nextEnd.setMonth(nextEnd.getMonth() + 1);

    const nowIso = new Date().toISOString();
    const purchase = {
      kind: "recurring_start", imp_uid: again.response.imp_uid, merchant_uid,
      amount: again.response.amount, at: nowIso,
      pay_method: v?.pay_method || "billing_key", pg_provider: v?.pg_provider || null, pg_tid: v?.pg_tid || null, paid_at_unix: v?.paid_at || null,
    };

    const newMeta = { ...(meta || {}), provider: "kakao", last_purchase: purchase, purchases: [ ...(meta?.purchases || []), purchase ] };

    const { data: upd, error: upErr } = await supabase
      .from("memberships").update({
        plan: nextPlan, status: "active", provider: mem.provider || "kakao",
        cancel_at_period_end: false, cancel_effective_at: null,
        current_period_end: nextEnd.toISOString(),
        metadata: toJSONSafe(newMeta), updated_at: nowIso,
      }).eq("id", mem.id).select().maybeSingle();
    if (upErr) return res.status(500).json({ error: "DB_UPDATE_FAILED", detail: upErr.message });

    await supabase.from("profiles").update({
      grade: nextPlan, daily_limit: nextPlan === "premium_plus" ? 150 : 60, updated_at: nowIso,
    }).eq("user_id", user_id);

    return res.status(200).json({ ok: true, message: `정기(${nextPlan === "premium" ? "기본" : "플러스"})로 즉시 전환되었습니다. 다음 결제일: ${nextEnd.toISOString().slice(0,10)}`, membership: upd });
  } catch (e) {
    console.error("[switchFromFixedToRecurring]", e);
    return res.status(500).json({ error: "INTERNAL_ERROR", detail: e?.message || "" });
  }
}

/* =====================
 * 8) 선결제 활성(결제 완료 후)
 * ===================== */
async function activateFixedAfterPayment(req, res) {
 const supabase = getServiceClient();
 if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "METHOD_NOT_ALLOWED" }); }

  const { imp_uid, merchant_uid, termMonths, price, productId } = req.body || {};
  if (!imp_uid || !merchant_uid || !termMonths || !price) return res.status(400).json({ error: "MISSING_PARAMS" });


// 1) merchant_uid 규약에서 user_id 추출 시도
 const rx = /_(?<uuid>[0-9a-f-]{36})(?:_|$)/i;
 const m = rx.exec(String(merchant_uid));
const user_id = m?.groups?.uuid || null;
 if (!user_id) {
   return res.status(400).json({ error: "NEED_USER_ID", detail: "merchant_uid must include user uuid" });
 }

  try {
    const tokRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imp_key: process.env.IAMPORT_API_KEY, imp_secret: process.env.IAMPORT_API_SECRET })
    });
    const access_token = (await tokRes.json())?.response?.access_token;
    if (!access_token) throw new Error("IAMPORT_TOKEN_FAIL");

    const payRes = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, { headers: { Authorization: access_token } });
    const payment = (await payRes.json())?.response;
    if (!payment || payment.status !== "paid") return res.status(400).json({ error: "PAYMENT_NOT_PAID" });

 if (!merchant_uid) merchant_uid = payment.merchant_uid || null;
 const cd = (() => { try { return payment.custom_data ? JSON.parse(payment.custom_data) : null; } catch { return null; } })();
 if (!termMonths) termMonths = cd?.termMonths ?? cd?.months ?? null;
if (!price)      price      = cd?.price ?? payment.amount ?? null;
 if (!user_id)    user_id    = cd?.user_id ?? cd?.uid ?? null;
 if (!merchant_uid || !user_id || !termMonths || !price) {
   return res.status(400).json({ error: "MISSING_PARAMS", detail: { merchant_uid, user_id, termMonths, price } });
 }


    const months = Number(termMonths);
    const planName = months === 6 ? "premium6" : "premium3";
    const nowISO = new Date().toISOString();

    const { data: mem } = await supabase
      .from("memberships").select("id, user_id, plan, status, current_period_end, metadata")
      .eq("user_id", user_id).maybeSingle();

    let meta = parseMeta(mem?.metadata);
    const purchase = {
      imp_uid, merchant_uid, termMonths: months, price: Number(price), amount: Number(price),
      at: nowISO, pay_method: payment?.pay_method || "card", pg_provider: payment?.pg_provider || null, pg_tid: payment?.pg_tid || null, paid_at_unix: payment?.paid_at || null,
    };
    meta.last_purchase = purchase;
    meta.purchases = Array.isArray(meta.purchases) ? meta.purchases : [];
    meta.purchases.push(purchase);

    if (mem && (mem.plan === "premium" || mem.plan === "premium_plus")) {
      const prevEnd = mem.current_period_end ? new Date(mem.current_period_end) : new Date();
      const kstBase = new Date(prevEnd.getTime() + 9 * 3600 * 1000);
      kstBase.setUTCHours(0, 0, 0, 0);
      const startAtKST = new Date(kstBase.getTime() + 24 * 3600 * 1000);
      const expireAtKST = new Date(startAtKST); expireAtKST.setMonth(expireAtKST.getMonth() + months);

      meta.provider = "kakao"; meta.kind = "fixed";

      const { data: upd, error: upErr } = await supabase.from("memberships").update({
        plan: planName, status: "active", provider: "kakao",
        cancel_at_period_end: true, cancel_effective_at: expireAtKST.toISOString(),
        current_period_end: expireAtKST.toISOString(),
        metadata: toJSONSafe(meta), updated_at: nowISO,
      }).eq("id", mem.id).select().maybeSingle();
      if (upErr) return res.status(400).json({ error: "DB_UPDATE_FAILED", detail: upErr.message });

      try { await supabase.from("profiles").update({ grade: planName, daily_limit: 60, updated_at: nowISO }).eq("user_id", user_id); } catch {}
      return res.status(200).json({ ok: true, mode: "fixed_activated_immediately", message: `프리미엄${months}으로 전환 완료. 새 유효기간: ${expireAtKST.toISOString().slice(0,10)} 까지`, membership: upd });
    }

    // 미보유/이미 fixed: 즉시 시작
    const start = new Date();
    const end = new Date(start); end.setMonth(end.getMonth() + months);
    meta = { ...(meta || {}), provider: "kakao", kind: "fixed", last_purchase: purchase, purchases: [ ...(meta?.purchases || []), purchase ], ...(productId ? { productId } : {}) };

    const payload = {
      plan: planName, status: "active", provider: "kakao",
      current_period_end: end.toISOString(), cancel_at_period_end: true, cancel_effective_at: end.toISOString(),
      price_id: null, metadata: toJSONSafe(meta), updated_at: nowISO
    };

    if (mem) {
      const { data: upd, error: upErr } = await supabase.from("memberships").update(payload).eq("id", mem.id).select().maybeSingle();
      if (upErr) return res.status(400).json({ error: "DB_UPDATE_FAILED", detail: upErr.message });
      return res.status(200).json({ ok: true, mode: "updated", membership: upd });
    } else {
      const { data: ins, error: insErr } = await supabase.from("memberships").insert({ user_id, ...payload, created_at: nowISO }).select().single();
      if (insErr) return res.status(400).json({ error: "DB_INSERT_FAILED", detail: insErr.message });
      return res.status(200).json({ ok: true, mode: "inserted", membership: ins });
    }
  } catch (e) {
    console.error("[activateFixedAfterPayment]", e);
    return res.status(500).json({ error: e?.message || "INTERNAL_ERROR" });
  }
}
