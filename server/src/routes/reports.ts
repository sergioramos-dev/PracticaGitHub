import { Router } from "express";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { getDb } from "../db/database.js";

const router = Router();

router.get("/consumption", authMiddleware, requireRoles("admin", "encargado"), (req, res) => {
  const branchId = req.user!.role === "admin"
    ? Number(req.query.branchId)
    : req.user!.branchId!;

  const { fromDate, toDate } = req.query as { fromDate?: string; toDate?: string };

  if (!branchId || !fromDate || !toDate) {
    res.status(400).json({ error: "branchId, fromDate y toDate requeridos" });
    return;
  }

  const db = getDb();

  const ingredients = db
    .prepare(
      `SELECT i.id, i.name, u.name as unitName, bis.default_unit_id
       FROM branch_ingredient_settings bis
       JOIN ingredients i ON i.id = bis.ingredient_id
       JOIN units u ON u.id = bis.default_unit_id
       WHERE bis.branch_id = ? AND i.active = 1`
    )
    .all(branchId) as Array<{ id: number; name: string; unitName: string }>;

  const report = ingredients.map((ing) => {
    const startCount = db
      .prepare(
        `SELECT quantity FROM stock_counts
         WHERE branch_id = ? AND ingredient_id = ? AND shift_date >= ?
         ORDER BY shift_date ASC, shift ASC LIMIT 1`
      )
      .get(branchId, ing.id, fromDate) as { quantity: number } | undefined;

    const endCount = db
      .prepare(
        `SELECT quantity FROM stock_counts
         WHERE branch_id = ? AND ingredient_id = ? AND shift_date <= ?
         ORDER BY shift_date DESC, shift DESC LIMIT 1`
      )
      .get(branchId, ing.id, toDate) as { quantity: number } | undefined;

    const deliveries = db
      .prepare(
        `SELECT COALESCE(SUM(quantity), 0) as total,
                COALESCE(SUM(total_cost), 0) as cost
         FROM deliveries
         WHERE branch_id = ? AND ingredient_id = ?
           AND delivery_date >= ? AND delivery_date <= ?`
      )
      .get(branchId, ing.id, fromDate, toDate) as { total: number; cost: number };

    const startQty = startCount?.quantity ?? 0;
    const endQty = endCount?.quantity ?? 0;
    const received = deliveries.total;
    const consumption = startQty + received - endQty;

    return {
      ingredientId: ing.id,
      ingredientName: ing.name,
      unitName: ing.unitName,
      startQuantity: startCount ? startQty : null,
      endQuantity: endCount ? endQty : null,
      received,
      consumption: startCount && endCount ? consumption : null,
      estimatedCost: deliveries.cost,
    };
  });

  const totalCost = report.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);

  res.json({ branchId, fromDate, toDate, items: report, totalCost });
});

router.get("/dashboard", authMiddleware, requireRoles("admin", "encargado"), (req, res) => {
  const branchId = req.user!.role === "admin"
    ? Number(req.query.branchId)
    : req.user!.branchId!;

  if (!branchId) {
    res.status(400).json({ error: "branchId requerido" });
    return;
  }

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const countsToday = db
    .prepare(
      `SELECT shift, COUNT(*) as count
       FROM stock_counts WHERE branch_id = ? AND shift_date = ?
       GROUP BY shift`
    )
    .all(branchId, today);

  const deliveriesToday = db
    .prepare(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_cost), 0) as cost
       FROM deliveries WHERE branch_id = ? AND delivery_date = ?`
    )
    .get(branchId, today) as { count: number; cost: number };

  const lowStock = db
    .prepare(
      `SELECT COUNT(*) as count FROM (
         SELECT bis.ingredient_id,
           (SELECT sc.quantity FROM stock_counts sc
            WHERE sc.branch_id = bis.branch_id AND sc.ingredient_id = bis.ingredient_id
            ORDER BY sc.shift_date DESC, sc.shift DESC LIMIT 1) as qty,
           bis.min_stock
         FROM branch_ingredient_settings bis
         WHERE bis.branch_id = ?
       ) t WHERE qty IS NOT NULL AND qty < min_stock`
    )
    .get(branchId) as { count: number };

  res.json({
    branchId,
    date: today,
    countsToday,
    deliveriesToday,
    lowStockCount: lowStock.count,
  });
});

router.get("/compare-branches", authMiddleware, requireRoles("admin"), (_req, res) => {
  const db = getDb();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const from = fromDate.toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);

  const branches = db
    .prepare("SELECT id, name FROM branches WHERE active = 1")
    .all() as Array<{ id: number; name: string }>;

  const comparison = branches.map((branch) => {
    const cost = db
      .prepare(
        `SELECT COALESCE(SUM(total_cost), 0) as total
         FROM deliveries
         WHERE branch_id = ? AND delivery_date >= ? AND delivery_date <= ?`
      )
      .get(branch.id, from, to) as { total: number };

    const deliveryCount = db
      .prepare(
        `SELECT COUNT(*) as count FROM deliveries
         WHERE branch_id = ? AND delivery_date >= ? AND delivery_date <= ?`
      )
      .get(branch.id, from, to) as { count: number };

    return {
      branchId: branch.id,
      branchName: branch.name,
      period: { from, to },
      deliveryCount: deliveryCount.count,
      totalCost: cost.total,
    };
  });

  res.json(comparison);
});

export default router;
