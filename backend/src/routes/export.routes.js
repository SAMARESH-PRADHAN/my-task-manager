import express from "express";
import { sql } from "../../config/db.js";
import { exportExcel } from "../utils/excel.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * EXPORT TASKS TO EXCEL
 */
router.get("/tasks", auth, async (_, res) => {
  try {
    const tasks = await sql`
      SELECT *
      FROM tasks
      ORDER BY id DESC
    `;

    exportExcel(tasks, "tasks", res);
  } catch (err) {
    console.error("EXPORT TASKS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
