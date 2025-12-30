import dotenv from "dotenv";
dotenv.config(); // 🔴 ensures JWT_SECRET is available

import express from "express";
import jwt from "jsonwebtoken";
import { sql } from "../../config/db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await sql`
      SELECT id, name, email, role
      FROM users
      WHERE email = ${email}
        AND password = ${password}
      LIMIT 1
    `;

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // 🔑 JWT creation
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
