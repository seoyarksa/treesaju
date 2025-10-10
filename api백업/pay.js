// /api/pay.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const action = (req.query.action || "start").toLowerCase();
    if (action !== "start") {
      return res.status(400).json({ error: "Unknown action" });
    }

    const { user_id } = req.body || {};
    if (!user_id) {
      return res.status(400).json({ error: "user_id required" });
    }



    
    // ✅ 모의 결제 모드: 환경변수로 제어
    if (process.env.MOCK_PAY === "1") {
      return res.status(200).json({
        redirectUrl: "/mock-pay.html", // 간단한 안내 페이지 하나 만들어 두세요
        tid: "MOCK_TID_" + Date.now(),
        orderId: "MOCK_ORDER_" + user_id
      });
    }

    // === 필수 환경변수 체크 ===
    const ADMIN_KEY = process.env.KAKAO_ADMIN_KEY;  // 카카오 Admin Key
    const CID       = process.env.KAKAO_CID || "TCSUBSCRIP"; // 테스트용 구독 CID
    const BASE      = process.env.APP_BASE_URL;     // 예: https://treesaju.vercel.app
    const PRICE     = Number(process.env.PRICE_MONTHLY || 3900);

    if (!ADMIN_KEY || !BASE) {
      return res.status(500).json({
        error: "MISSING_ENV",
        detail: { KAKAO_ADMIN_KEY: !!ADMIN_KEY, APP_BASE_URL: !!BASE, KAKAO_CID: !!CID }
      });
    }

    // 고유 주문번호
    const orderId = `sub-${user_id}-${Date.now()}`;

    // Kakao Pay ready 파라미터 (URL-encoded)
    const params = new URLSearchParams({
      cid: CID,
      partner_order_id: orderId,
      partner_user_id: user_id,
      item_name: "프리미엄 구독 1개월",
      quantity: "1",
      total_amount: String(PRICE),
      tax_free_amount: "0",
      // 승인/취소/실패 URL은 카카오 콘솔에 화이트리스트로 등록되어 있어야 합니다
      approval_url: `${BASE}/pay/approve?order_id=${encodeURIComponent(orderId)}`,
      cancel_url:   `${BASE}/pay/cancel`,
      fail_url:     `${BASE}/pay/fail`,
    });

    const kakaoRes = await fetch("https://kapi.kakao.com/v1/payment/ready", {
      method: "POST",
      headers: {
        Authorization: `KakaoAK ${ADMIN_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: params.toString(),
    });

    const text = await kakaoRes.text();
    let json;
    try { json = JSON.parse(text); } catch {} // 카카오가 에러를 HTML로 줄 때 대비

    if (!kakaoRes.ok) {
      console.error("[kakao ready] HTTP", kakaoRes.status, text);
      return res.status(502).json({
        error: "KAKAO_READY_FAILED",
        status: kakaoRes.status,
        text, // 콘솔에서 디버깅 가능
      });
    }

    // 정상: redirect URL과 tid 반환
    const redirect =
      json.next_redirect_pc_url ||
      json.next_redirect_app_url ||
      json.next_redirect_mobile_url;

    // TODO: json.tid 를 orderId/user_id와 매핑해 DB에 저장(승인 단계에서 필요)
    return res.status(200).json({
      redirectUrl: redirect,
      tid: json.tid,
      orderId,
    });
  } catch (e) {
    console.error("[pay] fatal:", e);
    return res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
}
