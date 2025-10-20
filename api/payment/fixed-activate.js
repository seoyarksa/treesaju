// pages/api/payment/fixed-activate.js

// 로컬 개발에서만 .env 로드 (Vercel 프로덕션은 필요 없음)


import { createClient } from '@supabase/supabase-js';

// ──────────────────────────────────────────────────────────────
// 환경변수 이름 차이 대응
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase =
  SUPABASE_URL && SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;
// ──────────────────────────────────────────────────────────────

/**
 * 3/6개월 선결제 완료 → 구독 활성화/연장
 * body: { imp_uid, merchant_uid, user_id, termMonths(3|6), price, productId? }
 * 동작:
 *  - 남은 기간이 있으면 그 끝에서 +N개월, 없으면 오늘부터 +N개월
 *  - plan: 3개월 → 'premium3', 6개월 → 'premium6'
 *  - created_at: 기존 행 있으면 유지, 없으면 now로 세팅
 *  - current_period_end = cancel_effective_at (만료일=해지 효력일)
 *  - cancel_at_period_end = true (기간 끝나면 자동 해지)
 *  - metadata에 결제 로그 누적
 */
export default async function handler(req, res) {
  // (선택) 프리플라이트 허용
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!supabase) {
    return res.status(500).json({
      error: 'SERVER_ENV_MISSING',
      detail: 'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY).',
    });
  }

  try {
    const {
      imp_uid,
      merchant_uid,
      user_id,
      termMonths,  // 3 | 6
      price,       // 60000 | 100000
      productId,   // (옵션) 기록용
    } = req.body || {};

    if (!imp_uid || !merchant_uid || !user_id || !termMonths || !price) {
      return res.status(400).json({ error: 'MISSING_PARAMS' });
    }

    // 0) 기존 멤버십 조회
    const { data: existing, error: fetchErr } = await supabase
      .from('memberships')
      .select('id, user_id, plan, status, current_period_end, created_at, metadata')
      .eq('user_id', user_id)
      .maybeSingle();

    if (fetchErr) {
      return res.status(400).json({ error: 'DB_SELECT_FAILED', detail: fetchErr.message });
    }

    // 1) 등급 매핑
    const planName = Number(termMonths) === 6 ? 'premium6' : 'premium3';

    // 2) 시작/만료 계산
    const now = new Date();
    const nowISO = now.toISOString();

    let base = now; // 연장 기준 시점
    if (existing?.current_period_end) {
      const curEnd = new Date(existing.current_period_end);
      if (!isNaN(curEnd) && curEnd > now) {
        // 남은 기간이 있으면 거기서부터 연장
        base = curEnd;
      }
    }
    const newEnd = new Date(base);
    newEnd.setMonth(newEnd.getMonth() + Number(termMonths));
    const endISO = newEnd.toISOString();

    // 3) metadata 병합(기존 유지 + purchase 로그 추가)
    let metaObj = {};
    try {
      if (existing?.metadata && typeof existing.metadata === 'object') {
        metaObj = existing.metadata; // jsonb로 파싱되어 온 경우
      } else if (existing?.metadata && typeof existing.metadata === 'string') {
        metaObj = JSON.parse(existing.metadata); // 문자열로 저장되어 있던 경우
      }
    } catch {
      metaObj = {};
    }

    const purchaseLog = {
      imp_uid,
      merchant_uid,
      termMonths: Number(termMonths),
      price: Number(price),
      at: nowISO,
    };
    metaObj.provider = 'kakao';
    metaObj.kind = 'fixed';
    metaObj.last_purchase = purchaseLog;
    metaObj.purchases = Array.isArray(metaObj.purchases)
      ? [...metaObj.purchases, purchaseLog]
      : [purchaseLog];
    if (productId) metaObj.productId = productId;

    // 저장 타입 안전하게: 문자열로 저장 (컬럼이 text든 jsonb든 안전)
    const metadataStr = JSON.stringify(metaObj);

    // 4) 공통 payload (테이블에 실제 존재하는 컬럼만)
    const payload = {
      plan: planName,                  // premium3 | premium6
      status: 'active',
      current_period_end: endISO,      // 새 만료일
      cancel_at_period_end: true,      // 만료 시 자동 해지
      cancel_effective_at: endISO,     // 만료일 = 해지 효력일
      provider: 'kakao',
      price_id: null,
      metadata: metadataStr,
      updated_at: nowISO,
    };

    // 5) 업데이트 or 생성
    if (existing) {
      // created_at은 유지!
      const { data: upd, error: updErr } = await supabase
        .from('memberships')
        .update(payload)
        .eq('user_id', user_id)
        .select()
        .maybeSingle();

      if (updErr) {
        return res.status(400).json({ error: 'DB_UPDATE_FAILED', detail: updErr.message });
      }
      return res.status(200).json({
        ok: true,
        mode: 'extended',
        previous_end: existing.current_period_end,
        new_end: endISO,
        membership: upd,
      });
    } else {
      // 첫 구매: created_at 세팅
      const insertRow = {
        user_id,
        created_at: nowISO,
        ...payload,
      };
      const { data: ins, error: insErr } = await supabase
        .from('memberships')
        .insert(insertRow)
        .select()
        .single();

      if (insErr) {
        return res.status(400).json({ error: 'DB_INSERT_FAILED', detail: insErr.message });
      }
      return res.status(200).json({ ok: true, mode: 'inserted', membership: ins });
    }
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'INTERNAL_ERROR' });
  }
}
