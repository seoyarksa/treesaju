// pages/api/payment/fixed-activate.js

// 로컬 개발에서만 .env 로드 (Vercel 프로덕션은 필요 없음)
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch {}
}

import { createClient } from '@supabase/supabase-js';

// 환경변수 이름 차이 대응
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase =
  SUPABASE_URL && SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

/**
 * 3/6개월 선결제 완료 → 구독 활성화
 * body: { imp_uid, merchant_uid, user_id, termMonths(3|6), price, productId? }
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
      termMonths,  // 3 | 6
      price,       // 60000 | 100000
      productId,   // (옵션) 기록용
    } = req.body || {};

    if (!imp_uid || !merchant_uid || !user_id || !termMonths || !price) {
      return res.status(400).json({ error: 'MISSING_PARAMS' });
    }

    // 등급 매핑: 3개월= premium3 / 6개월= premium6
    const planName = Number(termMonths) === 6 ? 'premium6' : 'premium3';

    // 기간 계산
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + Number(termMonths));

    const nowISO = now.toISOString();
    const endISO = end.toISOString();

    // 결제 메타데이터 (문자열로 저장)
    const metadata = JSON.stringify({
      imp_uid,
      merchant_uid,
      termMonths: Number(termMonths),
      price: Number(price),
      provider: 'kakao',
      kind: 'fixed',
      ...(productId ? { productId } : {}),
    });

    // 공통 payload (테이블에 실제 존재하는 컬럼만 사용)
    const payload = {
      plan: planName,                // premium3 | premium6
      status: 'active',
      current_period_end: endISO,    // 만료일
      cancel_at_period_end: true,    // 자동 해지 예정
      cancel_effective_at: endISO,   // 만료일=해지 효력일
      provider: 'kakao',
      price_id: null,
      metadata,
      created_at: nowISO,            // 시작일
      updated_at: nowISO,
    };

    // 1) 업데이트 시도 (user_id로 식별)
    let { data: upd, error: updErr } = await supabase
      .from('memberships')
      .update(payload)
      .eq('user_id', user_id)
      .select()
      .maybeSingle();

    if (updErr) {
      return res.status(400).json({ error: 'DB_UPDATE_FAILED', detail: updErr.message });
    }
    if (upd) {
      return res.status(200).json({ ok: true, membership: upd, mode: 'updated' });
    }

    // 2) 없으면 새로 생성
    const insertRow = { user_id, ...payload };
    let { data: ins, error: insErr } = await supabase
      .from('memberships')
      .insert(insertRow)
      .select()
      .single();

    if (insErr) {
      return res.status(400).json({ error: 'DB_INSERT_FAILED', detail: insErr.message });
    }

    return res.status(200).json({ ok: true, membership: ins, mode: 'inserted' });

  } catch (e) {
    return res.status(500).json({ error: e?.message || 'INTERNAL_ERROR' });
  }
}
