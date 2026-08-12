import crypto from "crypto";
import { type Request, type Response, type NextFunction } from "express";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) throw new Error("SESSION_SECRET env var is required");

export interface PortalSession {
  userId: number;
  roleKey: string;
  roleLabel: string;
  username: string;
  firstName: string;
  lastName: string;
  hubspotCompanyId: string;
  hubspotContactId: string;
  mustChangePassword: boolean;
}

export interface AdminSession {
  adminId: number;
  name: string;
  email: string;
}

const PORTAL_COOKIE = "sox_session";
const ADMIN_COOKIE = "sox_admin";
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours

function sign(data: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET!).update(data).digest("hex");
}

export function encodeToken(payload: unknown): string {
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString("base64url");
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export function decodeToken<T>(token: string): T | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const encoded = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = sign(encoded);
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      return null;
    }
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}

export function setPortalSession(res: Response, session: PortalSession): void {
  res.cookie(PORTAL_COOKIE, encodeToken(session), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearPortalSession(res: Response): void {
  res.clearCookie(PORTAL_COOKIE);
}

export function setAdminSession(res: Response, session: AdminSession): void {
  res.cookie(ADMIN_COOKIE, encodeToken(session), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearAdminSession(res: Response): void {
  res.clearCookie(ADMIN_COOKIE);
}

// Middleware: parse both session cookies and attach to req
export function sessionMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const portalToken = req.cookies?.[PORTAL_COOKIE];
  if (portalToken) {
    req.portalSession = decodeToken<PortalSession>(portalToken) ?? undefined;
  }
  const adminToken = req.cookies?.[ADMIN_COOKIE];
  if (adminToken) {
    req.adminSession = decodeToken<AdminSession>(adminToken) ?? undefined;
  }
  next();
}
