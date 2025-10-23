// utils/recordReceipt.ts
import { SupabaseClient } from '@supabase/supabase-js';

export type ReceiptInput = {
  user_id: string;
  kind: 'recurring'|'fixed';
  plan: 'premium'|'premium_plus'|'premium3'|'premium6';
  months?: 3|6;
  amount: number;
  currency?: 'KRW';
  imp_uid: string;
  merchant_uid: string;
  customer_uid?: string;
  pay_method?: string;
  pg_provider?: string;
  pg_tid?: string;
  paid_at: string | Date;
  period_start?: string | Date | null;
  period_end?: string | Date | null;
  raw?: any;
};

export async function recordReceipt(supabase: SupabaseClient, r: ReceiptInput) {
  const payload = {
    user_id: r.user_id,
    kind: r.kind,
    plan: r.plan,
    months: r.months ?? null,
    amount: r.amount,
    currency: r.currency ?? 'KRW',
    imp_uid: r.imp_uid,
    merchant_uid: r.merchant_uid,
    customer_uid: r.customer_uid ?? null,
    pay_method: r.pay_method ?? null,
    pg_provider: r.pg_provider ?? null,
    pg_tid: r.pg_tid ?? null,
    paid_at: new Date(r.paid_at).toISOString(),
    period_start: r.period_start ? new Date(r.period_start).toISOString() : null,
    period_end: r.period_end ? new Date(r.period_end).toISOString() : null,
    raw: r.raw ?? null,
  };

  const { error } = await supabase
    .from('payment_receipts')
    .upsert(payload, { onConflict: 'imp_uid', ignoreDuplicates: true });

  if (error) throw error; // 필요시 로깅 후 무음 처리 가능
}

