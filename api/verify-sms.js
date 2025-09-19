import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone, code } = req.body;
  const { data, error } = await supabase
    .from("otp_codes")
    .select("*")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return res.status(400).json({ error: "코드 없음" });
  if (data.code !== code) return res.status(400).json({ error: "코드 불일치" });
  if (new Date(data.expires_at) < new Date()) return res.status(400).json({ error: "코드 만료" });

  // 인증 성공 → Supabase User Metadata 업데이트
  // (프론트에서 user.id를 전달받거나 세션 사용)
  const { error: updateError } = await supabase.auth.admin.updateUserById(req.headers["x-user-id"], {
    user_metadata: { phone_verified: true },
  });
  if (updateError) return res.status(500).json({ error: "유저 업데이트 실패" });

  res.json({ ok: true });
}
