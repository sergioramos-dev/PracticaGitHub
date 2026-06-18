import { Router } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "../db/database.js";
import { signToken } from "../middleware/auth.js";
import { AuthUser } from "../types.js";

const router = Router();

router.post("/login", (req, res) => {
  const { userId, pin } = req.body as { userId?: number; pin?: string };

  if (!userId || !pin) {
    res.status(400).json({ error: "Usuario y PIN requeridos" });
    return;
  }

  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.pin_hash, u.role, u.branch_id, b.name as branch_name
       FROM users u
       LEFT JOIN branches b ON b.id = u.branch_id
       WHERE u.id = ? AND u.active = 1`
    )
    .get(userId) as
    | {
        id: number;
        name: string;
        pin_hash: string;
        role: AuthUser["role"];
        branch_id: number | null;
        branch_name: string | null;
      }
    | undefined;

  if (!row || !bcrypt.compareSync(pin, row.pin_hash)) {
    res.status(401).json({ error: "PIN incorrecto" });
    return;
  }

  const user: AuthUser = {
    id: row.id,
    name: row.name,
    role: row.role,
    branchId: row.branch_id,
    branchName: row.branch_name,
  };

  res.json({ token: signToken(user), user });
});

router.get("/users", (_req, res) => {
  const db = getDb();
  const users = db
    .prepare(
      `SELECT u.id, u.name, u.role, u.branch_id as branchId, b.name as branchName
       FROM users u
       LEFT JOIN branches b ON b.id = u.branch_id
       WHERE u.active = 1
       ORDER BY u.role, u.name`
    )
    .all();
  res.json(users);
});

export default router;
