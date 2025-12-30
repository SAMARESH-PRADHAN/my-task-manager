import express from "express";
import multer from "multer";
import { sql } from "../../config/db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * GET ALL TASKS
 */
router.get("/", auth, async (_, res) => {
  try {
    const tasks = await sql`
      SELECT
        t.*,
        c.name  AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        c.type  AS customer_type
      FROM tasks t
      LEFT JOIN customers c ON c.id = t.customer_id
      ORDER BY t.created_at DESC
    `;

    res.json(tasks);
  } catch (err) {
    console.error("FETCH TASKS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * CREATE TASK
 */
router.post("/", auth, async (req, res) => {
  const t = req.body;

  // 🔐 STRICT TYPE SAFETY
// 🔐 STRICT TYPE SAFETY
const customerId = Number(t.customer_id);

// ✅ ADMIN assigns → take from body
// ✅ EMPLOYEE assigns → take from token
const employeeId =
  req.user.role === "admin"
    ? Number(t.employee_id)
    : req.user.id;


  if (!Number.isInteger(customerId) || !Number.isInteger(employeeId)) {
    return res.status(400).json({
      message: "Invalid customer_id or employee_id",
    });
  }

  try {
    await sql`
      INSERT INTO tasks (
        customer_id,
        employee_id,
        service_type,
        form_service_type,
        application_id,           -- ✅ FIX
    application_password,     -- ✅ FIX
        description,
        total_amount,
        deduction_amount,
        revenue,
        payment_mode,
        payment_status,
        work_status
      )
      VALUES (
        ${customerId},
        ${employeeId},
        ${t.service_type},
        ${t.form_service_type},
         ${t.application_id || null},
    ${t.application_password || null},
        ${t.description},
        ${t.total_amount || 0},
        ${t.deduction_amount || 0},
        ${t.revenue || 0},
        ${t.payment_mode},
        'unpaid',
        'pending'
      )
    `;

    res.json({ message: "Task created" });
  } catch (err) {
    console.error("CREATE TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/**
 * GET MY TASKS (EMPLOYEE)
 */
router.get("/my", auth, async (req, res) => {
  try {
    const employeeId = req.user.id;

    const tasks = await sql`
      SELECT
        t.*,
        c.name  AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email
      FROM tasks t
      LEFT JOIN customers c ON c.id = t.customer_id
      WHERE t.employee_id = ${employeeId}
      ORDER BY t.created_at DESC
    `;

    res.json(tasks);
  } catch (err) {
    console.error("FETCH MY TASKS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/**
 * UPDATE TASK + CUSTOMER (SAFE)
 */
router.put("/:id", auth, async (req, res) => {
  const taskId = Number(req.params.id);
  const t = req.body;

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ message: "Invalid task id" });
  }

  try {
    /* =============================
       1️⃣ UPDATE TASK TABLE (SAFE)
    ==============================*/
    await sql`
      UPDATE tasks SET
        application_id = COALESCE(${t.application_id}, application_id),
        application_password = COALESCE(${t.application_password}, application_password),

        description = COALESCE(${t.description}, description),

        total_amount = COALESCE(${t.total_amount}, total_amount),
        deduction_amount = COALESCE(${t.deduction_amount}, deduction_amount),
        revenue = COALESCE(${t.revenue}, revenue),

        payment_status = COALESCE(${t.payment_status}, payment_status),
        payment_mode = COALESCE(${t.payment_mode}, payment_mode),

        form_service_type = COALESCE(${t.form_service_type}, form_service_type),

        work_status = COALESCE(${t.work_status}, work_status),

        completed_at = CASE
          WHEN ${t.work_status} = 'completed' THEN NOW()
          ELSE completed_at
        END
      WHERE id = ${taskId}
    `;

    /* =============================
       2️⃣ UPDATE CUSTOMER TABLE (SAFE)
       ⚠️ NEVER WRITE NULL INTO name
    ==============================*/
    await sql`
      UPDATE customers SET
        name  = COALESCE(${t.customer_name}, name),
        phone = COALESCE(${t.customer_phone}, phone),
        email = COALESCE(${t.customer_email}, email)
      WHERE id = (
        SELECT customer_id FROM tasks WHERE id = ${taskId}
      )
    `;

    res.json({ message: "Task & customer updated successfully" });
  } catch (err) {
    console.error("UPDATE TASK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/**
 * UPLOAD SCREENSHOT
 */
router.post(
  "/:id/screenshot",
  auth,
  upload.single("screenshot"),
  async (req, res) => {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Screenshot file missing" });
    }

    const path = `/uploads/${req.file.filename}`;

    try {
      await sql`
        UPDATE tasks
        SET screenshot_url = ${path}
        WHERE id = ${taskId}
      `;

      res.json({ screenshot: path });
    } catch (err) {
      console.error("UPLOAD SCREENSHOT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
