import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1시간 대기
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  try {
    const now = new Date();
    now.setHours(now.getHours() + 9); // 한국시간 (KST)
    const today = now.toISOString();

    // ✅ 1️⃣ 카카오 정기구독자만 조회
    const { data: users, error } = await supabase
      .from("memberships")
      .select("id, user_id, plan, status, provider, current_period_end, cancel_at_period_end, metadata")
      .eq("status", "active")
      .eq("provider", "kakao") // ✅ 카카오만
      .not("current_period_end", "is", null);

    if (error) throw error;
    if (!users?.length)
      return res.status(200).json({ ok: true, message: "결제 대상 사용자가 없습니다." });

    // ✅ 2️⃣ 아임포트 토큰 발급
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
    if (!access_token) throw new Error("IAMPORT 토큰 발급 실패");

    let chargedCount = 0, failedCount = 0;

    // ✅ 3️⃣ 자동 결제 시도
    for (const u of users) {
      const end = new Date(u.current_period_end);
      const diffDays = Math.floor((now - end) / (1000 * 60 * 60 * 24));

      // 기간 만료된 경우만 결제
      if (diffDays >= 0) {
        console.log(`[AUTO BILL] ${u.user_id} (${u.plan}) 카카오 결제 시도`);

        const customer_uid = u.metadata?.customer_uid;
        if (!customer_uid) {
          console.warn(`⚠️ ${u.user_id}: customer_uid 없음`);
          continue;
        }

        const result = await attemptPayment(customer_uid, access_token);

        if (result.success) {
          chargedCount++;
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);

          await supabase.from("memberships").update({
            current_period_end: nextMonth.toISOString(),
            updated_at: now.toISOString()
          }).eq("id", u.id);

          await recordPayment(u.user_id, 9900, "success", 1, result.response.imp_uid);
          console.log(`[✅ 결제 성공] user_id=${u.user_id}`);
        } else {
          console.warn(`[❌ 결제 실패 1회차] ${u.user_id}`);
          await recordPayment(u.user_id, 9900, "failed", 1, null, result.message);

          // 1시간 뒤 재시도
          await delay(3600 * 1000);
          const retry = await attemptPayment(customer_uid, access_token);

          if (retry.success) {
            chargedCount++;
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            await supabase.from("memberships").update({
              current_period_end: nextMonth.toISOString(),
              updated_at: now.toISOString()
            }).eq("id", u.id);

            await recordPayment(u.user_id, 9900, "success", 2, retry.response.imp_uid);
            console.log(`[✅ 재시도 성공] user_id=${u.user_id}`);
          } else {
            failedCount++;
            console.error(`[❌ 결제 2회 실패 → 구독 해지] ${u.user_id}`);

            await recordPayment(u.user_id, 9900, "failed", 2, null, retry.message);
            await supabase.from("memberships").update({
              status: "inactive",
              cancel_at_period_end: true,
              current_period_end: now.toISOString(),
              updated_at: now.toISOString()
            }).eq("id", u.id);

            await sendCancelNotice(u.user_id, u.plan);
          }
        }
      }
    }

    return res.status(200).json({ ok: true, chargedCount, failedCount });
  } catch (err) {
    console.error("[charge-billing error]", err);
    res.status(500).json({ error: err.message });
  }
}

// ✅ 아임포트 자동 결제
async function attemptPayment(customer_uid, token) {
  try {
    const payRes = await fetch("https://api.iamport.kr/subscribe/payments/again", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify({
        customer_uid,
        merchant_uid: "auto_" + Date.now(),
        amount: 9900,
        name: "월간 프리미엄 구독 결제 (카카오페이)"
      }),
    });
    const payJson = await payRes.json();
    if (payJson.code === 0)
      return { success: true, response: payJson.response };
    else
      return { success: false, message: payJson.message };
  } catch (e) {
    console.error("attemptPayment error:", e);
    return { success: false, message: e.message };
  }
}

// ✅ 결제 로그 기록
async function recordPayment(user_id, amount, status, attempt, imp_uid = null, errorMsg = null) {
  try {
    await supabase.from("payments").insert({
      user_id,
      amount,
      status,
      attempt,
      imp_uid,
      error_message: errorMsg,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.error("[recordPayment error]", e);
  }
}

// ✅ 해지 알림
async function sendCancelNotice(user_id, plan) {
  console.log(`[🔔 해지 알림] user_id=${user_id}, plan=${plan}`);
  // TODO: 이메일 or 알림 시스템 연결
}
