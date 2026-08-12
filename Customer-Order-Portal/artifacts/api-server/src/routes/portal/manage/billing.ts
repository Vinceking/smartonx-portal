import { Router } from "express";
import { requirePortalAuth, requireRole } from "../../../middlewares/requirePortalAuth";
import * as hs from "../../../lib/hubspot";

const router = Router();
router.use(requirePortalAuth, requireRole("org_admin"));

// GET /api/portal/manage/billing
router.get("/", async (req, res) => {
  const session = req.portalSession!;
  const profiles = await hs.getBillingProfiles(session.hubspotCompanyId);
  res.json({ profiles });
});

// POST /api/portal/manage/billing/new  (create new billing profile)
router.post("/new", async (req, res) => {
  const session = req.portalSession!;
  const { name, address1, address2, city, state, zip, apEmail, apPhone, paymentTerms, netDays, isDefault, placeId } = req.body as {
    name?: string; address1?: string; address2?: string; city?: string; state?: string; zip?: string;
    apEmail?: string; apPhone?: string; paymentTerms?: string; netDays?: number; isDefault?: boolean; placeId?: string;
  };
  if (!name || !address1 || !city || !state || !zip || !apEmail || !paymentTerms) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const bp = await hs.createBillingProfile(session.hubspotCompanyId, {
    name, address1, address2, city, state, zip, apEmail, apPhone, paymentTerms, netDays, isDefault, placeId,
  });
  res.status(201).json(bp);
});

// PATCH /api/portal/manage/billing/:id
router.patch("/:id", async (req, res) => {
  const session = req.portalSession!;
  const bp = await hs.updateBillingProfile(req.params.id!, session.hubspotCompanyId, req.body);
  res.json(bp);
});

export default router;
