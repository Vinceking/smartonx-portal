import { Router } from "express";
import { db } from "@workspace/db";
import {
  hsContactEmailsTable, hsContactsTable, hsCompaniesTable, hsLocationsTable,
  portalUsersTable, rolesTable,
} from "@workspace/db/schema";
import { eq, ilike } from "drizzle-orm";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth";

const router = Router();
router.use(requireAdminAuth);

// GET /api/admin/identity?email=...
router.get("/", async (req, res) => {
  const { email } = req.query as { email?: string };
  if (!email) { res.status(400).json({ error: "Email required" }); return; }

  // Exact match
  const [emailRow] = await db.select().from(hsContactEmailsTable)
    .where(eq(hsContactEmailsTable.email, email.toLowerCase().trim()));

  if (!emailRow) {
    // Near matches (partial)
    const nearEmails = await db.select().from(hsContactEmailsTable)
      .where(ilike(hsContactEmailsTable.email, `%${email.split("@")[0]}%`))
      .limit(5);
    res.json({ found: false, nearMatches: nearEmails.map((e) => ({ email: e.email, contactId: e.contactId })) });
    return;
  }

  const [contact] = await db.select().from(hsContactsTable).where(eq(hsContactsTable.id, emailRow.contactId));
  if (!contact) { res.json({ found: false, nearMatches: [] }); return; }

  const [company] = await db.select().from(hsCompaniesTable).where(eq(hsCompaniesTable.id, contact.companyId));
  const locations = await db.select().from(hsLocationsTable).where(eq(hsLocationsTable.companyId, contact.companyId));
  const allEmails = await db.select().from(hsContactEmailsTable).where(eq(hsContactEmailsTable.contactId, contact.id));

  const [portalRow] = await db
    .select({ user: portalUsersTable, role: rolesTable })
    .from(portalUsersTable)
    .innerJoin(rolesTable, eq(portalUsersTable.roleId, rolesTable.id))
    .where(eq(portalUsersTable.hubspotContactId, contact.id));

  res.json({
    found: true,
    matchedEmail: emailRow.email,
    contact: { ...contact, emails: allEmails },
    company,
    locations,
    portalUser: portalRow
      ? {
          id: portalRow.user.id,
          username: portalRow.user.username,
          roleKey: portalRow.role.key,
          roleLabel: portalRow.role.label,
          isActive: portalRow.user.isActive,
          mustChangePassword: portalRow.user.mustChangePassword,
          lastLoginAt: portalRow.user.lastLoginAt,
        }
      : null,
  });
});

export default router;
