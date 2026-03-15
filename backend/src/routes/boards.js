import express from "express";
import { sql } from "../../config/db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/* GET ALL BOARDS */
router.get("/", auth, async (req, res) => {
  try {
    const boards = await sql`
      SELECT * FROM boards ORDER BY name
    `;
    res.json(boards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* CREATE BOARD */
router.post("/", auth, async (req, res) => {
  const { name } = req.body;

  try {
    const result = await sql`
      INSERT INTO boards (name)
      VALUES (${name})
      ON CONFLICT (name) DO NOTHING
      RETURNING *
    `;

    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
