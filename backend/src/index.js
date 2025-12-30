import dotenv from "dotenv";
dotenv.config(); // 🔴 MUST BE FIRST LINE

import app from "./app.js";
import { initWhatsApp } from "../services/whatsapp.service.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 🔹 Initialize WhatsApp (QR shows only first time)
    await initWhatsApp();

    // 🔹 Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
}

startServer();
