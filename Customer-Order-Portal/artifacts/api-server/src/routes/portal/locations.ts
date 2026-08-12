import { Router } from "express";
import { db } from "@workspace/db";
import { userLocationAccessTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requirePortalAuth } from "../../middlewares/requirePortalAuth";
import * as hs from "../../lib/hubspot";

const router = Router();
router.use(requirePortalAuth);

// GET /api/portal/locations
router.get("/", async (req, res) => {
  const session = req.portalSession!;
  const allLocations = await hs.getLocations(session.hubspotCompanyId);
  if (session.roleKey === "org_admin") {
    res.json(allLocations);
    return;
  }
  const access = await db
    .select({ hubspotLocationId: userLocationAccessTable.hubspotLocationId })
    .from(userLocationAccessTable)
    .where(eq(userLocationAccessTable.portalUserId, session.userId));
  const accessIds = new Set(access.map((a) => a.hubspotLocationId));
  res.json(allLocations.filter((l) => accessIds.has(l.id)));
});

export default router;
