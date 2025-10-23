// utils/recordReceipt.js
export async function recordReceipt(supabase, payload) {
  if (!payload || !payload.user_id || !payload.plan || !payload.imp_uid || !payload.merchant_uid) {
    console.error("[recordReceipt] missing fields", payload);
    throw new Error("recordReceipt: missing required fields");
  }
  const ready = {
    user_id: payload.user_id,
    kind: payload.kind,
    plan: payload.plan,
    months: payload.months ?? null,
    amount: payload.amount,
    currency: payload.currency ?? "KRW",
    imp_uid: payload.imp_uid,
    merchant_uid: payload.merchant_uid,
    customer_uid: payload.customer_uid ?? null,
    pay_method: payload.pay_method ?? null,
    pg_provider: payload.pg_provider ?? null,
    pg_tid: payload.pg_tid ?? null,
    paid_at: new Date(payload.paid_at || Date.now()).toISOString(),
    period_start: payload.period_start ? new Date(payload.period_start).toISOString() : null,
    period_end: payload.period_end ? new Date(payload.period_end).toISOString() : null,
    raw: payload.raw ?? null,
  };

  console.log("[recordReceipt] UPSERT ->", {
    user_id: ready.user_id, plan: ready.plan, imp_uid: ready.imp_uid, merchant_uid: ready.merchant_uid,
  });

  const { data, error } = await supabase
    .from("payment_receipts")
    .upsert(ready, { onConflict: "imp_uid", ignoreDuplicates: true })
    .select("imp_uid, merchant_uid, paid_at")
    .maybeSingle();

  if (error) {
    console.error("[recordReceipt] ERROR:", error);
    throw error; // 원인 파악 중이므로 일단 throw
  }
  console.log("[recordReceipt] OK:", data);
  return data;
}
