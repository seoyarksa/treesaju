// api/payment/apply-scheduled-changes.js

// 로컬에선 .env 로드 (Vercel Prod에선 불필요)
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch {}
}

import { createClient } from '@supabase/supabase-js';

// 환경변수
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Supabase (service key로 서버 작업)
const supabase =
  SUPABASE_URL && SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    }
    if (!supabase) {
      return res.status(500).json({ ok: false, error: 'SERVER_ENV_MISSING' });
    }

    // (선택) 간단 보안: Cron 호출에 헤더/쿼리로 비밀키 요구
    const cronSecret = process.env.CRON_SECRET || '';
    const got =
      req.headers['x-cron-secret'] ||
      req.query?.secret ||
      req.body?.secret;
    if (cronSecret && got !== cronSecret) {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }

    // 집행 대상 조회: 예약 있고, 시행시각이 지났고, 활성 상태인 것
    const { data: targets, error } = await supabase
      .from('memberships')
      .select('id, user_id, plan, provider, status, current_period_end, scheduled_change_type, scheduled_next_plan, scheduled_effective_at')
      .eq('status', 'active')
      .not('scheduled_change_type', 'is', null)
      .not('scheduled_effective_at', 'is', null)
      .lte('scheduled_effective_at', new Date().toISOString());

    if (error) throw error;

    let processed = 0, failures = [];

    for (const m of (targets || [])) {
      try {
        if (m.scheduled_change_type === 'to_recurring') {
          // 다음 주기(예: +1개월). 실제 청구/정기등록 로직은 별도 연결 필요.
          const nextEnd = new Date();
          nextEnd.setMonth(nextEnd.getMonth() + 1);

          const { error: upErr } = await supabase
            .from('memberships')
            .update({
              plan: m.scheduled_next_plan,   // 'premium' | 'premium_plus'
              provider: m.provider || 'kakao',
              cancel_at_period_end: false,
              current_period_end: nextEnd.toISOString(),
              // 예약 정보 초기화
              scheduled_change_type: null,
              scheduled_next_plan: null,
              scheduled_effective_at: null,
              scheduled_requested_at: null,
              scheduled_note: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', m.id);

          if (upErr) throw upErr;

          processed++;
        }
        // TODO: 필요하면 'to_fixed' 같은 다른 타입도 여기서 분기 처리
      } catch (e) {
        failures.push({ id: m.id, error: e.message });
      }
    }

    return res.status(200).json({ ok: true, processed, failures });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
