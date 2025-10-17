// pages/api/payment/fixed-activate.js
import { createClient } from '@supabase/supabase-js';

/**
 * 3/6개월 선결제 결제 완료 → 이용기간 활성화
 * 요청 바디: { imp_uid, merchant_uid, user_id, productId, termMonths, dailyLimit, price }
 * 응답: JSON (항상 JSON으로만 응답하여 프런트 파싱 에러 방지)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
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

    // 1) Supabase admin client (서버 환경변수 사용)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY // ★ 서비스키(서버전용)
    );

    // 2) (선택 권장) 아임포트 결제검증: imp_uid로 금액/상태 검증
    //    - 실제 운영에선 반드시 검증하세요. (여긴 안전을 위해 스텁/옵션 처리)
    // const ok = await verifyIamport(imp_uid, price);
    // if (!ok) return res.status(400).json({ error: 'INVALID_PAYMENT' });

    // 3) memberships 갱신: now → now + termMonths
    //    - 이미 구독 중이면 end_at을 연장할지 덮어쓸지 정책에 맞게 결정
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + Number(termMonths));

    // 예: upsert 로직 (user_id를 PK/unique로 쓰는 구조 가정)
    const { data: up, error: upErr } = await supabase
      .from('memberships')
      .upsert({
        user_id,
        plan: productId || (termMonths === 6 ? 'fixed_6m_60' : 'fixed_3m_60'),
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

    if (upErr) {
      return res.status(400).json({ error: 'DB_UPSERT_FAILED', detail: upErr.message });
    }

    // 4) (선택) 결제 로그 테이블에 기록
    // await supabase.from('payment_logs').insert({
    //   user_id, imp_uid, merchant_uid, amount: price, productId,
    //   type: 'fixed', term_months: termMonths, ok: true
    // });

    return res.status(200).json({ ok: true, membership: up });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'INTERNAL_ERROR' });
  }
}

/* (옵션) 실제 운영 검증용 스텁
async function verifyIamport(imp_uid, expectedAmount) {
  // 1) 아임포트 액세스 토큰 발급
  // 2) /payments/{imp_uid} 조회 후 amount/status 검증
  // return true/false
  return true;
}
*/
