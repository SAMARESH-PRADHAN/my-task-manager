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
        c.type  AS customer_type,

        e.name  AS employee_name,
        cb.name AS completed_by_name

      FROM tasks t
      LEFT JOIN customers c  ON c.id  = t.customer_id
      LEFT JOIN users     e  ON e.id  = t.employee_id
      LEFT JOIN users     cb ON cb.id = t.completed_by
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

  const customerId = Number(t.customer_id);
  const employeeId =
    req.user.role === "admin" ? Number(t.employee_id) : req.user.id;

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
        board_name,
        application_id,
        application_password,
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
         ${t.board_name},
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
        c.email AS customer_email,
        cb.name AS completed_by_name
      FROM tasks t
      LEFT JOIN customers c  ON c.id  = t.customer_id
      LEFT JOIN users     cb ON cb.id = t.completed_by
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
    // ── Fetch current row so we can fill in unchanged fields ──
    const [current] = await sql`SELECT * FROM tasks WHERE id = ${taskId}`;
    if (!current) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Resolve each field: use incoming value if provided, else keep current
    const employeeId =
      t.employee_id != null ? Number(t.employee_id) : current.employee_id;

    const completedBy =
      t.completed_by != null && t.completed_by !== ""
        ? Number(t.completed_by)
        : (current.completed_by ?? null);

    const applicationId = t.application_id ?? current.application_id;
    const applicationPassword =
      t.application_password ?? current.application_password;
    const description = t.description ?? current.description;
    const totalAmount =
      t.total_amount != null ? Number(t.total_amount) : current.total_amount;
    const deductionAmount =
      t.deduction_amount != null
        ? Number(t.deduction_amount)
        : current.deduction_amount;
    const revenue = t.revenue != null ? Number(t.revenue) : current.revenue;
    const paymentStatus = t.payment_status ?? current.payment_status;
    const paymentMode = t.payment_mode ?? current.payment_mode;
    const formServiceType = t.form_service_type ?? current.form_service_type;
    const boardName = t.board_name ?? current.board_name;
    const workStatus = t.work_status ?? current.work_status;
    const completedAt =
      workStatus === "completed" && current.work_status !== "completed"
        ? new Date()
        : current.completed_at;

    await sql`
      UPDATE tasks SET
        employee_id          = ${employeeId},
        completed_by         = ${completedBy},
        application_id       = ${applicationId},
        application_password = ${applicationPassword},
        description          = ${description},
        total_amount         = ${totalAmount},
        deduction_amount     = ${deductionAmount},
        revenue              = ${revenue},
        payment_status       = ${paymentStatus},
        payment_mode         = ${paymentMode},
        form_service_type    = ${formServiceType},
        board_name = ${boardName},
        work_status          = ${workStatus},
        completed_at         = ${completedAt}
      WHERE id = ${taskId}
    `;

    await sql`
      UPDATE customers SET
        name  = COALESCE(${t.customer_name ?? null}, name),
        phone = COALESCE(${t.customer_phone ?? null}, phone),
        email = COALESCE(${t.customer_email ?? null}, email)
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
 * DELETE TASK + CUSTOMER
 */
router.delete("/:id", auth, async (req, res) => {
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ message: "Invalid task id" });
  }

  try {
    const taskResult = await sql`
      SELECT customer_id FROM tasks WHERE id = ${taskId}
    `;

    if (taskResult.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const customerId = taskResult[0].customer_id;

    await sql`DELETE FROM tasks WHERE id = ${taskId}`;

    if (customerId) {
      await sql`DELETE FROM customers WHERE id = ${customerId}`;
    }

    res.json({ message: "Task and customer deleted successfully" });
  } catch (err) {
    console.error("DELETE TASK ERROR:", err);
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
        UPDATE tasks SET screenshot_url = ${path} WHERE id = ${taskId}
      `;
      res.json({ screenshot: path });
    } catch (err) {
      console.error("UPLOAD SCREENSHOT ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
