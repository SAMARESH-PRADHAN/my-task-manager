import express from "express";
import { auth } from "../middleware/auth.js";
import { sendWhatsAppMessage } from "../../services/whatsapp.service.js";

const router = express.Router();

const DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /task-notifications
 * Original blocking endpoint — kept for backwards compatibility
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
        results.push({ phone, status: "sent", response });
        await sleep(DELAY_MS);
      } catch (err) {
        results.push({ phone, status: "failed", error: err.response?.data || err.message });
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

/**
 * POST /task-notifications/stream
 * SSE streaming endpoint — emits a progress event after each message
 * so the frontend can show a live progress bar.
 *
 * Request body: { message: string, phones: string[] }
 *
 * SSE events (data field is JSON):
 *   { type: "progress", sent, failed, total, phone }
 *   { type: "done",     sent, failed, total, failedNumbers }
 *   { type: "error",    message }
 */
router.post("/stream", auth, async (req, res) => {
  const { message, phones } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }
  if (!phones || phones.length === 0) {
    return res.status(400).json({ message: "No phone numbers provided" });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === "function") res.flush(); // handle compression middleware
  };

  try {
    const total = phones.length;
    let sent = 0;
    let failed = 0;
    const failedNumbers = [];

    for (const phone of phones) {
      if (res.writableEnded) break; // client disconnected

      try {
        await sendWhatsAppMessage(phone, message);
        sent++;
      } catch (err) {
        failed++;
        failedNumbers.push(phone);
      }

      send({ type: "progress", sent, failed, total, phone });

      await sleep(DELAY_MS);
    }

    send({ type: "done", sent, failed, total, failedNumbers });
  } catch (err) {
    console.error("TASK NOTIFICATION STREAM ERROR:", err);
    send({ type: "error", message: "Failed to send notifications" });
  } finally {
    res.end();
  }
});

export default router;