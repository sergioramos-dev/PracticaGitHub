import { useEffect, useState } from "react";
import { api } from "../api/client";
import { BranchSelector } from "./LoginPage";
import { useAuth, useBranchId } from "../contexts/AuthContext";
import { todayISO } from "../types";

interface ConsumptionItem {
  ingredientName: string;
  unitName: string;
  startQuantity: number | null;
  endQuantity: number | null;
  received: number;
  consumption: number | null;
  estimatedCost: number;
}

interface ConsumptionReport {
  fromDate: string;
  toDate: string;
  items: ConsumptionItem[];
  totalCost: number;
}

interface BranchComparison {
  branchName: string;
  deliveryCount: number;
  totalCost: number;
  period: { from: string; to: string };
}

export function ReportsPage() {
  const branchId = useBranchId();
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(todayISO());
  const [report, setReport] = useState<ConsumptionReport | null>(null);
  const [comparison, setComparison] = useState<BranchComparison[]>([]);

  useEffect(() => {
    if (!branchId) return;
    api<ConsumptionReport>(
      `/reports/consumption?branchId=${branchId}&fromDate=${fromDate}&toDate=${toDate}`
    ).then(setReport);
  }, [branchId, fromDate, toDate]);

  useEffect(() => {
    if (user?.role === "admin") {
      api<BranchComparison[]>("/reports/compare-branches").then(setComparison);
    }
  }, [user]);

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
      <h2 className="text-xl font-bold">Reportes</h2>

      <div className="card grid grid-cols-2 gap-3">
        <div>
          <label className="label">Desde</label>
          <input type="date" className="input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Hasta</label>
          <input type="date" className="input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {report && (
        <div className="card">
          <p className="mb-2 font-medium">Consumo del periodo</p>
          <p className="mb-3 text-sm text-gray-500">
            Gasto en recepciones: <strong>${report.totalCost.toFixed(2)}</strong>
          </p>
          <div className="space-y-2">
            {report.items
              .filter((i) => i.consumption !== null && i.consumption > 0)
              .map((item) => (
                <div key={item.ingredientName} className="flex justify-between text-sm border-b border-gray-50 py-2">
                  <div>
                    <p className="font-medium">{item.ingredientName}</p>
                    <p className="text-xs text-gray-400">
                      Recibido: {item.received} · Quedó: {item.endQuantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-pittacos-700">
                      {item.consumption} {item.unitName}
                    </p>
                    {item.estimatedCost > 0 && (
                      <p className="text-xs text-gray-400">${item.estimatedCost.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {user?.role === "admin" && comparison.length > 0 && (
        <div className="card">
          <p className="mb-3 font-medium">Comparativa sucursales (7 días)</p>
          <div className="space-y-3">
            {comparison.map((b) => (
              <div key={b.branchName} className="flex justify-between text-sm">
                <span className="font-medium">{b.branchName}</span>
                <span className="text-gray-600">
                  {b.deliveryCount} recepciones · ${b.totalCost.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
