import express from "express";
import { auth } from "../middleware/auth.js";
import { sendWhatsAppMessage } from "../../services/whatsapp.service.js";

const router = express.Router();

/**
 * SEND NOTIFICATION TO FILTERED TASK CUSTOMERS
 */
router.post("/", auth, async (req, res) => {
  const { message, phones } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  if (!phones || phones.length === 0) {
    return res.status(400).json({ message: "No phone numbers provided" });
  }

  try {
    const results = [];

    for (const phone of phones) {
      try {
        const response = await sendWhatsAppMessage(phone, message);

        results.push({
          phone,
          status: "sent",
          response,
        });

        await sleep(1500);
      } catch (err) {
        results.push({
          phone,
          status: "failed",
          error: err.response?.data || err.message,
        });
      }
    }

    res.json({
      success: true,
      total: phones.length,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
    });
  } catch (error) {
    console.error("TASK NOTIFICATION ERROR:", error);
    res.status(500).json({ message: "Failed to send notifications" });
  }
});

export default router;
