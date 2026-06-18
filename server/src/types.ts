export type UserRole = "admin" | "encargado" | "trabajador";
export type Shift = "matutino" | "vespertino";

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
  branchId: number | null;
  branchName: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
