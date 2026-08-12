import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  portalUsersTable, rolesTable, userLocationAccessTable, hsContactsTable, hsContactEmailsTable,
  hsLocationsTable,
} from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requirePortalAuth, requireRole } from "../../../middlewares/requirePortalAuth";
import * as mailer from "../../../lib/mailer";

const router = Router();
router.use(requirePortalAuth, requireRole("org_admin", "regional_admin"));

/** Every granted location id must belong to the session's organization. */
async function validateOrgLocationIds(companyId: string, locationIds: string[]): Promise<boolean> {
  if (locationIds.length === 0) return true;
  const orgLocs = await db.select({ id: hsLocationsTable.id })
    .from(hsLocationsTable).where(eq(hsLocationsTable.companyId, companyId));
  const orgSet = new Set(orgLocs.map((l) => l.id));
  return locationIds.every((id) => orgSet.has(id));
}

// GET /api/portal/manage/team
router.get("/", async (req, res) => {
  const session = req.portalSession!;
  const rows = await db
    .select({ user: portalUsersTable, role: rolesTable })
    .from(portalUsersTable)
    .innerJoin(rolesTable, eq(portalUsersTable.roleId, rolesTable.id))
    .where(eq(portalUsersTable.hubspotCompanyId, session.hubspotCompanyId));

  const result = await Promise.all(rows.map(async (r) => {
    const access = await db
      .select({ hubspotLocationId: userLocationAccessTable.hubspotLocationId })
      .from(userLocationAccessTable)
      .where(eq(userLocationAccessTable.portalUserId, r.user.id));
    const [contact] = await db.select().from(hsContactsTable)
      .where(eq(hsContactsTable.id, r.user.hubspotContactId));
    return {
      id: r.user.id,
      username: r.user.username,
      roleKey: r.role.key,
      roleLabel: r.role.label,
      isActive: r.user.isActive,
      mustChangePassword: r.user.mustChangePassword,
      lastLoginAt: r.user.lastLoginAt,
      hubspotContactId: r.user.hubspotContactId,
      firstName: contact?.firstName,
      lastName: contact?.lastName,
      roleTitle: contact?.roleTitle,
      locationAccess: access.map((a) => a.hubspotLocationId),
      locationAccessCount: access.length,
    };
  }));
  res.json(result);
});

// POST /api/portal/manage/team/users
router.post("/users", requireRole("org_admin"), async (req, res) => {
  const session = req.portalSession!;
  const { hubspotContactId, username, roleKey, locationAccess } = req.body as {
    hubspotContactId?: string; username?: string; roleKey?: string; locationAccess?: string[];
  };
  if (!hubspotContactId || !username || !roleKey) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [contact] = await db.select().from(hsContactsTable)
    .where(and(eq(hsContactsTable.id, hubspotContactId), eq(hsContactsTable.companyId, session.hubspotCompanyId)));
  if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }

  const [existing] = await db.select({ id: portalUsersTable.id }).from(portalUsersTable)
    .where(eq(portalUsersTable.username, username.toLowerCase().trim()));
  if (existing) { res.status(409).json({ error: "Username already taken" }); return; }

  const [role] = await db.select().from(rolesTable).where(eq(rolesTable.key, roleKey));
  if (!role) { res.status(400).json({ error: "Invalid role" }); return; }

  const tempPassword = `Temp${crypto.randomBytes(4).toString("hex")}!`;
  const hash = await bcrypt.hash(tempPassword, 12);

  const [user] = await db.insert(portalUsersTable).values({
    hubspotContactId,
    hubspotCompanyId: session.hubspotCompanyId,
    username: username.toLowerCase().trim(),
    passwordHash: hash,
    roleId: role.id,
    mustChangePassword: true,
    isActive: true,
  }).returning();

  if (roleKey !== "org_admin" && locationAccess?.length) {
    if (!(await validateOrgLocationIds(session.hubspotCompanyId, locationAccess))) {
      res.status(403).json({ error: "One or more locations do not belong to your organization" });
      return;
    }
    await db.insert(userLocationAccessTable).values(
      locationAccess.map((locId) => ({ portalUserId: user!.id, hubspotLocationId: locId, canOrder: true })),
    );
  }

  try {
    const [primaryEmail] = await db.select().from(hsContactEmailsTable)
      .where(and(eq(hsContactEmailsTable.contactId, hubspotContactId), eq(hsContactEmailsTable.isPrimary, true)));
    if (primaryEmail) {
      await mailer.sendTempPassword({ to: primaryEmail.email, firstName: contact.firstName, username: user!.username, tempPassword });
    }
  } catch { /* non-fatal */ }

  res.status(201).json({ ...user, tempPassword, roleKey, roleLabel: role.label });
});

// PATCH /api/portal/manage/team/users/:id
router.patch("/users/:id", requireRole("org_admin"), async (req, res) => {
  const session = req.portalSession!;
  const userId = parseInt(String(req.params.id));
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }

  const { roleKey, isActive, locationAccess } = req.body as {
    roleKey?: string; isActive?: boolean; locationAccess?: string[];
  };
  const [target] = await db.select().from(portalUsersTable)
    .where(and(eq(portalUsersTable.id, userId), eq(portalUsersTable.hubspotCompanyId, session.hubspotCompanyId)));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  if (isActive === false && userId === session.userId) {
    res.status(400).json({ error: "You cannot deactivate your own account" });
    return;
  }
  if (locationAccess !== undefined && !(await validateOrgLocationIds(session.hubspotCompanyId, locationAccess))) {
    res.status(403).json({ error: "One or more locations do not belong to your organization" });
    return;
  }

  const updates: Partial<typeof portalUsersTable.$inferInsert> = {};
  if (roleKey !== undefined) {
    const [role] = await db.select().from(rolesTable).where(eq(rolesTable.key, roleKey));
    if (!role) { res.status(400).json({ error: "Invalid role" }); return; }
    updates.roleId = role.id;
  }
  if (isActive !== undefined) updates.isActive = isActive;
  if (Object.keys(updates).length > 0) {
    await db.update(portalUsersTable).set(updates).where(eq(portalUsersTable.id, userId));
  }
  if (locationAccess !== undefined) {
    await db.delete(userLocationAccessTable).where(eq(userLocationAccessTable.portalUserId, userId));
    if (locationAccess.length > 0) {
      await db.insert(userLocationAccessTable).values(
        locationAccess.map((locId) => ({ portalUserId: userId, hubspotLocationId: locId, canOrder: true })),
      );
    }
  }
  const [updated] = await db
    .select({ user: portalUsersTable, role: rolesTable })
    .from(portalUsersTable)
    .innerJoin(rolesTable, eq(portalUsersTable.roleId, rolesTable.id))
    .where(eq(portalUsersTable.id, userId));
  res.json({ ...updated?.user, roleKey: updated?.role.key, roleLabel: updated?.role.label });
});

// POST /api/portal/manage/team/users/:id/reset-password
router.post("/users/:id/reset-password", requireRole("org_admin"), async (req, res) => {
  const session = req.portalSession!;
  const userId = parseInt(String(req.params.id));
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }

  const [target] = await db.select().from(portalUsersTable)
    .where(and(eq(portalUsersTable.id, userId), eq(portalUsersTable.hubspotCompanyId, session.hubspotCompanyId)));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  const tempPassword = `Temp${crypto.randomBytes(4).toString("hex")}!`;
  const hash = await bcrypt.hash(tempPassword, 12);
  await db.update(portalUsersTable).set({ passwordHash: hash, mustChangePassword: true })
    .where(eq(portalUsersTable.id, userId));
  res.json({ tempPassword });
});

export default router;
