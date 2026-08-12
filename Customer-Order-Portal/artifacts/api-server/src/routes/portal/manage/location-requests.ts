import { Router } from "express";
import { db } from "@workspace/db";
import {
  locationRequestsTable, hsContactsTable, hsContactEmailsTable, portalUsersTable,
} from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requirePortalAuth, requireRole } from "../../../middlewares/requirePortalAuth";
import * as hs from "../../../lib/hubspot";
import * as mailer from "../../../lib/mailer";

const router = Router();
router.use(requirePortalAuth, requireRole("org_admin"));

// GET /api/portal/manage/location-requests
router.get("/", async (req, res) => {
  const session = req.portalSession!;
  const requests = await db
    .select()
    .from(locationRequestsTable)
    .where(eq(locationRequestsTable.hubspotCompanyId, session.hubspotCompanyId))
    .orderBy(desc(locationRequestsTable.createdAt));
  res.json(requests);
});

// POST /api/portal/manage/location-requests/:id/approve
router.post("/:id/approve", async (req, res) => {
  const session = req.portalSession!;
  const reqId = parseInt(req.params.id!);
  const { billingProfileId, isDefault } = req.body as { billingProfileId?: string; isDefault?: boolean };
  if (!billingProfileId) { res.status(400).json({ error: "billingProfileId required" }); return; }

  const [request] = await db.select().from(locationRequestsTable)
    .where(and(eq(locationRequestsTable.id, reqId), eq(locationRequestsTable.hubspotCompanyId, session.hubspotCompanyId)));
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }
  if (request.status !== "pending") { res.status(400).json({ error: "Request is not pending" }); return; }

  await hs.createLocation(session.hubspotCompanyId, {
    billingProfileId,
    nickname: request.nickname,
    address1: request.address1,
    address2: request.address2 ?? undefined,
    city: request.city,
    state: request.state,
    zip: request.zip,
    phone: request.phone ?? undefined,
    isDefault: isDefault ?? false,
    placeId: request.placeId ?? undefined,
  });

  await db.update(locationRequestsTable).set({
    status: "approved", resolvedBy: session.username, resolvedAt: new Date(),
  }).where(eq(locationRequestsTable.id, reqId));

  try {
    const [requester] = await db.select().from(portalUsersTable)
      .where(eq(portalUsersTable.id, request.requestedByUserId));
    if (requester) {
      const [contact] = await db.select().from(hsContactsTable)
        .where(eq(hsContactsTable.id, requester.hubspotContactId));
      const [email] = await db.select().from(hsContactEmailsTable)
        .where(and(eq(hsContactEmailsTable.contactId, requester.hubspotContactId), eq(hsContactEmailsTable.isPrimary, true)));
      if (contact && email) {
        await mailer.sendLocationRequestResult({ to: email.email, firstName: contact.firstName, locationNickname: request.nickname, approved: true });
      }
    }
  } catch { /* non-fatal */ }

  res.json({ ok: true });
});

// POST /api/portal/manage/location-requests/:id/reject
router.post("/:id/reject", async (req, res) => {
  const session = req.portalSession!;
  const reqId = parseInt(req.params.id!);
  const { reason } = req.body as { reason?: string };

  const [request] = await db.select().from(locationRequestsTable)
    .where(and(eq(locationRequestsTable.id, reqId), eq(locationRequestsTable.hubspotCompanyId, session.hubspotCompanyId)));
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }

  await db.update(locationRequestsTable).set({
    status: "rejected", resolvedBy: session.username, resolvedAt: new Date(),
  }).where(eq(locationRequestsTable.id, reqId));

  res.json({ ok: true });
});

export default router;
