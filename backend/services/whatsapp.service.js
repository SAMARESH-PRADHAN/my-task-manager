import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";

import qrcode from "qrcode-terminal";

let sock;
let isReady = false;

export async function initWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(".wa_auth");

    sock = makeWASocket({
      auth: state,
      browser: ["CRM Tool", "Chrome", "1.0"],
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("\n📱 Scan this QR code with WhatsApp:\n");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        isReady = true;
        console.log("✅ WhatsApp connected & READY");
      }

      if (connection === "close") {
        isReady = false;

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut;

        console.error(
          "⚠ WhatsApp disconnected",
          "| statusCode:",
          statusCode,
          "| reconnect:",
          shouldReconnect
        );

        if (shouldReconnect) {
          initWhatsApp();
        }
      }
    });

    sock.ev.on("creds.update", saveCreds);
  } catch (err) {
    console.error("❌ WhatsApp init failed:", err);
  }
}

export async function sendWhatsAppMessage(phone, message) {
  try {
    if (!sock || !isReady) {
      console.error("❌ WhatsApp socket not ready yet");
      return;
    }

    // 🔹 Clean phone number
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone || cleanPhone.length < 10) {
      console.error("❌ Invalid phone number:", phone);
      return;
    }

    // 🔹 Resolve WhatsApp JID PROPERLY
    const [result] = await sock.onWhatsApp(cleanPhone);

    if (!result || !result.exists) {
      console.error("❌ Number not on WhatsApp:", cleanPhone);
      return;
    }

    const jid = result.jid;

    console.log("📤 Sending WhatsApp message to:", jid);

    // 🔹 Presence update (CRITICAL – prevents silent drops)
    await sock.sendPresenceUpdate("composing", jid);
    await new Promise((r) => setTimeout(r, 500));

    // 🔹 Send message with ACK
    await sock.sendMessage(
      jid,
      { text: message },
      { waitForAck: true }
    );

    await sock.sendPresenceUpdate("paused", jid);

    console.log("✅ WhatsApp message DELIVERED to:", cleanPhone);

    // 🔹 Mandatory delay
    await new Promise((r) => setTimeout(r, 2000));
  } catch (err) {
    console.error(
      "❌ WhatsApp send failed",
      "| phone:",
      phone,
      "| error:",
      err
    );
  }
}
