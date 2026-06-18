const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("pittacos_token");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Error de conexión");
  }
  return data as T;
}

export function setToken(token: string): void {
  localStorage.setItem("pittacos_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("pittacos_token");
}

export function getStoredBranchId(): number | null {
  const raw = localStorage.getItem("pittacos_branch");
  return raw ? Number(raw) : null;
}

export function setStoredBranchId(branchId: number): void {
  localStorage.setItem("pittacos_branch", String(branchId));
}
