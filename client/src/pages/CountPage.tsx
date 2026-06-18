import { useEffect, useState } from "react";
import { api } from "../api/client";
import { BranchSelector } from "./LoginPage";
import { useBranchId } from "../contexts/AuthContext";
import {
  Ingredient,
  Shift,
  FRACTIONS,
  todayISO,
  currentShift,
  SHIFT_LABELS,
} from "../types";

interface CountEntry {
  quantity: number;
  unitId: number;
  notes: string;
}

export function CountPage() {
  const branchId = useBranchId();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [shift, setShift] = useState<Shift>(currentShift());
  const [shiftDate, setShiftDate] = useState(todayISO());
  const [entries, setEntries] = useState<Record<number, CountEntry>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!branchId) return;
    api<Ingredient[]>(`/ingredients?branchId=${branchId}`).then((items) => {
      setIngredients(items);
      const initial: Record<number, CountEntry> = {};
      for (const ing of items) {
        initial[ing.id] = {
          quantity: 0,
          unitId: ing.defaultUnitId,
          notes: "",
        };
      }
      setEntries(initial);
    });
  }, [branchId]);

  const updateEntry = (id: number, patch: Partial<CountEntry>) => {
    setEntries((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const handleSave = async () => {
    if (!branchId) return;
    const counts = Object.entries(entries)
      .filter(([, e]) => e.quantity > 0)
      .map(([ingredientId, e]) => ({
        ingredientId: Number(ingredientId),
        quantity: e.quantity,
        unitId: e.unitId,
        notes: e.notes || undefined,
      }));

    if (counts.length === 0) {
      setMessage("Registra al menos un ingrediente");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await api("/counts/batch", {
        method: "POST",
        body: JSON.stringify({ branchId, shift, shiftDate, counts }),
      });
      setMessage(`✓ Conteo guardado (${counts.length} ingredientes)`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(filter.toLowerCase())
  );

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
        <h2 className="text-xl font-bold">Conteo de turno</h2>
        <p className="text-sm text-gray-500">Registra lo que queda al cierre del turno</p>
      </div>

      <div className="card grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fecha</label>
          <input
            type="date"
            className="input"
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
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

      <input
        className="input"
        placeholder="Buscar ingrediente..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="space-y-3">
        {filtered.map((ing) => {
          const entry = entries[ing.id];
          if (!entry) return null;
          const unit = ing.units.find((u) => u.id === entry.unitId)?.name ?? ing.defaultUnitName;

          return (
            <div key={ing.id} className="card">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{ing.name}</p>
                  <p className="text-xs text-gray-400">{ing.category}</p>
                </div>
                <select
                  className="rounded-lg border px-2 py-1 text-sm"
                  value={entry.unitId}
                  onChange={(e) => updateEntry(ing.id, { unitId: Number(e.target.value) })}
                >
                  {ing.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="mb-2 text-xs text-gray-500">Quedó:</p>
              <div className="flex flex-wrap gap-2">
                {FRACTIONS.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => updateEntry(ing.id, { quantity: f.value })}
                    className={`min-w-[2.5rem] rounded-lg px-3 py-2 text-sm font-medium ${
                      entry.quantity === f.value
                        ? "bg-pittacos-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  className="w-20 rounded-lg border px-2 py-2 text-center"
                  value={entry.quantity || ""}
                  onChange={(e) =>
                    updateEntry(ing.id, { quantity: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Otro"
                />
              </div>
              {entry.quantity > 0 && (
                <p className="mt-2 text-sm text-pittacos-700">
                  → Quedó: <strong>{entry.quantity}</strong> {unit}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {message && (
        <p className={`text-center text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <button onClick={handleSave} className="btn-primary w-full" disabled={saving}>
        {saving ? "Guardando..." : "Guardar conteo del turno"}
      </button>
    </div>
  );
}
