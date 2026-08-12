import { Router } from "express";
import { db } from "@workspace/db";
import {
  hsCompaniesTable, hsBillingProfilesTable, hsLocationsTable,
  portalUsersTable, rolesTable, hsContactsTable, hsContactEmailsTable,
  ordersTable, userLocationAccessTable,
} from "@workspace/db/schema";
import { eq, ilike, sql, desc, and } from "drizzle-orm";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth";
import * as hs from "../../lib/hubspot";

const router = Router();
router.use(requireAdminAuth);

// GET /api/admin/organizations
router.get("/", async (req, res) => {
  const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;

  const companies = await db.select().from(hsCompaniesTable)
    .where(search ? ilike(hsCompaniesTable.name, `%${search}%`) : undefined)
    .limit(limitNum).offset(offset);

  const result = await Promise.all(companies.map(async (c) => {
    const [locs] = await db.select({ count: sql<number>`count(*)` }).from(hsLocationsTable).where(eq(hsLocationsTable.companyId, c.id));
    const [users] = await db.select({ count: sql<number>`count(*)` }).from(portalUsersTable).where(eq(portalUsersTable.hubspotCompanyId, c.id));
    const [orders] = await db.select({ count: sql<number>`count(*)`, rev: sql<number>`coalesce(sum(total_cents),0)` }).from(ordersTable).where(eq(ordersTable.hubspotCompanyId, c.id));
    const [bp] = await db.select().from(hsBillingProfilesTable).where(and(eq(hsBillingProfilesTable.companyId, c.id), eq(hsBillingProfilesTable.isDefault, true)));
    return {
      id: c.id,
      name: c.name,
      orgType: c.orgType,
      allowAdminBillingEdit: c.allowAdminBillingEdit,
      locationCount: Number(locs?.count ?? 0),
      userCount: Number(users?.count ?? 0),
      orderCount: Number(orders?.count ?? 0),
      lifetimeRevenueCents: Number(orders?.rev ?? 0),
      termsSummary: bp ? `${bp.paymentTerms}${bp.netDays ? ` ${bp.netDays}` : ""}` : "—",
    };
  }));

  const [total] = await db.select({ count: sql<number>`count(*)` }).from(hsCompaniesTable);
  res.json({ data: result, total: Number(total?.count ?? 0), page: pageNum, limit: limitNum });
});

// GET /api/admin/organizations/:id
router.get("/:id", async (req, res) => {
  const company = await hs.getCompany(req.params.id!);
  if (!company) { res.status(404).json({ error: "Organization not found" }); return; }

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [locs] = await db.select({ count: sql<number>`count(*)` }).from(hsLocationsTable).where(eq(hsLocationsTable.companyId, company.id));
  const [users] = await db.select({ count: sql<number>`count(*)` }).from(portalUsersTable).where(eq(portalUsersTable.hubspotCompanyId, company.id));
  const [orders] = await db.select({ count: sql<number>`count(*)`, rev: sql<number>`coalesce(sum(total_cents),0)` }).from(ordersTable).where(eq(ordersTable.hubspotCompanyId, company.id));
  const [monthOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(and(eq(ordersTable.hubspotCompanyId, company.id)));

  res.json({
    company,
    locationCount: Number(locs?.count ?? 0),
    userCount: Number(users?.count ?? 0),
    orderCount: Number(orders?.count ?? 0),
    lifetimeRevenueCents: Number(orders?.rev ?? 0),
    ordersThisMonth: Number(monthOrders?.count ?? 0),
  });
});

// PATCH /api/admin/organizations/:id
router.patch("/:id", async (req, res) => {
  const { name, orgType, allowAdminBillingEdit } = req.body as Partial<{ name: string; orgType: string; allowAdminBillingEdit: boolean }>;
  const company = await hs.updateCompany(req.params.id!, { name, orgType, allowAdminBillingEdit });
  res.json(company);
});

// GET /api/admin/organizations/:id/locations
router.get("/:id/locations", async (req, res) => {
  const locations = await hs.getLocations(req.params.id!);
  res.json(locations);
});

// POST /api/admin/organizations/:id/locations
router.post("/:id/locations", async (req, res) => {
  const { billingProfileId, nickname, address1, address2, city, state, zip, phone, isDefault, placeId } = req.body as {
    billingProfileId?: string; nickname?: string; address1?: string; address2?: string;
    city?: string; state?: string; zip?: string; phone?: string; isDefault?: boolean; placeId?: string;
  };
  if (!billingProfileId || !nickname || !address1 || !city || !state || !zip) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const loc = await hs.createLocation(req.params.id!, { billingProfileId, nickname, address1, address2, city, state, zip, phone, isDefault, placeId });
  res.status(201).json(loc);
});

// PATCH /api/admin/organizations/:id/locations/:locId
router.patch("/:id/locations/:locId", async (req, res) => {
  const loc = await hs.updateLocation(req.params.locId!, req.params.id!, req.body);
  res.json(loc);
});

// GET /api/admin/organizations/:id/billing-profiles
router.get("/:id/billing-profiles", async (req, res) => {
  const profiles = await hs.getBillingProfiles(req.params.id!);
  res.json(profiles);
});

// POST /api/admin/organizations/:id/billing-profiles
router.post("/:id/billing-profiles", async (req, res) => {
  const { name, address1, address2, city, state, zip, apEmail, apPhone, paymentTerms, netDays, isDefault, placeId } = req.body as {
    name?: string; address1?: string; city?: string; state?: string; zip?: string;
    apEmail?: string; apPhone?: string; paymentTerms?: string; netDays?: number; isDefault?: boolean;
    address2?: string; placeId?: string;
  };
  if (!name || !address1 || !city || !state || !zip || !apEmail || !paymentTerms) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const bp = await hs.createBillingProfile(req.params.id!, { name, address1, address2, city, state, zip, apEmail, apPhone, paymentTerms, netDays, isDefault, placeId });
  res.status(201).json(bp);
});

// PATCH /api/admin/organizations/:id/billing-profiles/:bpId
router.patch("/:id/billing-profiles/:bpId", async (req, res) => {
  const bp = await hs.updateBillingProfile(req.params.bpId!, req.params.id!, req.body);
  res.json(bp);
});

// DELETE /api/admin/organizations/:id/billing-profiles/:bpId
router.delete("/:id/billing-profiles/:bpId", async (req, res) => {
  // In-use guard: never delete a profile that locations still point at
  // (would otherwise surface as a raw FK 500).
  const inUse = await db.select({ id: hsLocationsTable.id })
    .from(hsLocationsTable)
    .where(and(
      eq(hsLocationsTable.companyId, req.params.id!),
      eq(hsLocationsTable.billingProfileId, req.params.bpId!),
    ));
  if (inUse.length > 0) {
    res.status(400).json({
      error: `This billing profile is used by ${inUse.length} location(s). Reassign them to another profile first.`,
    });
    return;
  }
  await hs.deleteBillingProfile(req.params.bpId!, req.params.id!);
  res.json({ ok: true });
});

// GET /api/admin/organizations/:id/users
router.get("/:id/users", async (req, res) => {
  const orgId = req.params.id!;
  const rows = await db
    .select({ user: portalUsersTable, role: rolesTable })
    .from(portalUsersTable)
    .innerJoin(rolesTable, eq(portalUsersTable.roleId, rolesTable.id))
    .where(eq(portalUsersTable.hubspotCompanyId, orgId));
  const result = await Promise.all(rows.map(async (r) => {
    const [contact] = await db.select({ firstName: hsContactsTable.firstName, lastName: hsContactsTable.lastName, roleTitle: hsContactsTable.roleTitle }).from(hsContactsTable).where(eq(hsContactsTable.id, r.user.hubspotContactId));
    const access = await db.select().from(userLocationAccessTable).where(eq(userLocationAccessTable.portalUserId, r.user.id));
    return {
      id: r.user.id,
      username: r.user.username,
      roleKey: r.role.key,
      roleLabel: r.role.label,
      isActive: r.user.isActive,
      mustChangePassword: r.user.mustChangePassword,
      lastLoginAt: r.user.lastLoginAt,
      hubspotContactId: r.user.hubspotContactId,
      firstName: contact?.firstName,
      lastName: contact?.lastName,
      roleTitle: contact?.roleTitle,
      locationAccess: [],
    };
  }));
  res.json(result);
});

// POST /api/admin/organizations/:id/users
router.post("/:id/users", async (req, res) => {
  const orgId = req.params.id!;
  const { hubspotContactId, username, roleKey } = req.body as { hubspotContactId?: string; username?: string; roleKey?: string };
  if (!hubspotContactId || !username || !roleKey) { res.status(400).json({ error: "Missing required fields" }); return; }
  const [role] = await db.select().from(rolesTable).where(eq(rolesTable.key, roleKey));
  if (!role) { res.status(400).json({ error: "Invalid role" }); return; }
  const bcryptjs = await import("bcryptjs");
  const crypto = await import("crypto");
  const tempPassword = `Temp${crypto.default.randomBytes(4).toString("hex")}!`;
  const hash = await bcryptjs.default.hash(tempPassword, 12);
  const [user] = await db.insert(portalUsersTable).values({
    hubspotContactId, hubspotCompanyId: orgId, username: username.toLowerCase().trim(),
    passwordHash: hash, roleId: role.id, mustChangePassword: true, isActive: true,
  }).returning();
  res.status(201).json({ ...user, tempPassword, roleKey, roleLabel: role.label });
});

// PATCH /api/admin/organizations/:id/users/:uid
router.patch("/:id/users/:uid", async (req, res) => {
  const { roleKey, isActive } = req.body as { roleKey?: string; isActive?: boolean };
  const uid = parseInt(req.params.uid!);
  const updates: Record<string, unknown> = {};
  if (roleKey) {
    const [role] = await db.select().from(rolesTable).where(eq(rolesTable.key, roleKey));
    if (role) updates.roleId = role.id;
  }
  if (isActive !== undefined) updates.isActive = isActive;
  const [user] = await db.update(portalUsersTable).set(updates as any).where(eq(portalUsersTable.id, uid)).returning();
  res.json(user);
});

// POST /api/admin/organizations/:id/users/:uid/reset-password
router.post("/:id/users/:uid/reset-password", async (req, res) => {
  const uid = parseInt(req.params.uid!);
  const bcryptjs = await import("bcryptjs");
  const crypto = await import("crypto");
  const tempPassword = `Temp${crypto.default.randomBytes(4).toString("hex")}!`;
  const hash = await bcryptjs.default.hash(tempPassword, 12);
  await db.update(portalUsersTable).set({ passwordHash: hash, mustChangePassword: true }).where(eq(portalUsersTable.id, uid));
  res.json({ tempPassword });
});

// GET /api/admin/organizations/:id/contacts
router.get("/:id/contacts", async (req, res) => {
  const contacts = await hs.getContacts(req.params.id!);
  res.json(contacts);
});

// POST /api/admin/organizations/:id/contacts
router.post("/:id/contacts", async (req, res) => {
  const { firstName, lastName, roleTitle, email } = req.body as { firstName?: string; lastName?: string; roleTitle?: string; email?: string };
  if (!firstName || !lastName || !roleTitle || !email) { res.status(400).json({ error: "All fields required" }); return; }
  const contact = await hs.createContact(req.params.id!, { firstName, lastName, roleTitle, email });
  res.status(201).json(contact);
});

// PATCH /api/admin/organizations/:id/contacts/:cid
router.patch("/:id/contacts/:cid", async (req, res) => {
  const contact = await hs.updateContact(req.params.cid!, req.params.id!, req.body);
  res.json(contact);
});

// POST /api/admin/organizations/:id/contacts/:cid/emails
router.post("/:id/contacts/:cid/emails", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "Email required" }); return; }
  await hs.addContactEmail(req.params.cid!, email);
  res.json({ ok: true });
});

// GET /api/admin/organizations/:id/orders
router.get("/:id/orders", async (req, res) => {
  const orgId = req.params.id!;
  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.hubspotCompanyId, orgId))
    .orderBy(desc(ordersTable.orderedAt));
  res.json({ data: orders, total: orders.length });
});

export default router;
