import dotenv from "dotenv";
dotenv.config(); // 🔴 MUST BE FIRST LINE
import app from "./app.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 🔹 Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
}

startServer();
