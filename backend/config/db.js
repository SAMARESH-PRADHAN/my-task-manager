import dotenv from "dotenv";
dotenv.config(); // ✅ MUST BE HERE

import { neon } from "@neondatabase/serverless";
import { fetch } from "undici";

// 🔴 THIS IS THE FIX
globalThis.fetch = fetch;

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing. Check .env loading.");
}

export const sql = neon(process.env.DATABASE_URL);
