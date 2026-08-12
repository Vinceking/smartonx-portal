import { Router } from "express";
import { db } from "@workspace/db";
import {
  locationRequestsTable, hsCompaniesTable, portalUsersTable,
} from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requirePortalAuth } from "../../middlewares/requirePortalAuth";
import * as mailer from "../../lib/mailer";

const router = Router();
router.use(requirePortalAuth);

// GET /api/portal/location-requests
router.get("/", async (req, res) => {
  const session = req.portalSession!;
  const conditions = [eq(locationRequestsTable.hubspotCompanyId, session.hubspotCompanyId)];
  if (session.roleKey === "purchaser") {
    conditions.push(eq(locationRequestsTable.requestedByUserId, session.userId));
  }
  const requests = await db
    .select()
    .from(locationRequestsTable)
    .where(and(...conditions))
    .orderBy(desc(locationRequestsTable.createdAt));
  res.json(requests);
});

// POST /api/portal/location-requests
router.post("/", async (req, res) => {
  const session = req.portalSession!;
  const { nickname, address1, address2, city, state, zip, phone, placeId } = req.body as {
    nickname?: string; address1?: string; address2?: string; city?: string;
    state?: string; zip?: string; phone?: string; placeId?: string;
  };
  if (!nickname || !address1 || !city || !state || !zip) {
    res.status(400).json({ error: "Missing required location fields" });
    return;
  }
  if (state.length !== 2) {
    res.status(400).json({ error: "State must be a 2-character abbreviation" });
    return;
  }
  const [request] = await db.insert(locationRequestsTable).values({
    hubspotCompanyId: session.hubspotCompanyId,
    requestedByUserId: session.userId,
    nickname, address1, address2: address2 ?? null, city, state, zip,
    phone: phone ?? null, validated: !!placeId, placeId: placeId ?? null, status: "pending",
  }).returning();

  // Notify admins (best effort)
  try {
    const [company] = await db.select({ name: hsCompaniesTable.name })
      .from(hsCompaniesTable).where(eq(hsCompaniesTable.id, session.hubspotCompanyId));
    await mailer.sendLocationRequestNotification({
      to: "rachelle@smartonx.com",
      orgName: company?.name ?? session.hubspotCompanyId,
      locationNickname: nickname,
      requestedBy: session.username,
    });
  } catch { /* non-fatal */ }

  res.status(201).json(request);
});

export default router;
