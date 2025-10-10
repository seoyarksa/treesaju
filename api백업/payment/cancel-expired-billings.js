import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const now = new Date().toISOString();

    // 1️⃣ 해지 대상: cancel_at_period_end=true & current_period_end 지난 사용자
    const { data: targets, error } = await supabase
      .from("memberships")
      .select("user_id, current_period_end")
      .eq("cancel_at_period_end", true)
      .lte("current_period_end", now)
      .eq("status", "cancel_requested");

    if (error) throw error;
    if (!targets?.length)
      return res.status(200).json({ message: "해지 대상 없음" });

    console.log(`[cancel-expired-billings] ${targets.length}명 해지 처리`);

    for (const t of targets) {
      await supabase
        .from("memberships")
        .update({
          status: "inactive",
          cancel_at_period_end: false,
          updated_at: now,
        })
        .eq("user_id", t.user_id);

      await supabase
        .from("profiles")
        .update({ role: "normal" })
        .eq("user_id", t.user_id);

      console.log(`[✅ 해지완료] user_id: ${t.user_id}`);
    }

    return res.status(200).json({ ok: true, count: targets.length });
  } catch (err) {
    console.error("[cancel-expired-billings] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
