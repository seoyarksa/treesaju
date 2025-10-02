import crypto from 'node:crypto';

// ── ENV 읽기
const AK   = process.env.NCP_ACCESS_KEY?.trim();
const SK   = process.env.NCP_SECRET_KEY?.trim();
const SID  = process.env.NCP_SENS_SERVICE_ID?.trim();
const PF   = (process.env.NCP_PLUS_FRIEND_ID || '@트리만세력').trim(); // 예: "@트리만세력"
const TPL  = (process.env.NCP_TEMPLATE_CODE  || 'VERIFYCODE').trim();
const TO   = (process.env.TO_PHONE || '01047492139').replace(/\D/g, ''); // 숫자만
const CODE = (process.env.OTP_CODE || '123456').trim();

// 템플릿과 100% 일치한 content (공백/마침표 포함 주의)
const content = `인증 번호는 ${CODE} 입니다.`;

// SENS 서명
function sign(path, ts) {
  const msg = `POST ${path}\n${ts}\n${AK}`;
  return crypto.createHmac('sha256', SK).update(msg).digest('base64');
}

async function main() {
  if (!AK || !SK || !SID || !PF || !TPL || !TO) {
    throw new Error('Missing required envs');
  }

  const host = 'https://sens.apigw.ntruss.com';
  const path = `/alimtalk/v2/services/${SID}/messages`;
  const ts   = Date.now().toString();

  const body = {
    plusFriendId: PF,
    templateCode: TPL,
    messages: [
      { to: TO, content } // variables/parameters 사용 안 함
    ],
  };

  const res = await fetch(`${host}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-apigw-timestamp': ts,
      'x-ncp-iam-access-key': AK,
      'x-ncp-apigw-signature-v2': sign(path, ts),
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  console.log('STATUS:', res.status);
  console.log('RAW:', raw);
  if (!res.ok) throw new Error(raw || `HTTP ${res.status}`);
}

main().catch(e => { console.error(e); process.exit(1); });
