import { Router } from "express";
import { db } from "@workspace/db";
import { hsContactEmailsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePortalAuth } from "../../middlewares/requirePortalAuth";
import * as hs from "../../lib/hubspot";

const router = Router();
router.use(requirePortalAuth);

// GET /api/portal/account
router.get("/", async (req, res) => {
  const session = req.portalSession!;
  const contact = await hs.getContact(session.hubspotContactId);
  res.json({
    userId: session.userId,
    username: session.username,
    roleKey: session.roleKey,
    roleLabel: session.roleLabel,
    mustChangePassword: session.mustChangePassword,
    firstName: contact?.firstName ?? session.firstName,
    lastName: contact?.lastName ?? session.lastName,
    roleTitle: contact?.roleTitle ?? "",
    emails: contact?.emails ?? [],
  });
});

// POST /api/portal/account/emails  (add alias email)
router.post("/emails", async (req, res) => {
  const session = req.portalSession!;
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }
  const [existing] = await db
    .select()
    .from(hsContactEmailsTable)
    .where(eq(hsContactEmailsTable.email, email.toLowerCase().trim()));
  if (existing) { res.status(409).json({ error: "Email already in use" }); return; }
  await hs.addContactEmail(session.hubspotContactId, email.toLowerCase().trim());
  res.json({ ok: true });
});

export default router;
