// pages/api/payment/fixed-activate.js

// 로컬 개발에서만 .env 로드 (Vercel 프로덕션은 필요 없음)
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

import { createClient } from '@supabase/supabase-js';

// ── 환경변수 읽기 (이름 차이 대비)
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// 서버용 Supabase 클라이언트
const supabase =
  SUPABASE_URL && SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

/**
 * 3/6개월 선결제 완료 → 구독 기간 활성화
 * 요청 바디: { imp_uid, merchant_uid, user_id, productId, termMonths, dailyLimit, price }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
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
      productId,
      termMonths,   // 3 | 6
      dailyLimit,   // 60
      price,        // 60000 | 100000
    } = req.body || {};

    if (!imp_uid || !merchant_uid || !user_id || !termMonths || !price) {
      return res.status(400).json({ error: 'MISSING_PARAMS' });
    }

    // TODO(운영 권장): imp_uid로 아임포트 결제 검증
    // const ok = await verifyIamport(imp_uid, price);
    // if (!ok) return res.status(400).json({ error: 'INVALID_PAYMENT' });

    // 기간 계산: now → now + termMonths
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + Number(termMonths));

    // memberships upsert (user_id 고유 기준 가정)
    const { data, error } = await supabase
      .from('memberships')
      .upsert({
        user_id,
        plan: productId || (Number(termMonths) === 6 ? 'fixed_6m_60' : 'fixed_3m_60'),
        status: 'active',
        price,
        daily_limit: dailyLimit ?? 60,
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'DB_UPSERT_FAILED', detail: error.message });
    }

    // (선택) 결제 로그 남기기
    // await supabase.from('payment_logs').insert({
    //   type: 'fixed', user_id, imp_uid, merchant_uid, amount: price, productId, term_months: termMonths
    // });

    return res.status(200).json({ ok: true, membership: data });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'INTERNAL_ERROR' });
  }
}
