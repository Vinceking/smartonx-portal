import { Router } from "express";
import { db } from "@workspace/db";
import {
  locationRequestsTable, hsCompaniesTable, portalUsersTable,
  hsContactsTable, hsContactEmailsTable,
} from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth";
import * as hs from "../../lib/hubspot";
import * as mailer from "../../lib/mailer";

const router = Router();
router.use(requireAdminAuth);

// GET /api/admin/location-requests
router.get("/", async (req, res) => {
  const { status = "pending" } = req.query as { status?: string };
  const conditions = status !== "all" ? [eq(locationRequestsTable.status, status)] : [];
  const requests = await db
    .select()
    .from(locationRequestsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(locationRequestsTable.createdAt));

  // Enrich with org names
  const orgIds = [...new Set(requests.map((r) => r.hubspotCompanyId))];
  const orgs = orgIds.length > 0
    ? await db.select({ id: hsCompaniesTable.id, name: hsCompaniesTable.name }).from(hsCompaniesTable) : [];
  const orgMap = Object.fromEntries(orgs.map((o) => [o.id, o.name]));

  const [userRows] = await Promise.all([
    db.select({ id: portalUsersTable.id, username: portalUsersTable.username }).from(portalUsersTable),
  ]);
  const userMap = Object.fromEntries(userRows.map((u) => [u.id, u.username]));

  res.json(requests.map((r) => ({
    ...r,
    orgName: orgMap[r.hubspotCompanyId] ?? r.hubspotCompanyId,
    requestedByUsername: userMap[r.requestedByUserId] ?? "",
  })));
});

// POST /api/admin/location-requests/:id/approve
router.post("/:id/approve", async (req, res) => {
  const reqId = parseInt(req.params.id!);
  const { billingProfileId, isDefault } = req.body as { billingProfileId?: string; isDefault?: boolean };
  if (!billingProfileId) { res.status(400).json({ error: "billingProfileId required" }); return; }

  const [request] = await db.select().from(locationRequestsTable).where(eq(locationRequestsTable.id, reqId));
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }
  if (request.status !== "pending") { res.status(400).json({ error: "Not pending" }); return; }

  await hs.createLocation(request.hubspotCompanyId, {
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

  await db.update(locationRequestsTable).set({ status: "approved", resolvedAt: new Date() }).where(eq(locationRequestsTable.id, reqId));

  // Notify user
  try {
    const [user] = await db.select().from(portalUsersTable).where(eq(portalUsersTable.id, request.requestedByUserId));
    if (user) {
      const [contact] = await db.select().from(hsContactsTable).where(eq(hsContactsTable.id, user.hubspotContactId));
      const [email] = await db.select().from(hsContactEmailsTable).where(and(eq(hsContactEmailsTable.contactId, user.hubspotContactId), eq(hsContactEmailsTable.isPrimary, true)));
      if (contact && email) {
        await mailer.sendLocationRequestResult({ to: email.email, firstName: contact.firstName, locationNickname: request.nickname, approved: true });
      }
    }
  } catch { /* non-fatal */ }

  res.json({ ok: true });
});

// POST /api/admin/location-requests/:id/reject
router.post("/:id/reject", async (req, res) => {
  const reqId = parseInt(req.params.id!);
  const { reason } = req.body as { reason?: string };
  const [request] = await db.select().from(locationRequestsTable).where(eq(locationRequestsTable.id, reqId));
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }

  await db.update(locationRequestsTable).set({ status: "rejected", resolvedAt: new Date() }).where(eq(locationRequestsTable.id, reqId));

  // Notify user
  try {
    const [user] = await db.select().from(portalUsersTable).where(eq(portalUsersTable.id, request.requestedByUserId));
    if (user) {
      const [contact] = await db.select().from(hsContactsTable).where(eq(hsContactsTable.id, user.hubspotContactId));
      const [email] = await db.select().from(hsContactEmailsTable).where(and(eq(hsContactEmailsTable.contactId, user.hubspotContactId), eq(hsContactEmailsTable.isPrimary, true)));
      if (contact && email) {
        await mailer.sendLocationRequestResult({ to: email.email, firstName: contact.firstName, locationNickname: request.nickname, approved: false, reason });
      }
    }
  } catch { /* non-fatal */ }

  res.json({ ok: true });
});

export default router;
