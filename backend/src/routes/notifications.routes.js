import express from "express";
import { sql } from "../../config/db.js";
import { auth } from "../middleware/auth.js";
import { sendWhatsAppMessage } from "../../services/whatsapp.service.js";

const router = express.Router();
// ⏳ Delay helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * SEND BULK NOTIFICATION
 */
router.post("/",auth, async (req, res) => {
  const { message, targetType } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  try {
    let customers;

    if (targetType === "all") {
      customers = await sql`
        SELECT phone FROM customers WHERE phone IS NOT NULL
      `;
    } else {
      customers = await sql`
        SELECT phone FROM customers 
        WHERE type = ${targetType} AND phone IS NOT NULL
      `;
    }

    if (customers.length === 0) {
      return res.status(404).json({ message: "No customers found" });
    }

    const results = [];

    for (const customer of customers) {
      try {
        const response = await sendWhatsAppMessage(customer.phone, message);

        results.push({
          phone: customer.phone,
          status: "sent",
          response,
        });

        // ⏳ WAIT 1.5 seconds before next message
        await sleep(1500);
      } catch (err) {
        results.push({
          phone: customer.phone,
          status: "failed",
          error: err.response?.data || err.message,
        });
      }
    }

    res.json({
      success: true,
      total: customers.length,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
    });
  } catch (error) {
    console.error("NOTIFICATION ERROR:", error);
    res.status(500).json({ message: "Failed to send notifications" });
  }
});

export default router;
