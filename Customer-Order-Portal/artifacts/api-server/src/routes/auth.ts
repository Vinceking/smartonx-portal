import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  portalUsersTable, rolesTable, passwordResetTokensTable,
  hsContactEmailsTable, hsContactsTable,
} from "@workspace/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { setPortalSession, clearPortalSession, type PortalSession } from "../lib/session";
import { requirePortalAuth } from "../middlewares/requirePortalAuth";
import * as mailer from "../lib/mailer";

const router = Router();

/** Password policy: >=10 chars, at least one letter and one number. */
function passwordPolicyError(pw: string): string | null {
  if (pw.length < 10) return "Password must be at least 10 characters";
  if (!/[A-Za-z]/.test(pw)) return "Password must contain at least one letter";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number";
  return null;
}

/**
 * Resolve a login identifier to a portal user.
 * If it contains "@", treat it as an email and resolve through
 * hs_contact_emails (ANY alias works — this is the identity-resolution
 * feature). Otherwise match on username.
 */
async function findUserByIdentifier(identifier: string) {
  const input = identifier.toLowerCase().trim();
  if (input.includes("@")) {
    const [emailRow] = await db
      .select({ contactId: hsContactEmailsTable.contactId })
      .from(hsContactEmailsTable)
      .where(eq(hsContactEmailsTable.email, input));
    if (!emailRow) return undefined;
    const [row] = await db
      .select({ user: portalUsersTable, role: rolesTable })
      .from(portalUsersTable)
      .innerJoin(rolesTable, eq(portalUsersTable.roleId, rolesTable.id))
      .where(eq(portalUsersTable.hubspotContactId, emailRow.contactId));
    return row;
  }
  const [row] = await db
    .select({ user: portalUsersTable, role: rolesTable })
    .from(portalUsersTable)
    .innerJoin(rolesTable, eq(portalUsersTable.roleId, rolesTable.id))
    .where(eq(portalUsersTable.username, input));
  return row;
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  // Accept the OpenAPI field name (usernameOrEmail); tolerate legacy `username`.
  const body = req.body as { usernameOrEmail?: string; username?: string; password?: string };
  const identifier = body.usernameOrEmail ?? body.username;
  const password = body.password;
  if (!identifier || !password) {
    res.status(400).json({ error: "Username/email and password are required" });
    return;
  }

  const row = await findUserByIdentifier(identifier);
  if (!row || !row.user.isActive) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, row.user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  await db.update(portalUsersTable).set({ lastLoginAt: new Date() }).where(eq(portalUsersTable.id, row.user.id));

  const [contact] = await db
    .select({ firstName: hsContactsTable.firstName, lastName: hsContactsTable.lastName })
    .from(hsContactsTable)
    .where(eq(hsContactsTable.id, row.user.hubspotContactId));

  // Session cookie carries identity ONLY — no CRM payload (cookies cap ~4KB).
  // Role/active status are re-verified from the DB on every request in
  // requirePortalAuth, so deactivation and role changes take effect immediately.
  const session: PortalSession = {
    userId: row.user.id,
    roleKey: row.role.key,
    roleLabel: row.role.label,
    username: row.user.username,
    firstName: contact?.firstName ?? "",
    lastName: contact?.lastName ?? "",
    hubspotCompanyId: row.user.hubspotCompanyId,
    hubspotContactId: row.user.hubspotContactId,
    mustChangePassword: row.user.mustChangePassword,
  };
  setPortalSession(res, session);
  res.json(session);
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  clearPortalSession(res);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", requirePortalAuth, (req, res) => {
  res.json(req.portalSession!);
});

// POST /api/auth/forgot-username
router.post("/forgot-username", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  const [emailRow] = await db
    .select({ contactId: hsContactEmailsTable.contactId, email: hsContactEmailsTable.email })
    .from(hsContactEmailsTable)
    .where(eq(hsContactEmailsTable.email, email.toLowerCase().trim()));

  if (emailRow) {
    const [user] = await db
      .select()
      .from(portalUsersTable)
      .where(eq(portalUsersTable.hubspotContactId, emailRow.contactId));
    const [contact] = await db
      .select()
      .from(hsContactsTable)
      .where(eq(hsContactsTable.id, emailRow.contactId));
    if (user && contact) {
      await mailer.sendForgotUsername({ to: email, firstName: contact.firstName, username: user.username });
    }
  }
  // Always return 200 to avoid user enumeration
  res.json({ ok: true });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { usernameOrEmail } = req.body as { usernameOrEmail?: string };
  if (!usernameOrEmail) { res.status(400).json({ error: "Username or email required" }); return; }

  const row = await findUserByIdentifier(usernameOrEmail);
  const user = row?.user;

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.insert(passwordResetTokensTable).values({ portalUserId: user.id, token, expiresAt });

    const [contact] = await db.select().from(hsContactsTable).where(eq(hsContactsTable.id, user.hubspotContactId));
    const [primaryEmail] = await db
      .select()
      .from(hsContactEmailsTable)
      .where(and(eq(hsContactEmailsTable.contactId, user.hubspotContactId), eq(hsContactEmailsTable.isPrimary, true)));
    if (contact && primaryEmail) {
      await mailer.sendPasswordReset({ to: primaryEmail.email, firstName: contact.firstName, token });
    }
  }
  res.json({ ok: true });
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body as {
    token?: string; newPassword?: string; confirmPassword?: string;
  };
  if (!token || !newPassword || !confirmPassword) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }
  const policyError = passwordPolicyError(newPassword);
  if (policyError) { res.status(400).json({ error: policyError }); return; }

  const [tokenRow] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(and(
      eq(passwordResetTokensTable.token, token),
      isNull(passwordResetTokensTable.usedAt),
      gt(passwordResetTokensTable.expiresAt, new Date()),
    ));
  if (!tokenRow) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }
  const hash = await bcrypt.hash(newPassword, 12);
  await db.update(portalUsersTable)
    .set({ passwordHash: hash, mustChangePassword: false })
    .where(eq(portalUsersTable.id, tokenRow.portalUserId));
  await db.update(passwordResetTokensTable)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokensTable.id, tokenRow.id));
  clearPortalSession(res);
  res.json({ ok: true });
});

// POST /api/auth/change-password
router.post("/change-password", requirePortalAuth, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body as {
    currentPassword?: string; newPassword?: string; confirmPassword?: string;
  };
  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }
  const policyError = passwordPolicyError(newPassword);
  if (policyError) { res.status(400).json({ error: policyError }); return; }

  const [user] = await db.select().from(portalUsersTable).where(eq(portalUsersTable.id, req.portalSession!.userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) { res.status(400).json({ error: "Current password is incorrect" }); return; }
  const hash = await bcrypt.hash(newPassword, 12);
  await db.update(portalUsersTable)
    .set({ passwordHash: hash, mustChangePassword: false })
    .where(eq(portalUsersTable.id, user.id));
  const newSession = { ...req.portalSession!, mustChangePassword: false };
  setPortalSession(res, newSession);
  res.json({ ok: true });
});

export default router;
