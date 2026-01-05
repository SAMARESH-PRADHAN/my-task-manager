  import express from "express";
  import cors from "cors";
  import { sql } from "../config/db.js";

  // Routes
  import authRoutes from "./routes/auth.routes.js";
  import usersRoutes from "./routes/users.routes.js";
  import tasksRoutes from "./routes/tasks.routes.js";
  import customersRoutes from "./routes/customers.routes.js";
  import exportRoutes from "./routes/export.routes.js";
  import notificationRoutes from "./routes/notifications.routes.js";

  const app = express();

  /* ======================
    MIDDLEWARE
  ====================== */
  app.use(cors());
  app.use(express.json());

  // ⚠️ NOTE:
  // Local uploads work in dev / VPS.
  // On Vercel (serverless) filesystem is ephemeral.
  app.use("/uploads", express.static("uploads"));

  /* ======================
    DB CONNECTION CHECK (SERVERLESS SAFE)
  ====================== */
  (async () => {
    try {
      const result = await sql`SELECT NOW()`;
      console.log("✅ Database connected successfully at:", result[0].now);
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
    }
  })();

  /* ======================
    ROUTES
  ====================== */
  app.use("/auth", authRoutes);
  app.use("/users", usersRoutes);
  app.use("/tasks", tasksRoutes);
  app.use("/customers", customersRoutes);
  app.use("/export", exportRoutes);
  app.use("/notifications", notificationRoutes);

  /* ======================
    HEALTH CHECK
  ====================== */
  app.get("/health", async (_, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ status: "Backend is running 🚀" });
  } catch {
    res.status(500).json({ status: "db_error" });
  }
});


  export default app;
