import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  try {
    const now = new Date();

    // 1️⃣ 해지 요청 처리
    const { data, error } = await supabase
      .from("memberships")
      .update({
        status: "cancel_requested",
        cancel_at_period_end: true,
        updated_at: now.toISOString(),
      })
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) throw error;

    // 2️⃣ 응답
    return res.status(200).json({
      ok: true,
      message: "해지 신청 완료. 이번 달 말일에 해지됩니다.",
      membership: data,
    });
  } catch (err) {
    console.error("[cancel-subscription] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
