import express from "express";
import { sql } from "../../config/db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET ALL USERS
 */
router.get("/", auth, async (_, res) => {
  try {
    const users = await sql`
      SELECT *
      FROM users
      ORDER BY id DESC
    `;

    res.json(users);
  } catch (err) {
    console.error("FETCH USERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * CREATE EMPLOYEE
 */
router.post("/", auth, async (req, res) => {
  const { name, email, phone, address, password } = req.body;

  try {
    await sql`
      INSERT INTO users (name, email, phone, address, password, role)
      VALUES (${name}, ${email}, ${phone}, ${address}, ${password}, 'employee')
    `;

    res.json({ message: "Employee created successfully" });
  } catch (err) {
    console.error("CREATE EMPLOYEE ERROR:", err);

    // Duplicate email
    if (err.code === "23505") {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE EMPLOYEE
 */
router.put("/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, phone, address, password } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: "Invalid employee id" });
  }

  try {
    await sql`
      UPDATE users SET
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        address = COALESCE(${address}, address),
        password = COALESCE(${password}, password)
      WHERE id = ${id}
    `;

    res.json({ message: "Employee updated successfully" });
  } catch (err) {
    console.error("UPDATE EMPLOYEE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;

