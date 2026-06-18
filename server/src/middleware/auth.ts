import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthUser, UserRole } from "../types.js";

const JWT_SECRET = process.env.JWT_SECRET || "pittacos-dev-secret-change-in-production";

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "12h" });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: "Sesión expirada" });
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Sin permiso" });
      return;
    }
    next();
  };
}

export function resolveBranchId(req: Request, paramOrQuery = "branchId"): number | null {
  const user = req.user!;
  if (user.role === "admin") {
    const raw = req.params[paramOrQuery] ?? req.query[paramOrQuery] ?? req.body?.branchId;
    return raw ? Number(raw) : null;
  }
  return user.branchId;
}

export function assertBranchAccess(req: Request, branchId: number): boolean {
  const user = req.user!;
  if (user.role === "admin") return true;
  return user.branchId === branchId;
}
