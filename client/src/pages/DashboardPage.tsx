import { useEffect, useState } from "react";
import { api } from "../api/client";
import { BranchSelector } from "./LoginPage";
import { useBranchId } from "../contexts/AuthContext";

interface Dashboard {
  date: string;
  countsToday: Array<{ shift: string; count: number }>;
  deliveriesToday: { count: number; cost: number };
  lowStockCount: number;
}

export function DashboardPage() {
  const branchId = useBranchId();
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    if (!branchId) return;
    api<Dashboard>(`/reports/dashboard?branchId=${branchId}`).then(setData);
  }, [branchId]);

  if (!branchId) {
    return (
      <div>
        <BranchSelector />
        <p className="text-center text-gray-500">Selecciona una sucursal para continuar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BranchSelector />
      <h2 className="text-xl font-bold">Resumen del día</h2>

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <p className="text-sm text-gray-500">Bajo mínimo</p>
              <p className="text-3xl font-bold text-red-600">{data.lowStockCount}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500">Recepciones hoy</p>
              <p className="text-3xl font-bold text-pittacos-700">{data.deliveriesToday.count}</p>
            </div>
          </div>

          <div className="card">
            <p className="mb-2 font-medium">Conteos de hoy ({data.date})</p>
            {data.countsToday.length === 0 ? (
              <p className="text-sm text-amber-600">Aún no hay conteos registrados hoy</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {data.countsToday.map((c) => (
                  <li key={c.shift}>
                    {c.shift === "matutino" ? "☀️ Matutino" : "🌙 Vespertino"}: {c.count}{" "}
                    ingredientes
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm text-gray-500">
              Gasto en recepciones: ${data.deliveriesToday.cost.toFixed(2)}
            </p>
          </div>

          <div className="card bg-pittacos-50">
            <p className="text-sm">
              <strong>Recuerda:</strong> Al final de cada turno registra lo que{" "}
              <em>queda</em>, no lo que falta. El sistema calcula el surtido automáticamente.
            </p>
          </div>
        </>
      ) : (
        <p className="text-gray-500">Cargando...</p>
      )}
    </div>
  );
}
