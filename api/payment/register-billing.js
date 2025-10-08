export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { imp_uid, customer_uid } = req.body;

  try {
    // 1. 아임포트 액세스 토큰 발급
    const tokenRes = await fetch("https://api.iamport.kr/users/getToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imp_key: process.env.IAMPORT_API_KEY,
        imp_secret: process.env.IAMPORT_API_SECRET,
      }),
    });
    const tokenJson = await tokenRes.json();
    const access_token = tokenJson?.response?.access_token;

    // 2. 빌링키 등록
    const billingRes = await fetch(`https://api.iamport.kr/subscribe/customers/${customer_uid}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": access_token,
      },
      body: JSON.stringify({
        card_number: "1234-1234-1234-1234",
        expiry: "2027-12",
        birth: "880101",
        pwd_2digit: "12",
      }),
    });

    const billingJson = await billingRes.json();
    res.status(200).json(billingJson);

  } catch (err) {
    console.error("[register-billing error]", err);
    res.status(500).json({ error: err.message });
  }
}
