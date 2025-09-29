// /api/pay.js
export default async function handler(req, res) {
  const action = req.query.action || req.body?.action;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    if (action === "start") {
      const { user_id } = req.body || {};
      if (!user_id) return res.status(400).json({ error: "user_id required" });
      const redirectUrl = "https://mock.kakaopay/redirect";
      return res.status(200).json({ redirectUrl });
    }

    if (action === "approve") {
      // ... 승인 처리
      return res.status(200).json({ ok: true });
    }

    if (action === "webhook") {
      // ... 카카오 웹훅 처리
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
