// /api/board.js
import jwt from "jsonwebtoken";

// 외부 게시판 주소 (환경변수 권장)
const EXTERNAL_TARGETS = {
  free:    process.env.BOARD_URL_FREE    || "https://external.example.com/freeboard",
  faq:     process.env.BOARD_URL_FAQ     || "https://external.example.com/faq",
  contact: process.env.BOARD_URL_CONTACT || "https://external.example.com/contact",
};

// (옵션) 외부 SSO가 JWT를 받는 경우에만 설정
const SSO_SHARED_SECRET = process.env.SSO_SHARED_SECRET || "";
const SSO_TOKEN_TTL_SECONDS = 90;

// Supabase JWT 검증용 (Settings → Auth → JWT Secret)
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || ""; // HS256

function getAuthCookie(req) {
  const cookie = req.headers.cookie || "";
  const m = /(?:^|;\s*)auth=([^;]+)/.exec(cookie);
  return m ? decodeURIComponent(m[1]) : null;
}

export default async function handler(req, res) {
  try {
    const { type } = req.query;
    const targetBase = EXTERNAL_TARGETS[type];
    if (!targetBase) return res.status(400).send("Unknown board type");

    // 1) 회원 토큰 추출
    const token = getAuthCookie(req);
    if (!token) {
      const returnUrl = encodeURIComponent(req.url || "/api/board");
      res.writeHead(302, { Location: `/login?returnUrl=${returnUrl}` });
      return res.end();
    }

    // 2) JWT 검증 (Supabase HS256)
    try {
      jwt.verify(token, SUPABASE_JWT_SECRET, { algorithms: ["HS256"] });
    } catch {
      const returnUrl = encodeURIComponent(req.url || "/api/board");
      res.writeHead(302, { Location: `/login?returnUrl=${returnUrl}` });
      return res.end();
    }

    // 3) (옵션) 외부 SSO 토큰 생성
    let targetUrl = targetBase;
    if (SSO_SHARED_SECRET) {
      const now = Math.floor(Date.now() / 1000);
      const externalToken = jwt.sign(
        { iat: now, exp: now + SSO_TOKEN_TTL_SECONDS, aud: "external-board", iss: "your-site" },
        SSO_SHARED_SECRET,
        { algorithm: "HS256" }
      );
      const joiner = targetBase.includes("?") ? "&" : "?";
      targetUrl = `${targetBase}${joiner}token=${encodeURIComponent(externalToken)}`;
    }

    // 4) 외부로 302 리다이렉트
    res.writeHead(302, { Location: targetUrl });
    return res.end();
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal Server Error");
  }
}
