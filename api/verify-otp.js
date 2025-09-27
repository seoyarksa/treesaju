import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone, code, userId } = req.body;
  if (!phone || !code || !userId) {
    return res.status(400).json({ error: "phone, code, userId 필요" });
  }

  // 최신 코드 조회
  const { data, error } = await supabase
    .from("otp_codes")
    .select("*")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return res.status(400).json({ error: "코드 없음" });
  if (data.code !== code) return res.status(400).json({ error: "코드 불일치" });
  if (new Date(data.expires_at) < new Date())
    return res.status(400).json({ error: "코드 만료" });

  // 인증 성공 → 유저 메타데이터 업데이트
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    userId,
    { user_metadata: { phone_verified: true } }
  );

  if (updateError) return res.status(500).json({ error: "유저 업데이트 실패" });

  return res.json({ ok: true });
}
