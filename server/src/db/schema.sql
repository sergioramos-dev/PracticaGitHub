-- PitTacos Inventory Schema

CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'encargado', 'trabajador')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  abbreviation TEXT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS ingredient_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  category_id INTEGER,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (category_id) REFERENCES ingredient_categories(id)
);

CREATE TABLE IF NOT EXISTS ingredient_units (
  ingredient_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ingredient_id, unit_id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE TABLE IF NOT EXISTS branch_ingredient_settings (
  branch_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  min_stock REAL NOT NULL DEFAULT 0,
  ideal_stock REAL NOT NULL DEFAULT 0,
  default_unit_id INTEGER,
  PRIMARY KEY (branch_id, ingredient_id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
  FOREIGN KEY (default_unit_id) REFERENCES units(id)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS stock_counts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_id INTEGER NOT NULL,
  shift TEXT NOT NULL CHECK(shift IN ('matutino', 'vespertino')),
  shift_date TEXT NOT NULL,
  notes TEXT,
  counted_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (counted_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_stock_counts_branch_date
  ON stock_counts(branch_id, shift_date, shift);

CREATE TABLE IF NOT EXISTS deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  supplier_id INTEGER,
  quantity REAL NOT NULL,
  unit_id INTEGER NOT NULL,
  unit_cost REAL,
  total_cost REAL,
  shift TEXT CHECK(shift IN ('matutino', 'vespertino')),
  delivery_date TEXT NOT NULL,
  notes TEXT,
  received_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (received_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_deliveries_branch_date
  ON deliveries(branch_id, delivery_date);

CREATE TABLE IF NOT EXISTS training_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS trainings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  category_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  target_roles TEXT NOT NULL DEFAULT 'admin,encargado,trabajador',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (category_id) REFERENCES training_categories(id)
);

CREATE TABLE IF NOT EXISTS training_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  training_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(training_id, user_id),
  FOREIGN KEY (training_id) REFERENCES trainings(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
