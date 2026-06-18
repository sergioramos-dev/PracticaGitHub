import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { Branch } from "../types";

interface LoginUser {
  id: number;
  name: string;
  role: string;
  branchId: number | null;
  branchName: string | null;
}

export function LoginPage() {
  const { login } = useAuth();
  const [users, setUsers] = useState<LoginUser[]>([]);
  const [userId, setUserId] = useState<number | "">("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<LoginUser[]>("/auth/users").then(setUsers).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      await login(Number(userId), pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const grouped = {
    admin: users.filter((u) => u.role === "admin"),
    encargado: users.filter((u) => u.role === "encargado"),
    trabajador: users.filter((u) => u.role === "trabajador"),
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <div className="text-5xl">🌮</div>
        <h1 className="mt-2 text-3xl font-bold text-pittacos-700">PitTacos</h1>
        <p className="text-gray-500">Inventario y capacitaciones</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Usuario</label>
          <select
            className="input"
            value={userId}
            onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : "")}
            required
          >
            <option value="">Selecciona tu usuario</option>
            {grouped.admin.length > 0 && (
              <optgroup label="Administración">
                {grouped.admin.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </optgroup>
            )}
            {grouped.encargado.length > 0 && (
              <optgroup label="Encargados">
                {grouped.encargado.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.branchName ? `(${u.branchName})` : ""}
                  </option>
                ))}
              </optgroup>
            )}
            {grouped.trabajador.length > 0 && (
              <optgroup label="Trabajadores">
                {grouped.trabajador.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.branchName ? `(${u.branchName})` : ""}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div>
          <label className="label">PIN</label>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className="input text-center text-2xl tracking-widest"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            required
          />
        </div>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-400">
        Demo: PIN 1234 · 3 sucursales: Centro, Norte, Sur
      </p>
    </div>
  );
}

export function BranchSelector() {
  const { user, selectedBranchId, setSelectedBranchId } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (user?.role === "admin") {
      api<Branch[]>("/branches").then(setBranches);
    }
  }, [user]);

  if (user?.role !== "admin") return null;

  return (
    <div className="mb-4">
      <label className="label">Sucursal</label>
      <select
        className="input"
        value={selectedBranchId ?? ""}
        onChange={(e) => setSelectedBranchId(Number(e.target.value))}
      >
        <option value="">Selecciona sucursal</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
