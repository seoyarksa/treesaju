// api/otp.js — 임시 진단 전용(액션/DB 전부 무시하고 supabase import만 확인)
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if ((req.method || 'GET') !== 'POST') {
    return res.status(400).json({ ok:false, error:'POST only' });
  }
  try {
    const { createClient } = await import('@supabase/supabase-js');
    return res.status(200).json({
      ok: true,
      supabaseImport: true,
      node: process.version
    });
  } catch (e) {
    return res.status(500).json({ ok:false, where:'import', details: String(e?.message || e) });
  }
}
