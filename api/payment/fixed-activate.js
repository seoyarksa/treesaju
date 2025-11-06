// /api/payment/fixed-activate.js

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
// ... (환경변수/클라이언트 생성 동일)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!supabase) {
    return res.status(500).json({ error: 'SERVER_ENV_MISSING' });
  }

  try {
    const { imp_uid, merchant_uid, user_id, termMonths, price, productId } = req.body || {};
    if (!imp_uid || !merchant_uid || !user_id || !termMonths || !price) {
      return res.status(400).json({ error: 'MISSING_PARAMS' });
    }
    const months = Number(termMonths);
    const planName = months === 6 ? 'premium6' : 'premium3';
    const nowISO = new Date().toISOString();

    // 현재 멤버십 조회
    const { data: mem } = await supabase
      .from('memberships')
      .select('id, user_id, plan, status, current_period_end, metadata')
      .eq('user_id', user_id)
      .maybeSingle();

    let meta = {};
    try { meta = mem?.metadata ? JSON.parse(mem.metadata) : {}; } catch {}

    // 결제내역 객체
    const purchase = {
      imp_uid,
      merchant_uid,
      termMonths: months,
      price: Number(price),
      at: nowISO
    };

    // ① 정기 상태면: 예약 기반 선결제만 적재 (즉시 plan 변경 X)
    if (mem && (mem.plan === 'premium' || mem.plan === 'premium_plus')) {
      // 예약이 없다면, 현재 주기의 끝으로 예약 생성
      const effective_at = mem.current_period_end
        ? new Date(mem.current_period_end).toISOString()
        : nowISO;

      meta.scheduled_change = meta.scheduled_change?.type === 'to_fixed'
        ? meta.scheduled_change
        : { type: 'to_fixed', plan: planName, termMonths: months, effective_at, requested_at: nowISO };

      meta.prepaid_fixed = {
        ...purchase,
        provider: 'kakao',
        start_at: meta.scheduled_change.effective_at // 만료일에 시작
      };

      const { data: upd, error: upErr } = await supabase
        .from('memberships')
        .update({
          // 정기 plan/status/기간은 유지
          cancel_at_period_end: true,     // 정기는 주기 끝에 종료
          updated_at: nowISO,
          metadata: JSON.stringify({
            ...(meta || {}),
            last_purchase: purchase,
            purchases: [...(meta.purchases || []), purchase]
          })
        })
        .eq('id', mem.id)
        .select()
        .maybeSingle();

      if (upErr) return res.status(400).json({ error: 'DB_UPDATE_FAILED', detail: upErr.message });

      return res.status(200).json({
        ok: true,
        mode: 'prepaid_scheduled',
        message: `결제 완료. 만료일(${effective_at})에 ${planName}로 자동 전환됩니다.`,
        membership: upd
      });
    }

    // ② 그 외(미보유/선결제 상태 등): 즉시 활성화 (기존 로직 유지)
    // 기간 계산
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + months);

    const payload = {
      plan: planName,
      status: 'active',
      provider: 'kakao',
      current_period_end: end.toISOString(),
      cancel_at_period_end: true,
      cancel_effective_at: end.toISOString(),
      price_id: null,
      metadata: JSON.stringify({
        provider: 'kakao',
        kind: 'fixed',
        last_purchase: purchase,
        purchases: [ ...(meta.purchases || []), purchase ],
        ...(productId ? { productId } : {})
      }),
      created_at: nowISO,
      updated_at: nowISO
    };

    if (mem) {
      const { data: upd, error: upErr } = await supabase
        .from('memberships')
        .update(payload)
        .eq('id', mem.id)
        .select()
        .maybeSingle();
      if (upErr) return res.status(400).json({ error: 'DB_UPDATE_FAILED', detail: upErr.message });
      return res.status(200).json({ ok: true, mode: 'updated', membership: upd });
    } else {
      const { data: ins, error: insErr } = await supabase
        .from('memberships')
        .insert({ user_id, ...payload })
        .select()
        .single();
      if (insErr) return res.status(400).json({ error: 'DB_INSERT_FAILED', detail: insErr.message });
      return res.status(200).json({ ok: true, mode: 'inserted', membership: ins });
    }
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'INTERNAL_ERROR' });
  }
}
