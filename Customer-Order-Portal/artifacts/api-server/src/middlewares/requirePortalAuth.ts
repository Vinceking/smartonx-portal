import { type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { portalUsersTable, rolesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

/**
 * Portal auth guard. The cookie proves identity only; role and active
 * status are re-verified against the database on EVERY request so that
 * deactivations and role changes take effect immediately (not after the
 * cookie expires).
 */
export async function requirePortalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.portalSession) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const [row] = await db
    .select({ user: portalUsersTable, role: rolesTable })
    .from(portalUsersTable)
    .innerJoin(rolesTable, eq(portalUsersTable.roleId, rolesTable.id))
    .where(eq(portalUsersTable.id, req.portalSession.userId));

  if (!row || !row.user.isActive) {
    res.status(401).json({ error: "This account is disabled. Contact your account administrator." });
    return;
  }
  // Sync live values from DB over whatever the cookie says.
  req.portalSession.roleKey = row.role.key;
  req.portalSession.roleLabel = row.role.label;
  req.portalSession.mustChangePassword = row.user.mustChangePassword;
  req.portalSession.hubspotCompanyId = row.user.hubspotCompanyId;
  req.portalSession.hubspotContactId = row.user.hubspotContactId;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.portalSession) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.portalSession.roleKey)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
