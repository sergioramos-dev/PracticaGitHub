export type UserRole = "admin" | "encargado" | "trabajador";
export type Shift = "matutino" | "vespertino";

export interface User {
  id: number;
  name: string;
  role: UserRole;
  branchId: number | null;
  branchName: string | null;
}

export interface Branch {
  id: number;
  name: string;
}

export interface Unit {
  id: number;
  name: string;
  isDefault: number;
}

export interface Ingredient {
  id: number;
  name: string;
  category: string;
  minStock: number;
  idealStock: number;
  defaultUnitId: number;
  defaultUnitName: string;
  units: Unit[];
}

export interface Training {
  id: number;
  title: string;
  description: string;
  content: string;
  categoryName: string;
  completed: number;
}

export interface ReorderItem {
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

export interface Supplier {
  id: number;
  name: string;
  phone: string;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentShift(): Shift {
  const hour = new Date().getHours();
  return hour < 15 ? "matutino" : "vespertino";
}

export const SHIFT_LABELS: Record<Shift, string> = {
  matutino: "Turno matutino",
  vespertino: "Turno vespertino",
};

export const FRACTIONS = [
  { label: "¼", value: 0.25 },
  { label: "½", value: 0.5 },
  { label: "¾", value: 0.75 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
];
