import bcrypt from "bcryptjs";
import { getDb, runTransaction } from "./database.js";

const DEFAULT_PIN = "1234";

export function seedDatabase(): void {
  const db = getDb();

  const orgCount = db.prepare("SELECT COUNT(*) as count FROM organizations").get() as {
    count: number;
  };

  if (orgCount.count > 0) {
    console.log("Base de datos ya tiene datos. Seed omitido.");
    return;
  }

  const pinHash = bcrypt.hashSync(DEFAULT_PIN, 10);

  const seed = () =>
    runTransaction(() => {
    const org = db
      .prepare("INSERT INTO organizations (name) VALUES (?)")
      .run("PitTacos");
    const orgId = org.lastInsertRowid as number;

    const branches = ["Centro", "Norte", "Sur"];
    const branchIds: number[] = [];
    for (const name of branches) {
      const row = db
        .prepare("INSERT INTO branches (organization_id, name) VALUES (?, ?)")
        .run(orgId, name);
      branchIds.push(row.lastInsertRowid as number);
    }

    db.prepare(
      "INSERT INTO users (branch_id, name, pin_hash, role) VALUES (NULL, ?, ?, 'admin')"
    ).run("Administrador", pinHash);

    for (let i = 0; i < branchIds.length; i++) {
      const branchId = branchIds[i];
      const branchName = branches[i];

      db.prepare(
        "INSERT INTO users (branch_id, name, pin_hash, role) VALUES (?, ?, ?, 'encargado')"
      ).run(branchId, `Encargado ${branchName}`, pinHash);

      db.prepare(
        "INSERT INTO users (branch_id, name, pin_hash, role) VALUES (?, ?, ?, 'trabajador')"
      ).run(branchId, `Trabajador ${branchName}`, pinHash);
    }

    const unitNames = [
      ["costal", "costal"],
      ["bote", "bote"],
      ["reja", "reja"],
      ["kilo", "kg"],
      ["paquete", "paq"],
      ["manojo", "man"],
      ["caja", "caja"],
      ["litro", "L"],
      ["pieza", "pza"],
    ];

    const unitIds: Record<string, number> = {};
    for (const [name, abbr] of unitNames) {
      const row = db
        .prepare(
          "INSERT INTO units (organization_id, name, abbreviation) VALUES (?, ?, ?)"
        )
        .run(orgId, name, abbr);
      unitIds[name] = row.lastInsertRowid as number;
    }

    const categories = ["Verduras", "Carnes", "Abarrotes", "Bebidas", "Limpieza"];
    const categoryIds: Record<string, number> = {};
    for (const name of categories) {
      const row = db
        .prepare(
          "INSERT INTO ingredient_categories (organization_id, name) VALUES (?, ?)"
        )
        .run(orgId, name);
      categoryIds[name] = row.lastInsertRowid as number;
    }

    const ingredients: Array<{
      name: string;
      category: string;
      units: string[];
      defaultUnit: string;
      min: number;
      ideal: number;
    }> = [
      { name: "Cebolla", category: "Verduras", units: ["costal", "bote", "kilo"], defaultUnit: "costal", min: 1, ideal: 3 },
      { name: "Limón", category: "Verduras", units: ["reja", "kilo", "pieza"], defaultUnit: "reja", min: 1, ideal: 2 },
      { name: "Cilantro", category: "Verduras", units: ["manojo", "caja"], defaultUnit: "manojo", min: 5, ideal: 15 },
      { name: "Tortillas", category: "Abarrotes", units: ["paquete", "kilo"], defaultUnit: "paquete", min: 2, ideal: 5 },
      { name: "Carne al pastor", category: "Carnes", units: ["kilo"], defaultUnit: "kilo", min: 5, ideal: 15 },
      { name: "Carne asada", category: "Carnes", units: ["kilo"], defaultUnit: "kilo", min: 3, ideal: 10 },
      { name: "Queso", category: "Abarrotes", units: ["kilo"], defaultUnit: "kilo", min: 2, ideal: 5 },
      { name: "Crema", category: "Abarrotes", units: ["litro", "bote"], defaultUnit: "litro", min: 2, ideal: 5 },
      { name: "Salsa roja", category: "Abarrotes", units: ["bote", "litro"], defaultUnit: "bote", min: 1, ideal: 3 },
      { name: "Salsa verde", category: "Abarrotes", units: ["bote", "litro"], defaultUnit: "bote", min: 1, ideal: 3 },
      { name: "Aceite", category: "Abarrotes", units: ["litro", "bote"], defaultUnit: "litro", min: 2, ideal: 5 },
      { name: "Servilletas", category: "Limpieza", units: ["paquete", "caja"], defaultUnit: "paquete", min: 2, ideal: 5 },
    ];

    for (const ing of ingredients) {
      const row = db
        .prepare(
          "INSERT INTO ingredients (organization_id, category_id, name) VALUES (?, ?, ?)"
        )
        .run(orgId, categoryIds[ing.category], ing.name);
      const ingredientId = row.lastInsertRowid as number;

      for (const unitName of ing.units) {
        const isDefault = unitName === ing.defaultUnit ? 1 : 0;
        db.prepare(
          "INSERT INTO ingredient_units (ingredient_id, unit_id, is_default) VALUES (?, ?, ?)"
        ).run(ingredientId, unitIds[unitName], isDefault);
      }

      for (const branchId of branchIds) {
        db.prepare(
          `INSERT INTO branch_ingredient_settings
           (branch_id, ingredient_id, min_stock, ideal_stock, default_unit_id)
           VALUES (?, ?, ?, ?, ?)`
        ).run(branchId, ingredientId, ing.min, ing.ideal, unitIds[ing.defaultUnit]);
      }
    }

    const suppliers = [
      ["Central de Abastos", "555-0101"],
      ["Carnes El Primo", "555-0102"],
      ["Tortillería La Buena", "555-0103"],
    ];
    for (const [name, phone] of suppliers) {
      db.prepare(
        "INSERT INTO suppliers (organization_id, name, phone) VALUES (?, ?, ?)"
      ).run(orgId, name, phone);
    }

    const trainingCats = ["Cocina", "Higiene", "Atención", "Seguridad"];
    const trainingCatIds: number[] = [];
    for (const name of trainingCats) {
      const row = db
        .prepare(
          "INSERT INTO training_categories (organization_id, name) VALUES (?, ?)"
        )
        .run(orgId, name);
      trainingCatIds.push(row.lastInsertRowid as number);
    }

    const trainings = [
      {
        cat: 0,
        title: "Preparación de salsas",
        description: "Proceso estándar para salsa roja y verde",
        content:
          "1. Lavar y desinfectar chiles y tomates.\n2. Asar ingredientes.\n3. Moler y sazonar.\n4. Etiquetar con fecha.",
      },
      {
        cat: 1,
        title: "Higiene personal",
        description: "Normas básicas de higiene en cocina",
        content:
          "• Lavado de manos cada 30 min.\n• Uso de gorro y mandil.\n• No joyería en cocina.\n• Reportar enfermedades.",
      },
      {
        cat: 2,
        title: "Atención al cliente",
        description: "Cómo atender con actitud PitTacos",
        content:
          "Saludar, confirmar pedido, ofrecer extras, entregar con prisa pero sin apuro. Resolver quejas con calma.",
      },
      {
        cat: 3,
        title: "Manejo de cortadores",
        description: "Uso seguro de equipos de cocina",
        content:
          "Revisar filo, usar guantes de malla, mantener área limpia, apagar y guardar correctamente al terminar turno.",
      },
    ];

    for (const t of trainings) {
      db.prepare(
        `INSERT INTO trainings (organization_id, category_id, title, description, content)
         VALUES (?, ?, ?, ?, ?)`
      ).run(orgId, trainingCatIds[t.cat], t.title, t.description, t.content);
    }
    });

  seed();

  console.log("Seed completado.");
  console.log("Usuarios de prueba (PIN: 1234):");
  console.log("  - Administrador (admin, todas las sucursales)");
  console.log("  - Encargado Centro / Norte / Sur");
  console.log("  - Trabajador Centro / Norte / Sur");
}

const isDirectRun = process.argv[1]?.includes("seed");
if (isDirectRun) {
  seedDatabase();
}
