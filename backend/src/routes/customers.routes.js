import express from "express";
import { sql } from "../../config/db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET all customers
 */
router.get("/", auth, async (_, res) => {
  try {
    const customers = await sql`
      SELECT *
      FROM customers
      ORDER BY id DESC
    `;

    res.json(customers);
  } catch (err) {
    console.error("FETCH CUSTOMERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * CREATE new customer
 */
router.post("/", auth, async (req, res) => {
  const { name, email, phone, type } = req.body;

  try {
    const result = await sql`
      INSERT INTO customers (name, email, phone, type)
      VALUES (${name}, ${email}, ${phone}, ${type})
      RETURNING *
    `;

    res.json(result[0]);
  } catch (err) {
    console.error("CREATE CUSTOMER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
