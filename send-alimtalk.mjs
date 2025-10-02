// send-alimtalk.mjs
import crypto from 'node:crypto';

const AK  = process.env.NCP_ACCESS_KEY?.trim();
const SK  = process.env.NCP_SECRET_KEY?.trim();
const SID = process.env.NCP_SENS_SERVICE_ID?.trim();
const PF  = (process.env.NCP_PLUS_FRIEND_ID || '@트리만세력').trim(); // 검색용 ID
const TPL = (process.env.NCP_TEMPLATE_CODE  || 'VERIFYCODE').trim();
const TO  = (process.env.TO_PHONE || '01047492139').replace(/\D/g, ''); // 숫자만
const CODE = (process.env.OTP_CODE || '123456').trim();

// 승인된 템플릿 본문에 맞게 치환 결과를 content에 넣어야 하는 템플릿이 많습니다.
// (예: 템플릿이 "인증번호 #{code}"라면 content는 "인증번호 123456")
const CONTENT = `인증번호 ${CODE}`;

function sign({ method, path, ts, ak, sk }) {
  return crypto.createHmac('sha256', sk).update(`${method} ${path}\n${ts}\n${ak}`).digest('base64');
}

async function main() {
  if (!AK || !SK || !SID) throw new Error('NCP 키/서비스ID 환경변수 확인');
  if (!TO) throw new Error('TO_PHONE(숫자만) 필요');

  // 디버그 로그 (눈으로 값 확인)
  console.log('SERVICE_ID =', SID);
  console.log('PLUS_FRIEND_ID =', PF);
  console.log('TEMPLATE_CODE =', TPL);
  console.log('TO =', TO);

  const host = 'https://sens.apigw.ntruss.com';
  const path = `/alimtalk/v2/services/${SID}/messages`;
  const ts = Date.now().toString();
  const signature = sign({ method: 'POST', path, ts, ak: AK, sk: SK });

  const body = {
    plusFriendId: PF,      // 예: "@트리만세력"
    templateCode: TPL,     // 예: "VERIFYCODE"
    messages: [{
      to: TO,              // "010xxxxxxxx" (숫자만)
      content: CONTENT,    // 템플릿이 content 필수면 반드시 채워야 함
      variables: { code: CODE }, // 템플릿에 #{code} 있으면 사용
    }],
  };

  const res = await fetch(`${host}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-apigw-timestamp': ts,
      'x-ncp-iam-access-key': AK,
      'x-ncp-apigw-signature-v2': signature,
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  console.log('STATUS:', res.status);
  console.log('RAW:', raw);
  if (!res.ok) throw new Error(raw);
}

main().catch(e => { console.error('FAILED:', e); process.exit(1); });
