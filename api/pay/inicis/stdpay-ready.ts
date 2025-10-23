// /api/pay/inicis/stdpay-ready.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    const { plan_code, amount } = req.body || {};
    if (!plan_code || !amount) {
      return res.status(400).json({ error: "MISSING_PARAMS" });
    }

    // ✅ 환경변수 체크
    const MID       = process.env.INICIS_MID;         // 예: MOI9890153
    const SIGN_KEY  = process.env.INICIS_SIGNKEY;     // 표준결제 사인키 (iniweb에서 확인)
    const SITE_ORI  = process.env.SITE_ORIGIN;        // 예: https://treesaju.vercel.app

    if (!MID || !SIGN_KEY || !SITE_ORI) {
      return res.status(500).json({ error: "ENV_NOT_SET", details: { MID: !!MID, SIGN_KEY: !!SIGN_KEY, SITE_ORIGIN: !!SITE_ORI } });
    }

    // ✅ 주문 생성 & 저장(여기서는 생략)
    const oid = `ORD_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const price = String(amount);
    const timestamp = Date.now().toString();

    // ✅ 표준결제용 시그니처
    // sign = sha256("oid=...&price=...&timestamp=...")
    const signSrc = `oid=${oid}&price=${price}&timestamp=${timestamp}`;
    const signature = sha256(signSrc);

    // ✅ mKey = sha256(signKey)
    const mKey = sha256(SIGN_KEY);

    // ✅ 콜백 URL (승인 결과를 받는 곳)
    const returnUrl = `${SITE_ORI}/api/pay/inicis/stdpay-approve`;

    // ⚠️ 테스트/운영 엔드포인트: 둘 다 동일 URL 사용(이니시스 내부에서 MID로 구분)
    const actionUrl = "https://stdpay.inicis.com/stdpay/step1.jsp";

    // ✅ auto submit form 생성 (euc-kr 지정이 권장)
    const formHtml = `
      <form id="inicisStdForm" method="POST" action="${actionUrl}" accept-charset="euc-kr">
        <input type="hidden" name="mid" value="${MID}">
        <input type="hidden" name="oid" value="${oid}">
        <input type="hidden" name="price" value="${price}">
        <input type="hidden" name="timestamp" value="${timestamp}">
        <input type="hidden" name="signature" value="${signature}">
        <input type="hidden" name="mKey" value="${mKey}">
        <input type="hidden" name="goodname" value="${plan_code}">
        <input type="hidden" name="returnUrl" value="${returnUrl}">
        <!-- 필요 시 추가 파라미터 예시:
             buyername, buyeremail, currency, closeUrl, gopaymethod 등 -->
      </form>
      <script>document.getElementById('inicisStdForm').submit();</script>
    `.trim();

    return res.status(200).json({ formHtml, oid });
  } catch (e: any) {
    console.error("[stdpay-ready error]", e);
    return res.status(500).json({ error: "SERVER_ERROR", message: e?.message });
  }
}
