import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "전화번호 필요" });

  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Naver Cloud SENS BizMessage API 설정
  const serviceId = process.env.NCP_BIZMSG_SERVICE_ID;
  const accessKey = process.env.NCP_ACCESS_KEY;
  const secretKey = process.env.NCP_SECRET_KEY;
  const plusFriendId = process.env.KAKAO_PLUS_FRIEND_ID;
  const templateCode = process.env.KAKAO_TEMPLATE_CODE;

  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(timestamp + accessKey)
    .digest("hex");

  const payload = {
    templateCode,
    plusFriendId,
    messages: [
      {
        to: phone,
        content: `[서비스명] 인증번호는 ${code} 입니다.`,
        kakaoOptions: {
          disableSms: false, // 카톡 실패 시 SMS fallback
        },
      },
    ],
  };

  await authFetch(`https://sens.apigw.ntruss.com/alimtalk/v2/services/${serviceId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-iam-access-key": accessKey,
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-apigw-signature": signature,
    },
    body: JSON.stringify(payload),
  });

  await supabase.from("otp_codes").insert({
    phone,
    code,
    expires_at: new Date(Date.now() + 3 * 60 * 1000), // 3분 후 만료
  });

  res.json({ ok: true });
}
