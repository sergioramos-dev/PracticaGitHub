import { Router } from "express";
import { authMiddleware, requireRoles } from "../middleware/auth.js";
import { getDb } from "../db/database.js";

const router = Router();

router.get("/", authMiddleware, (req, res) => {
  const db = getDb();
  const role = req.user!.role;

  let query = `
    SELECT t.id, t.title, t.description, t.content, t.target_roles as targetRoles,
           t.created_at as createdAt, t.updated_at as updatedAt,
           tc.name as categoryName,
           CASE WHEN tc2.id IS NOT NULL THEN 1 ELSE 0 END as completed
    FROM trainings t
    LEFT JOIN training_categories tc ON tc.id = t.category_id
    LEFT JOIN training_completions tc2 ON tc2.training_id = t.id AND tc2.user_id = ?
    WHERE t.active = 1
  `;

  const trainings = db.prepare(query + " ORDER BY tc.name, t.title").all(req.user!.id) as Array<{
    targetRoles: string;
  }>;

  const filtered = trainings.filter((t) => t.targetRoles.split(",").includes(role));

  res.json(filtered);
});

router.get("/categories", authMiddleware, (_req, res) => {
  const db = getDb();
  const categories = db
    .prepare("SELECT id, name FROM training_categories ORDER BY name")
    .all();
  res.json(categories);
});

router.get("/:id", authMiddleware, (req, res) => {
  const db = getDb();
  const training = db
    .prepare(
      `SELECT t.*, tc.name as categoryName
       FROM trainings t
       LEFT JOIN training_categories tc ON tc.id = t.category_id
       WHERE t.id = ? AND t.active = 1`
    )
    .get(Number(req.params.id));

  if (!training) {
    res.status(404).json({ error: "Capacitación no encontrada" });
    return;
  }

  res.json(training);
});

router.post("/", authMiddleware, requireRoles("admin"), (req, res) => {
  const { categoryId, title, description, content, targetRoles } = req.body as {
    categoryId?: number;
    title: string;
    description?: string;
    content: string;
    targetRoles?: string;
  };

  if (!title || !content) {
    res.status(400).json({ error: "Título y contenido requeridos" });
    return;
  }

  const db = getDb();
  const org = db.prepare("SELECT id FROM organizations LIMIT 1").get() as { id: number };

  const result = db
    .prepare(
      `INSERT INTO trainings (organization_id, category_id, title, description, content, target_roles)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      org.id,
      categoryId ?? null,
      title,
      description ?? null,
      content,
      targetRoles ?? "admin,encargado,trabajador"
    );

  res.status(201).json({ id: result.lastInsertRowid });
});

router.put("/:id", authMiddleware, requireRoles("admin"), (req, res) => {
  const { categoryId, title, description, content, targetRoles, active } = req.body as {
    categoryId?: number;
    title: string;
    description?: string;
    content: string;
    targetRoles?: string;
    active?: number;
  };

  const db = getDb();
  db.prepare(
    `UPDATE trainings
     SET category_id = ?, title = ?, description = ?, content = ?,
         target_roles = ?, active = COALESCE(?, active), updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    categoryId ?? null,
    title,
    description ?? null,
    content,
    targetRoles ?? "admin,encargado,trabajador",
    active ?? null,
    Number(req.params.id)
  );

  res.json({ ok: true });
});

router.post("/:id/complete", authMiddleware, (req, res) => {
  const db = getDb();
  const trainingId = Number(req.params.id);

  db.prepare(
    `INSERT OR IGNORE INTO training_completions (training_id, user_id) VALUES (?, ?)`
  ).run(trainingId, req.user!.id);

  res.json({ ok: true });
});

export default router;
