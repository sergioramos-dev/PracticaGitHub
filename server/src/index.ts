import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "./db/database.js";
import { seedDatabase } from "./db/seed.js";
import authRoutes from "./routes/auth.js";
import branchRoutes from "./routes/branches.js";
import ingredientRoutes from "./routes/ingredients.js";
import countRoutes from "./routes/counts.js";
import deliveryRoutes from "./routes/deliveries.js";
import reorderRoutes from "./routes/reorder.js";
import reportRoutes from "./routes/reports.js";
import trainingRoutes from "./routes/trainings.js";
import { authMiddleware } from "./middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;

getDb();
seedDatabase();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "PitTacos Inventory" });
});

app.get("/api/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/counts", countRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/reorder", reorderRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/trainings", trainingRoutes);

const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) res.status(404).json({ error: "Not found" });
  });
});

app.listen(PORT, () => {
  console.log(`PitTacos API corriendo en http://localhost:${PORT}`);
});
