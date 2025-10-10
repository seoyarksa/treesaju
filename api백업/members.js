// api/members.js
import mysql from "mysql2/promise";

export default async function handler(req, res) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  if (req.method === "GET") {
    const [rows] = await conn.execute("SELECT * FROM members LIMIT 10");
    res.json(rows);
  }
  // 수정/삭제 분기 추가
}
