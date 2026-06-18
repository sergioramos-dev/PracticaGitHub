import { useEffect, useState } from "react";
import { api } from "../api/client";
import { BranchSelector } from "./LoginPage";
import { useAuth, useBranchId } from "../contexts/AuthContext";
import { ReorderItem } from "../types";

interface ReorderResponse {
  items: ReorderItem[];
  needsReorder: ReorderItem[];
  alerts: ReorderItem[];
}

export function ReorderPage() {
  const branchId = useBranchId();
  const { user } = useAuth();
  const [data, setData] = useState<ReorderResponse | null>(null);

  useEffect(() => {
    if (!branchId) return;
    api<ReorderResponse>(`/reorder?branchId=${branchId}`).then(setData);
  }, [branchId]);

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
        <h2 className="text-xl font-bold">Surtido automático</h2>
        <p className="text-sm text-gray-500">
          Calculado según lo que quedó vs. stock ideal
        </p>
      </div>

      {!data ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <>
          {data.alerts.length > 0 && (
            <div className="card border-red-200 bg-red-50">
              <p className="font-semibold text-red-700">
                ⚠️ {data.alerts.length} bajo mínimo
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-medium">Hay que surtir</h3>
            {data.needsReorder.length === 0 ? (
              <p className="text-sm text-green-600">Todo en niveles ideales ✓</p>
            ) : (
              data.needsReorder.map((item) => (
                <div key={item.ingredientId} className="card">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-semibold">{item.ingredientName}</p>
                      <p className="text-xs text-gray-400">{item.category}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        item.status === "bajo_minimo"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status === "bajo_minimo" ? "Urgente" : "Surtir"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    <p>
                      Quedó:{" "}
                      <strong>
                        {item.currentQuantity ?? "—"} {item.unitName}
                      </strong>
                    </p>
                    <p className="text-pittacos-700">
                      Surtir: <strong>{item.toReachIdeal}</strong> {item.unitName} (hasta ideal)
                    </p>
                    {item.lastCountDate && (
                      <p className="text-xs text-gray-400">
                        Último conteo: {item.lastCountDate} · {item.lastShift}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {user?.role === "admin" && (
            <details className="card">
              <summary className="cursor-pointer font-medium">Ver todo el inventario</summary>
              <div className="mt-3 space-y-2">
                {data.items.map((item) => (
                  <div key={item.ingredientId} className="flex justify-between text-sm">
                    <span>{item.ingredientName}</span>
                    <span className="text-gray-500">
                      {item.currentQuantity ?? "sin conteo"} / ideal {item.idealStock}{" "}
                      {item.unitName}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
