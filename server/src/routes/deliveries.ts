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

  const db = getDb();
  const deliveries = db
    .prepare(
      `SELECT d.*, i.name as ingredientName, u.name as unitName,
              s.name as supplierName, us.name as receivedByName
       FROM deliveries d
       JOIN ingredients i ON i.id = d.ingredient_id
       JOIN units u ON u.id = d.unit_id
       LEFT JOIN suppliers s ON s.id = d.supplier_id
       JOIN users us ON us.id = d.received_by
       WHERE d.branch_id = ?
       ORDER BY d.delivery_date DESC, d.created_at DESC
       LIMIT 100`
    )
    .all(branchId);

  res.json(deliveries);
});

router.post("/", authMiddleware, requireRoles("admin", "encargado"), (req, res) => {
  const {
    branchId: bodyBranchId,
    ingredientId,
    supplierId,
    quantity,
    unitId,
    unitCost,
    shift,
    deliveryDate,
    notes,
  } = req.body as {
    branchId?: number;
    ingredientId: number;
    supplierId?: number;
    quantity: number;
    unitId: number;
    unitCost?: number;
    shift?: Shift;
    deliveryDate: string;
    notes?: string;
  };

  const branchId = req.user!.role === "admin" ? bodyBranchId! : req.user!.branchId!;

  if (!branchId || !assertBranchAccess(req, branchId)) {
    res.status(403).json({ error: "Sin acceso a esta sucursal" });
    return;
  }

  if (!ingredientId || !quantity || !unitId || !deliveryDate) {
    res.status(400).json({ error: "Datos incompletos" });
    return;
  }

  const totalCost = unitCost != null ? unitCost * quantity : null;
  const db = getDb();

  const result = db
    .prepare(
      `INSERT INTO deliveries
       (branch_id, ingredient_id, supplier_id, quantity, unit_id, unit_cost, total_cost,
        shift, delivery_date, notes, received_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      branchId,
      ingredientId,
      supplierId ?? null,
      quantity,
      unitId,
      unitCost ?? null,
      totalCost,
      shift ?? null,
      deliveryDate,
      notes ?? null,
      req.user!.id
    );

  res.status(201).json({ id: result.lastInsertRowid });
});

export default router;
