import express from "express";
import multer from "multer";
import { sql } from "../../config/db.js";
import { auth } from "../middleware/auth.js";
import { notifyTaskCompleted } from "./taskCompletionNotifier.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * GET ALL TASKS
 */
router.get("/", auth, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const fromDate = req.query.from_date ? new Date(req.query.from_date) : null;
    const toDate = req.query.to_date ? new Date(req.query.to_date) : null;
    const board = req.query.board && req.query.board !== 'all' ? req.query.board : null;
    const serviceType = req.query.service_type || null; // 'form_filling' or 'xerox'

    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count
      FROM tasks t
      LEFT JOIN customers c ON c.id = t.customer_id
      WHERE 1=1
        ${serviceType ? sql`AND t.service_type = ${serviceType}` : sql``}
        ${search ? sql`AND (c.name ILIKE ${search} OR c.phone ILIKE ${search} OR t.application_id ILIKE ${search} OR t.description ILIKE ${search})` : sql``}
        ${fromDate ? sql`AND t.created_at >= ${fromDate}` : sql``}
        ${toDate ? sql`AND t.created_at <= ${toDate}` : sql``}
        ${board ? sql`AND t.board_name ILIKE ${`%${board}%`}` : sql``}
    `;

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
      WHERE 1=1
        ${serviceType ? sql`AND t.service_type = ${serviceType}` : sql``}
        ${search ? sql`AND (c.name ILIKE ${search} OR c.phone ILIKE ${search} OR t.application_id ILIKE ${search} OR t.description ILIKE ${search})` : sql``}
        ${fromDate ? sql`AND t.created_at >= ${fromDate}` : sql``}
        ${toDate ? sql`AND t.created_at <= ${toDate}` : sql``}
        ${board ? sql`AND t.board_name ILIKE ${`%${board}%`}` : sql``}
      ORDER BY t.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    res.json({ tasks, total: count });
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
 * DASHBOARD STATS
 */
router.get("/stats/dashboard", auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const employeeId = req.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Admin sees all tasks, employee sees only their own
    const tasks = isAdmin
      ? await sql`
          SELECT service_type, form_service_type, work_status, payment_status, revenue, total_amount, employee_id
          FROM tasks
          WHERE created_at >= ${todayStart}
        `
      : await sql`
          SELECT service_type, form_service_type, work_status, payment_status, revenue, total_amount, employee_id
          FROM tasks
          WHERE created_at >= ${todayStart}
          AND employee_id = ${employeeId}
        `;

    // Pending counts (all tasks not just today)
    // Count pending separately (work pending + payment pending = 2 actions on same task)
    const pendingQuery = isAdmin
      ? await sql`
          SELECT work_status, payment_status, service_type
          FROM tasks
        `
      : await sql`
          SELECT work_status, payment_status, service_type
          FROM tasks
          WHERE employee_id = ${employeeId}
        `;

    let pendingCount = 0;
    pendingQuery.forEach(t => {
      if (t.service_type === 'form_filling') {
        if (t.work_status === 'pending') pendingCount++;
        if (t.payment_status === 'pending' || t.payment_status === 'unpaid') pendingCount++;
      } else if (t.service_type === 'xerox') {
        if (t.payment_status === 'pending' || t.payment_status === 'unpaid') pendingCount++;
      }
    });

    const formFilling = tasks.filter(t => t.service_type === 'form_filling');
    const xerox = tasks.filter(t => t.service_type === 'xerox');

    const todayRevenue =
      tasks.reduce((sum, t) => sum + Number(t.revenue || t.total_amount || 0), 0);

    // Total customers count
    const [{ count: totalCustomers }] = await sql`SELECT COUNT(*)::int AS count FROM customers`;

    // Today's customers
    const [{ count: todayCustomers }] = await sql`
      SELECT COUNT(*)::int AS count FROM customers
      WHERE created_at >= ${todayStart}
    `;

    // Lifetime stats
    const lifetimeStats = await sql`
      SELECT
        COUNT(*)::int AS total_tasks,
        COALESCE(SUM(revenue), 0)::float AS total_revenue
      FROM tasks
    `;

    const totalTasks = lifetimeStats[0].total_tasks;
    const totalRevenue = lifetimeStats[0].total_revenue;

    // Revenue by service type
    const revenueByService = {
      job_seeker: formFilling.filter(t => t.form_service_type === 'job_seeker').reduce((s, t) => s + Number(t.revenue || t.total_amount || 0), 0),
      student: formFilling.filter(t => t.form_service_type === 'student').reduce((s, t) => s + Number(t.revenue || t.total_amount || 0), 0),
      gov_scheme: formFilling.filter(t => t.form_service_type === 'gov_scheme').reduce((s, t) => s + Number(t.revenue || t.total_amount || 0), 0),
      xerox: xerox.reduce((s, t) => s + Number(t.revenue || t.total_amount || 0), 0),
    };

    res.json({
      todayFormFilling: formFilling.length,
      todayXerox: xerox.length,
      todayRevenue,
      pendingCount,
      totalCustomers,
      todayCustomers,
      totalTasks,
      totalRevenue,
      serviceBreakdown: {
        job_seeker: formFilling.filter(t => t.form_service_type === 'job_seeker').length,
        student: formFilling.filter(t => t.form_service_type === 'student').length,
        gov_scheme: formFilling.filter(t => t.form_service_type === 'gov_scheme').length,
        xerox: xerox.length,
      },
      revenueByService,
      employeeStats: isAdmin
        ? Object.values(
            tasks.reduce((acc, t) => {
              const id = String(t.employee_id);
              if (!acc[id]) acc[id] = { employeeId: id, revenue: 0 };
              acc[id].revenue += Number(t.revenue || t.total_amount || 0);
              return acc;
            }, {})
          )
        : [],
    });
  } catch (err) {
    console.error("DASHBOARD STATS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * EMPLOYEE STATS
 */
router.get("/stats/employees", auth, async (req, res) => {
  try {
    const tasks = await sql`
      SELECT
        employee_id,
        service_type,
        form_service_type,
        work_status,
        payment_status,
        revenue,
        total_amount,
        deduction_amount,
        created_at
      FROM tasks
    `;

    // Group by employee
    const statsMap = {};
    tasks.forEach(t => {
      const id = String(t.employee_id);
      if (!statsMap[id]) {
        statsMap[id] = { employeeId: id, tasks: [] };
      }
      statsMap[id].tasks.push(t);
    });

    res.json(statsMap);
  } catch (err) {
    console.error("EMPLOYEE STATS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ANALYTICS STATS
 */
router.get("/stats/analytics", auth, async (req, res) => {
  try {
    const { range = "daily" } = req.query;

    const now = new Date();

    // Current period start (for summary cards, pie chart, bar chart)
    let periodStart;
    if (range === "daily") {
      periodStart = new Date(now);
      periodStart.setHours(0, 0, 0, 0);
    } else if (range === "weekly") {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - now.getDay()); // start of this week
      periodStart.setHours(0, 0, 0, 0);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodStart.setHours(0, 0, 0, 0);
    }

    // Trend period start (for trend chart - last 7 days / 4 weeks / 6 months)
    let rangeStart;
    if (range === "daily") {
      rangeStart = new Date(now);
      rangeStart.setDate(rangeStart.getDate() - 6);
      rangeStart.setHours(0, 0, 0, 0);
    } else if (range === "weekly") {
      rangeStart = new Date(now);
      rangeStart.setDate(rangeStart.getDate() - 27);
      rangeStart.setHours(0, 0, 0, 0);
    } else {
      rangeStart = new Date(now);
      rangeStart.setMonth(rangeStart.getMonth() - 5);
      rangeStart.setDate(1);
      rangeStart.setHours(0, 0, 0, 0);
    }

    // All tasks for trend (wider range)
    const trendTasks = await sql`
      SELECT service_type, form_service_type, revenue, total_amount,
             deduction_amount, employee_id, created_at
      FROM tasks
      WHERE created_at >= ${rangeStart}
      ORDER BY created_at ASC
    `;

    // Current period tasks only (for summary, pie, bar charts)
    const periodTasks = await sql`
      SELECT service_type, form_service_type, revenue, total_amount,
             deduction_amount, employee_id, created_at
      FROM tasks
      WHERE created_at >= ${periodStart}
    `;

    const getRevenue = (t) => Number(t.revenue || t.total_amount || 0);

    const formFilling = periodTasks.filter(t => t.service_type === 'form_filling');
    const xerox = periodTasks.filter(t => t.service_type === 'xerox');

    // Service distribution (current period)
    const serviceDistribution = {
      job_seeker: formFilling.filter(t => t.form_service_type === 'job_seeker').length,
      student: formFilling.filter(t => t.form_service_type === 'student').length,
      gov_scheme: formFilling.filter(t => t.form_service_type === 'gov_scheme').length,
      xerox: xerox.length,
    };

    // Revenue by service (current period)
    const revenueByService = {
      job_seeker: formFilling.filter(t => t.form_service_type === 'job_seeker').reduce((s, t) => s + getRevenue(t), 0),
      student: formFilling.filter(t => t.form_service_type === 'student').reduce((s, t) => s + getRevenue(t), 0),
      gov_scheme: formFilling.filter(t => t.form_service_type === 'gov_scheme').reduce((s, t) => s + getRevenue(t), 0),
      xerox: xerox.reduce((s, t) => s + getRevenue(t), 0),
    };

    // Employee performance (current period) with formFilling + xerox split
    const empMap = {};
    periodTasks.forEach(t => {
      const id = String(t.employee_id);
      if (!empMap[id]) empMap[id] = { employeeId: id, formFilling: 0, xerox: 0 };
      if (t.service_type === 'form_filling') empMap[id].formFilling += getRevenue(t);
      else if (t.service_type === 'xerox') empMap[id].xerox += getRevenue(t);
    });
    const employeePerformance = Object.values(empMap).map((e) => ({
      ...e,
      revenue: e.formFilling + e.xerox,
    }));

    // Build all expected keys for the range
    const trendMap = {};

    if (range === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        trendMap[key] = { formFilling: 0, xerox: 0 };
      }
    } else if (range === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - (i * 7));
        // Start of that week (Sunday)
        d.setDate(d.getDate() - d.getDay());
        const key = d.toISOString().split('T')[0];
        trendMap[key] = { formFilling: 0, xerox: 0 };
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        trendMap[key] = { formFilling: 0, xerox: 0 };
      }
    }

    // Fill in actual data
    trendTasks.forEach(t => {
      let key;
      const d = new Date(t.created_at);
      if (range === 'daily') {
        key = d.toISOString().split('T')[0];
      } else if (range === 'weekly') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      if (trendMap[key]) {
        if (t.service_type === 'form_filling') trendMap[key].formFilling += getRevenue(t);
        else if (t.service_type === 'xerox') trendMap[key].xerox += getRevenue(t);
      }
    });

    const totalRevenue = periodTasks.reduce((s, t) => s + getRevenue(t), 0);
    const totalTasks = periodTasks.length;
    const totalDeduction = periodTasks.reduce((s, t) => s + Number(t.deduction_amount || 0), 0);

    res.json({
      totalRevenue,
      totalTasks,
      totalDeduction,
      serviceDistribution,
      revenueByService,
      employeePerformance,
      trendData: trendMap,
    });
  } catch (err) {
    console.error("ANALYTICS STATS ERROR:", err);
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
    const serviceType = t.service_type ?? current.service_type;
    const formServiceType = t.form_service_type ?? current.form_service_type;
    const boardName = t.board_name ?? current.board_name;
    const workStatus = t.work_status ?? current.work_status;
    const completedAt =
      workStatus === "completed" && current.work_status !== "completed"
        ? new Date()
        : current.completed_at;
    const justCompleted =
      workStatus === "completed" && current.work_status !== "completed";

    await sql`
      UPDATE tasks SET
        employee_id          = ${employeeId},
        completed_by         = ${completedBy},
        service_type         = ${serviceType},
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
    // 🔔 Send WhatsApp notification when task completed
    if (justCompleted) {
      await notifyTaskCompleted(taskId);
    }
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
    const deleted = await sql`
      DELETE FROM tasks
      WHERE id = ${taskId}
      RETURNING customer_id
    `;

    if (deleted.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const customerId = deleted[0].customer_id;

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