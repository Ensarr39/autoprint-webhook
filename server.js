import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// Webhook verify (GET)
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "AutoPrintVerify1"; // senin yazdığın token
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified!");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Webhook receive (POST)
app.post("/webhook", async (req, res) => {
  console.log("===== WEBHOOK POST RECEIVED =====");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // Mesaj varsa basitçe metni yaz
    const msg = value?.messages?.[0];
    if (msg) {
      const from = msg.from;
      const body = msg.text?.body || msg.button?.text || "(no text)";
      console.log(`Incoming WA message from ${from}: ${body}`);
    }

    // 🔹 Gelen veriyi Integrately'ye ilet
    const integratelyUrl =
      "https://webhooks.integrately.com/a/webhooks/80284c2f741747e9b51f94e4f16e90c";

    await fetch(integratelyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    console.log("➡️ Data forwarded to Integrately");
  } catch (e) {
    console.error("Parsing error:", e);
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Webhook running on port ${PORT}`));
