import { useEffect, useState } from "react";
import { api } from "../api/client";
import { BranchSelector } from "./LoginPage";
import { useBranchId } from "../contexts/AuthContext";
import { Ingredient, Supplier, Shift, todayISO, currentShift, SHIFT_LABELS } from "../types";

export function DeliveryPage() {
  const branchId = useBranchId();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredientId, setIngredientId] = useState<number | "">("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [quantity, setQuantity] = useState("");
  const [unitId, setUnitId] = useState<number | "">("");
  const [unitCost, setUnitCost] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(todayISO());
  const [shift, setShift] = useState<Shift>(currentShift());
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!branchId) return;
    api<Ingredient[]>(`/ingredients?branchId=${branchId}`).then(setIngredients);
    api<Supplier[]>("/ingredients/suppliers").then(setSuppliers);
  }, [branchId]);

  const selectedIngredient = ingredients.find((i) => i.id === ingredientId);

  useEffect(() => {
    if (selectedIngredient) {
      setUnitId(selectedIngredient.defaultUnitId);
    }
  }, [selectedIngredient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId || !ingredientId || !quantity || !unitId) return;

    setSaving(true);
    setMessage("");
    try {
      await api("/deliveries", {
        method: "POST",
        body: JSON.stringify({
          branchId,
          ingredientId,
          supplierId: supplierId || undefined,
          quantity: parseFloat(quantity),
          unitId,
          unitCost: unitCost ? parseFloat(unitCost) : undefined,
          deliveryDate,
          shift,
          notes: notes || undefined,
        }),
      });
      setMessage("✓ Recepción registrada");
      setQuantity("");
      setUnitCost("");
      setNotes("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  if (!branchId) {
    return (
      <div>
        <BranchSelector />
        <p className="text-center text-gray-500">Selecciona una sucursal</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BranchSelector />
      <div>
        <h2 className="text-xl font-bold">Recepción de proveedor</h2>
        <p className="text-sm text-gray-500">Registra cuando llega mercancía</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Ingrediente</label>
          <select
            className="input"
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value ? Number(e.target.value) : "")}
            required
          >
            <option value="">Seleccionar...</option>
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Proveedor</label>
          <select
            className="input"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Sin especificar</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cantidad</label>
            <input
              type="number"
              step="0.25"
              min="0"
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Unidad</label>
            <select
              className="input"
              value={unitId}
              onChange={(e) => setUnitId(Number(e.target.value))}
              required
              disabled={!selectedIngredient}
            >
              {selectedIngredient?.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Costo por unidad (opcional)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            placeholder="Para reportes de gasto"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha</label>
            <input
              type="date"
              className="input"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Turno</label>
            <select className="input" value={shift} onChange={(e) => setShift(e.target.value as Shift)}>
              <option value="matutino">{SHIFT_LABELS.matutino}</option>
              <option value="vespertino">{SHIFT_LABELS.vespertino}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Notas</label>
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {message && (
          <p className={`text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? "Guardando..." : "Registrar recepción"}
        </button>
      </form>
    </div>
  );
}
