import { Router } from "express";
import { requirePortalAuth, requireRole } from "../../../middlewares/requirePortalAuth";
import * as hs from "../../../lib/hubspot";

const router = Router();
router.use(requirePortalAuth, requireRole("org_admin"));

// GET /api/portal/manage/locations
router.get("/", async (req, res) => {
  const session = req.portalSession!;
  const locations = await hs.getLocations(session.hubspotCompanyId);
  res.json(locations);
});

// POST /api/portal/manage/locations
router.post("/", async (req, res) => {
  const session = req.portalSession!;
  const { billingProfileId, nickname, address1, address2, city, state, zip, phone, isDefault, placeId } = req.body as {
    billingProfileId?: string; nickname?: string; address1?: string; address2?: string;
    city?: string; state?: string; zip?: string; phone?: string; isDefault?: boolean; placeId?: string;
  };
  if (!billingProfileId || !nickname || !address1 || !city || !state || !zip) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const location = await hs.createLocation(session.hubspotCompanyId, {
    billingProfileId, nickname, address1, address2, city, state, zip, phone, isDefault, placeId,
  });
  res.status(201).json(location);
});

// PATCH /api/portal/manage/locations/:id
router.patch("/:id", async (req, res) => {
  const session = req.portalSession!;
  const location = await hs.updateLocation(req.params.id!, session.hubspotCompanyId, req.body);
  res.json(location);
});

export default router;
