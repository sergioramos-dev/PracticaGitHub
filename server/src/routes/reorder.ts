import { Router } from "express";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { getDb } from "../db/database.js";

const router = Router();

interface ReorderRow {
  ingredientId: number;
  ingredientName: string;
  category: string;
  currentQuantity: number | null;
  unitName: string;
  minStock: number;
  idealStock: number;
  toReachMin: number;
  toReachIdeal: number;
  status: "ok" | "bajo_minimo" | "sin_conteo";
  lastCountDate: string | null;
  lastShift: string | null;
}

router.get("/", authMiddleware, requireRoles("admin", "encargado"), (req, res) => {
  const branchId = req.user!.role === "admin"
    ? Number(req.query.branchId)
    : req.user!.branchId!;

  if (!branchId) {
    res.status(400).json({ error: "branchId requerido" });
    return;
  }

  const db = getDb();

  const rows = db
    .prepare(
      `SELECT
         i.id as ingredientId,
         i.name as ingredientName,
         ic.name as category,
         bis.min_stock as minStock,
         bis.ideal_stock as idealStock,
         u.name as unitName,
         latest.quantity as currentQuantity,
         latest.shift_date as lastCountDate,
         latest.shift as lastShift
       FROM branch_ingredient_settings bis
       JOIN ingredients i ON i.id = bis.ingredient_id AND i.active = 1
       LEFT JOIN ingredient_categories ic ON ic.id = i.category_id
       JOIN units u ON u.id = bis.default_unit_id
       LEFT JOIN (
         SELECT sc1.*
         FROM stock_counts sc1
         INNER JOIN (
           SELECT ingredient_id, MAX(shift_date || shift) as max_key
           FROM stock_counts
           WHERE branch_id = ?
           GROUP BY ingredient_id
         ) sc2 ON sc1.ingredient_id = sc2.ingredient_id
           AND (sc1.shift_date || sc1.shift) = sc2.max_key
         WHERE sc1.branch_id = ?
       ) latest ON latest.ingredient_id = i.id
       WHERE bis.branch_id = ?
       ORDER BY ic.name, i.name`
    )
    .all(branchId, branchId, branchId) as Array<{
      ingredientId: number;
      ingredientName: string;
      category: string;
      minStock: number;
      idealStock: number;
      unitName: string;
      currentQuantity: number | null;
      lastCountDate: string | null;
      lastShift: string | null;
    }>;

  const suggestions: ReorderRow[] = rows.map((row) => {
    const current = row.currentQuantity ?? null;
    let status: ReorderRow["status"] = "sin_conteo";
    let toReachMin = 0;
    let toReachIdeal = 0;

    if (current !== null) {
      toReachMin = Math.max(0, row.minStock - current);
      toReachIdeal = Math.max(0, row.idealStock - current);
      status = current < row.minStock ? "bajo_minimo" : "ok";
    }

    return {
      ...row,
      toReachMin,
      toReachIdeal,
      status,
    };
  });

  const needsReorder = suggestions.filter((s) => s.status === "bajo_minimo" || s.toReachIdeal > 0);

  res.json({
    branchId,
    items: suggestions,
    needsReorder: needsReorder.filter((s) => s.toReachIdeal > 0),
    alerts: needsReorder.filter((s) => s.status === "bajo_minimo"),
  });
});

export default router;
