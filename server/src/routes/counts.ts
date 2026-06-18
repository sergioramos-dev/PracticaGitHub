import { Router } from "express";
import { authMiddleware, requireRoles, assertBranchAccess } from "../middleware/auth.js";
import { getDb } from "../db/database.js";
import { Shift } from "../types.js";

const router = Router();

router.get("/", authMiddleware, requireRoles("admin", "encargado"), (req, res) => {
  const branchId = req.user!.role === "admin"
    ? Number(req.query.branchId)
    : req.user!.branchId!;

  if (!branchId) {
    res.status(400).json({ error: "branchId requerido" });
    return;
  }

  const { shiftDate, shift } = req.query as { shiftDate?: string; shift?: Shift };

  const db = getDb();
  let query = `
    SELECT sc.*, i.name as ingredientName, u.name as unitName, us.name as countedByName
    FROM stock_counts sc
    JOIN ingredients i ON i.id = sc.ingredient_id
    JOIN units u ON u.id = sc.unit_id
    JOIN users us ON us.id = sc.counted_by
    WHERE sc.branch_id = ?
  `;
  const params: unknown[] = [branchId];

  if (shiftDate) {
    query += " AND sc.shift_date = ?";
    params.push(shiftDate);
  }
  if (shift) {
    query += " AND sc.shift = ?";
    params.push(shift);
  }

  query += " ORDER BY sc.shift_date DESC, sc.shift DESC, i.name";

  res.json(db.prepare(query).all(...params));
});

router.post("/", authMiddleware, requireRoles("admin", "encargado"), (req, res) => {
  const {
    branchId: bodyBranchId,
    ingredientId,
    quantity,
    unitId,
    shift,
    shiftDate,
    notes,
  } = req.body as {
    branchId?: number;
    ingredientId: number;
    quantity: number;
    unitId: number;
    shift: Shift;
    shiftDate: string;
    notes?: string;
  };

  const branchId = req.user!.role === "admin" ? bodyBranchId! : req.user!.branchId!;

  if (!branchId || !assertBranchAccess(req, branchId)) {
    res.status(403).json({ error: "Sin acceso a esta sucursal" });
    return;
  }

  if (!ingredientId || quantity == null || !unitId || !shift || !shiftDate) {
    res.status(400).json({ error: "Datos incompletos" });
    return;
  }

  const db = getDb();

  const existing = db
    .prepare(
      `SELECT id FROM stock_counts
       WHERE branch_id = ? AND ingredient_id = ? AND shift_date = ? AND shift = ?`
    )
    .get(branchId, ingredientId, shiftDate, shift) as { id: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE stock_counts
       SET quantity = ?, unit_id = ?, notes = ?, counted_by = ?, created_at = datetime('now')
       WHERE id = ?`
    ).run(quantity, unitId, notes ?? null, req.user!.id, existing.id);
    res.json({ id: existing.id, updated: true });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO stock_counts
       (branch_id, ingredient_id, quantity, unit_id, shift, shift_date, notes, counted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(branchId, ingredientId, quantity, unitId, shift, shiftDate, notes ?? null, req.user!.id);

  res.status(201).json({ id: result.lastInsertRowid, updated: false });
});

router.post("/batch", authMiddleware, requireRoles("admin", "encargado"), (req, res) => {
  const { branchId: bodyBranchId, shift, shiftDate, counts } = req.body as {
    branchId?: number;
    shift: Shift;
    shiftDate: string;
    counts: Array<{
      ingredientId: number;
      quantity: number;
      unitId: number;
      notes?: string;
    }>;
  };

  const branchId = req.user!.role === "admin" ? bodyBranchId! : req.user!.branchId!;

  if (!branchId || !assertBranchAccess(req, branchId)) {
    res.status(403).json({ error: "Sin acceso a esta sucursal" });
    return;
  }

  const db = getDb();
  const insertOrUpdate = runTransaction(() => {
    const results: Array<{ ingredientId: number; id: number; updated: boolean }> = [];

    for (const c of counts) {
      const existing = db
        .prepare(
          `SELECT id FROM stock_counts
           WHERE branch_id = ? AND ingredient_id = ? AND shift_date = ? AND shift = ?`
        )
        .get(branchId, c.ingredientId, shiftDate, shift) as { id: number } | undefined;

      if (existing) {
        db.prepare(
          `UPDATE stock_counts
           SET quantity = ?, unit_id = ?, notes = ?, counted_by = ?, created_at = datetime('now')
           WHERE id = ?`
        ).run(c.quantity, c.unitId, c.notes ?? null, req.user!.id, existing.id);
        results.push({ ingredientId: c.ingredientId, id: existing.id, updated: true });
      } else {
        const r = db
          .prepare(
            `INSERT INTO stock_counts
             (branch_id, ingredient_id, quantity, unit_id, shift, shift_date, notes, counted_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            branchId,
            c.ingredientId,
            c.quantity,
            c.unitId,
            shift,
            shiftDate,
            c.notes ?? null,
            req.user!.id
          );
        results.push({
          ingredientId: c.ingredientId,
          id: r.lastInsertRowid as number,
          updated: false,
        });
      }
    }

    return results;
  });

  res.status(201).json(insertOrUpdate);
});

export default router;
