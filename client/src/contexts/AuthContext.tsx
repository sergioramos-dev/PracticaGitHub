import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setToken, clearToken, getStoredBranchId, setStoredBranchId } from "../api/client";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  selectedBranchId: number | null;
  setSelectedBranchId: (id: number) => void;
  login: (userId: number, pin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchIdState] = useState<number | null>(getStoredBranchId());

  useEffect(() => {
    const token = localStorage.getItem("pittacos_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api<User>("/me")
      .then((u) => {
        setUser(u);
        if (u.role === "admin" && !selectedBranchId) {
          setSelectedBranchIdState(getStoredBranchId());
        } else if (u.branchId) {
          setSelectedBranchIdState(u.branchId);
        }
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => setLoading(false));
  }, []);

  const setSelectedBranchId = (id: number) => {
    setSelectedBranchIdState(id);
    setStoredBranchId(id);
  };

  const login = async (userId: number, pin: string) => {
    const data = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ userId, pin }),
    });
    setToken(data.token);
    setUser(data.user);
    if (data.user.branchId) {
      setSelectedBranchId(data.user.branchId);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, selectedBranchId, setSelectedBranchId, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export function useBranchId(): number | null {
  const { user, selectedBranchId } = useAuth();
  if (user?.role === "admin") return selectedBranchId;
  return user?.branchId ?? null;
}
