import { Router } from "express";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { getDb } from "../db/database.js";

const router = Router();

router.get("/", authMiddleware, (req, res) => {
  const db = getDb();
  const branchId =
    req.user!.role === "admin" && req.query.branchId
      ? Number(req.query.branchId)
      : req.user!.branchId;

  if (!branchId && req.user!.role !== "admin") {
    res.status(400).json({ error: "Sucursal requerida" });
    return;
  }

  const ingredients = db
    .prepare(
      `SELECT
         i.id, i.name, ic.name as category,
         bis.min_stock as minStock, bis.ideal_stock as idealStock,
         bis.default_unit_id as defaultUnitId,
         u.name as defaultUnitName,
         (SELECT json_group_array(json_object('id', un.id, 'name', un.name, 'isDefault', iu.is_default))
          FROM ingredient_units iu
          JOIN units un ON un.id = iu.unit_id
          WHERE iu.ingredient_id = i.id) as unitsJson
       FROM ingredients i
       LEFT JOIN ingredient_categories ic ON ic.id = i.category_id
       JOIN branch_ingredient_settings bis ON bis.ingredient_id = i.id
       JOIN units u ON u.id = bis.default_unit_id
       WHERE i.active = 1 ${branchId ? "AND bis.branch_id = ?" : ""}
       ORDER BY ic.name, i.name`
    )
    .all(...(branchId ? [branchId] : []));

  const parsed = ingredients.map((row: Record<string, unknown>) => ({
    ...row,
    units: JSON.parse((row.unitsJson as string) || "[]"),
    unitsJson: undefined,
  }));

  res.json(parsed);
});

router.get("/suppliers", authMiddleware, (_req, res) => {
  const db = getDb();
  const suppliers = db
    .prepare("SELECT id, name, phone FROM suppliers WHERE active = 1 ORDER BY name")
    .all();
  res.json(suppliers);
});

router.put(
  "/:ingredientId/settings",
  authMiddleware,
  requireRoles("admin"),
  (req, res) => {
    const { branchId, minStock, idealStock, defaultUnitId } = req.body as {
      branchId: number;
      minStock: number;
      idealStock: number;
      defaultUnitId: number;
    };

    const db = getDb();
    db.prepare(
      `UPDATE branch_ingredient_settings
       SET min_stock = ?, ideal_stock = ?, default_unit_id = ?
       WHERE branch_id = ? AND ingredient_id = ?`
    ).run(minStock, idealStock, defaultUnitId, branchId, Number(req.params.ingredientId));

    res.json({ ok: true });
  }
);

export default router;
