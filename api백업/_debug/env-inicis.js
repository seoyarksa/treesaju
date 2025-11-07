export default async function handler(req, res) {
  res.status(200).json({
    INICIS_MID: !!process.env.INICIS_MID,
    INICIS_SIGNKEY: !!process.env.INICIS_SIGNKEY,
    SITE_ORIGIN: !!process.env.SITE_ORIGIN,
    runtime: 'node', // pages/api는 기본적으로 Node 서버리스
  });
}
