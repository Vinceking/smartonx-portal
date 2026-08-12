import { Router } from "express";
import { db } from "@workspace/db";
import { userLocationAccessTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requirePortalAuth } from "../middlewares/requirePortalAuth";
import * as hs from "../lib/hubspot";

const router = Router();
router.use(requirePortalAuth);

// GET /api/crm/company
router.get("/company", async (req, res) => {
  const company = await hs.getCompany(req.portalSession!.hubspotCompanyId);
  if (!company) { res.status(404).json({ error: "Company not found" }); return; }
  res.json(company);
});

// GET /api/crm/locations
router.get("/locations", async (req, res) => {
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

// GET /api/crm/billing-profiles
router.get("/billing-profiles", async (req, res) => {
  const profiles = await hs.getBillingProfiles(req.portalSession!.hubspotCompanyId);
  res.json(profiles);
});

// GET /api/crm/contacts
router.get("/contacts", async (req, res) => {
  const contacts = await hs.getContacts(req.portalSession!.hubspotCompanyId);
  res.json(contacts);
});

// POST /api/crm/refresh  (invalidate CRM cache for this session)
router.post("/refresh", async (req, res) => {
  const session = req.portalSession!;
  // CRM reads always hit the (mock) HubSpot store live, so there is no
  // server-side cache to bust. This endpoint simply confirms fresh data.
  // NOTE: it must never touch the session cookie — clearing it here would
  // log the user out.
  const [contact, company] = await Promise.all([
    hs.getContact(session.hubspotContactId),
    hs.getCompany(session.hubspotCompanyId),
  ]);
  res.json({
    ok: true,
    company: company?.name,
    contactName: contact ? `${contact.firstName} ${contact.lastName}` : null,
  });
});

export default router;
