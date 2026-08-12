import { type Request, type Response, type NextFunction } from "express";

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.adminSession) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }
  next();
}
