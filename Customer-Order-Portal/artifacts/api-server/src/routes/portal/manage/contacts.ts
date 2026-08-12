import { Router } from "express";
import { db } from "@workspace/db";
import { hsContactEmailsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requirePortalAuth, requireRole } from "../../../middlewares/requirePortalAuth";
import * as hs from "../../../lib/hubspot";

const router = Router();
router.use(requirePortalAuth, requireRole("org_admin", "regional_admin"));

// GET /api/portal/manage/contacts
router.get("/", async (req, res) => {
  const session = req.portalSession!;
  const contacts = await hs.getContacts(session.hubspotCompanyId);
  res.json(contacts);
});

// POST /api/portal/manage/contacts
router.post("/", requireRole("org_admin"), async (req, res) => {
  const session = req.portalSession!;
  const { firstName, lastName, roleTitle, email } = req.body as {
    firstName?: string; lastName?: string; roleTitle?: string; email?: string;
  };
  if (!firstName || !lastName || !roleTitle || !email) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
  const [existing] = await db.select().from(hsContactEmailsTable)
    .where(eq(hsContactEmailsTable.email, email.toLowerCase().trim()));
  if (existing) { res.status(409).json({ error: "Email already in use" }); return; }
  const contact = await hs.createContact(session.hubspotCompanyId, {
    firstName, lastName, roleTitle, email: email.toLowerCase().trim(),
  });
  res.status(201).json(contact);
});

// PATCH /api/portal/manage/contacts/:id
router.patch("/:id", requireRole("org_admin"), async (req, res) => {
  const session = req.portalSession!;
  const { firstName, lastName, roleTitle, isActive } = req.body as Partial<{
    firstName: string; lastName: string; roleTitle: string; isActive: boolean;
  }>;
  const contact = await hs.updateContact(String(req.params.id), session.hubspotCompanyId, {
    firstName, lastName, roleTitle, isActive,
  });
  res.json(contact);
});

// POST /api/portal/manage/contacts/:id/emails  (add alias email)
router.post("/:id/emails", requireRole("org_admin"), async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email required" }); return; }
  const [existing] = await db.select().from(hsContactEmailsTable)
    .where(eq(hsContactEmailsTable.email, email.toLowerCase().trim()));
  if (existing) { res.status(409).json({ error: "Email already in use" }); return; }
  await hs.addContactEmail(String(req.params.id), email.toLowerCase().trim());
  res.json({ ok: true });
});

export default router;
