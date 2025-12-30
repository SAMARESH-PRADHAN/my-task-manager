import express from "express";
import { sql } from "../../config/db.js";
import { auth } from "../middleware/auth.js";
import { sendWhatsAppMessage } from "../../services/whatsapp.service.js";

const router = express.Router();

/**
 * CREATE NOTIFICATION + SEND WHATSAPP
 */
router.post("/", auth, async (req, res) => {
  const { message, targetType } = req.body;

  console.log("📩 Incoming notification request:", {
    message,
    targetType,
    userId: req.user?.id,
  });

  if (!message || !targetType) {
    console.error("❌ Missing message or targetType");
    return res.status(400).json({
      message: "message and targetType are required",
    });
  }

  try {
    // 1️⃣ Save notification (DB audit)
    await sql`
      INSERT INTO notifications (message, target_type, created_by)
      VALUES (${message}, ${targetType}, ${req.user.id})
    `;

    console.log("✅ Notification saved in DB");

    // 2️⃣ Fetch customers
    let customers;

    if (targetType === "all") {
      customers = await sql`
        SELECT phone FROM customers
        WHERE phone IS NOT NULL
      `;
    } else {
      customers = await sql`
        SELECT phone FROM customers
        WHERE type = ${targetType}
        AND phone IS NOT NULL
      `;
    }

    console.log(`👥 Customers fetched: ${customers.length}`);

    // 3️⃣ Fire-and-forget SEQUENTIAL WhatsApp sending
    (async () => {
      console.log("🚀 Starting WhatsApp dispatch loop");

      for (const c of customers) {
        console.log("➡ Sending to:", c.phone);
        await sendWhatsAppMessage(c.phone, message);
      }

      console.log("✅ WhatsApp dispatch completed");
    })();

    // 4️⃣ Respond immediately
    res.json({
      message: "Notification sent successfully",
      total: customers.length,
    });
  } catch (err) {
    console.error("❌ NOTIFICATION ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * 🔴 TEMP DEBUG ROUTE — REMOVE AFTER TEST
 * Test WhatsApp sending to ONE number
 */
router.get("/test-wa", async (_, res) => {
  try {
    console.log("🧪 TEST-WA route hit");

    await sendWhatsAppMessage(
      "918260368742", // 🔁 PUT YOUR REAL WHATSAPP NUMBER HERE
      "Hello test message from CRM WhatsApp"
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ TEST-WA ERROR:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
