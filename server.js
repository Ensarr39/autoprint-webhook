import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

// ✅ Webhook Verify (GET)
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "AutoPrintVerify1";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully!");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ✅ Webhook Receive (POST)
app.post("/webhook", async (req, res) => {
  console.log("===== 📩 WEBHOOK POST RECEIVED =====");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const msg = value?.messages?.[0];

    if (msg) {
      const from = msg.from;
      const body = msg.text?.body || msg.button?.text || "(no text)";
      console.log(`💬 Incoming WA message from ${from}: ${body}`);

      // ✅ Integrately webhook URL
      const integratelyUrl = "https://webhooks.integrately.com/a/webhooks/80284c2f741747e9b51f93e4ef16e90c";

      // ✅ Forward to Integrately (axios)
      const response = await axios.post(integratelyUrl, req.body, {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true, // hata olsa bile status'u yakalayalım
      });

      console.log("📤 Integrately Response Status:", response.status);
      console.log("📤 Integrately Response Body:", JSON.stringify(response.data).slice(0, 400));

      if (response.status >= 200 && response.status < 300) {
        console.log("✅ Data successfully forwarded to Integrately!");
      } else {
        console.error("⚠️ Failed to forward data to Integrately. Check URL or mapping.");
      }
    } else {
      console.log("⚠️ No message object found in the webhook payload.");
    }
  } catch (err) {
    console.error("❌ Error processing webhook:", err);
  }

  res.sendStatus(200);
});

// ✅ Server Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Webhook server running on port ${PORT}`));
