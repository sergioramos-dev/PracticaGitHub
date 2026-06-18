import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getDb } from "../db/database.js";

const router = Router();

router.get("/", authMiddleware, (_req, res) => {
  const db = getDb();
  const branches = db
    .prepare(
      "SELECT id, name, address, active FROM branches WHERE active = 1 ORDER BY name"
    )
    .all();
  res.json(branches);
});

export default router;
