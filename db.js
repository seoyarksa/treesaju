// db.js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres.dxrgobsgeeshkybkbnxo',     // ✅ URI에서 추출
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  database: 'postgres',
  password: 'ziX65u_&L@g+b&S',                 // Supabase DB password 입력
  port: 6543,                               // ✅ pooler 포트
  ssl: { rejectUnauthorized: false }        // ✅ Supabase 연결 필수
});

export default pool;



