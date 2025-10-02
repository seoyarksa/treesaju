// check-alimtalk.mjs
import crypto from 'node:crypto';

const ACCESS     = process.env.NCP_ACCESS_KEY;
const SECRET     = process.env.NCP_SECRET_KEY;
const SERVICE_ID = process.env.NCP_SENS_SERVICE_ID;   // ncp:kkobizmsg:kr:...:...
const REQUEST_ID = process.env.SENS_REQUEST_ID;       // 202 응답의 requestId

// 필수 env 가드
function assertEnv(name, val) {
  if (!val || !String(val).trim()) {
    throw new Error(`Missing env: ${name}`);
  }
}
assertEnv('NCP_ACCESS_KEY', ACCESS);
assertEnv('NCP_SECRET_KEY', SECRET);
assertEnv('NCP_SENS_SERVICE_ID', SERVICE_ID);
assertEnv('SENS_REQUEST_ID', REQUEST_ID);

const host = 'https://sens.apigw.ntruss.com';
const path = `/alimtalk/v2/services/${SERVICE_ID}/messages?requestId=${encodeURIComponent(REQUEST_ID)}`;
const method = 'GET';
const timestamp = Date.now().toString();

// SENS 서명 규격: `${method} ${path}\n${timestamp}\n${ACCESS}`
const msg = `${method} ${path}\n${timestamp}\n${ACCESS}`;
const sig = crypto.createHmac('sha256', SECRET).update(msg).digest('base64');

const res = await fetch(`${host}${path}`, {
  method,
  headers: {
    'x-ncp-apigw-timestamp': timestamp,
    'x-ncp-iam-access-key': ACCESS,
    'x-ncp-apigw-signature-v2': sig,
  },
});

const text = await res.text();
console.log('STATUS:', res.status);
console.log('RAW:', text);
