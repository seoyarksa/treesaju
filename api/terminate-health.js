export default function handler(req, res) {
  // 어떤 메서드로 와도 200 반환
  return res.status(200).json({
    ok: true,
    ts: new Date().toISOString(),
    // 필요하면 여기서 환경변수 유무도 찍을 수 있음
    SUPABASE_URL: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
