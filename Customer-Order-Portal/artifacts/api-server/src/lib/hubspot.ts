/**
 * HubSpot Mock Service — reads/writes from hs_* tables and logs to integration_log.
 * In production this would call the real HubSpot API.
 */
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  hsCompaniesTable, hsBillingProfilesTable, hsLocationsTable,
  hsContactsTable, hsContactEmailsTable, integrationLogTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

async function log(
  orderId: number | null,
  system: string,
  operation: string,
  payload: unknown,
  result: unknown,
) {
  await db.insert(integrationLogTable).values({
    orderId: orderId ?? undefined,
    system,
    operation,
    direction: "outbound",
    payloadJson: payload as Record<string, unknown>,
    resultJson: result as Record<string, unknown>,
  });
}

// ─── Company ──────────────────────────────────────────────────────────────────

export async function getCompany(companyId: string) {
  const [company] = await db.select().from(hsCompaniesTable).where(eq(hsCompaniesTable.id, companyId));
  return company ?? null;
}

export async function createCompany(data: {
  name: string; orgType: string; allowAdminBillingEdit?: boolean;
}) {
  const id = newId("co");
  const [company] = await db.insert(hsCompaniesTable).values({ id, ...data }).returning();
  await log(null, "hubspot", "createCompany", data, { id });
  return company!;
}

export async function updateCompany(companyId: string, data: Partial<{
  name: string; orgType: string; allowAdminBillingEdit: boolean;
}>) {
  const [company] = await db
    .update(hsCompaniesTable).set(data).where(eq(hsCompaniesTable.id, companyId)).returning();
  await log(null, "hubspot", "updateCompany", { companyId, data }, { id: companyId });
  return company!;
}

// ─── Billing Profiles ─────────────────────────────────────────────────────────

export async function getBillingProfiles(companyId: string) {
  const profiles = await db
    .select().from(hsBillingProfilesTable)
    .where(eq(hsBillingProfilesTable.companyId, companyId));

  // Attach usedByLocationCount
  const locations = await db
    .select().from(hsLocationsTable).where(eq(hsLocationsTable.companyId, companyId));

  return profiles.map((bp) => ({
    ...bp,
    usedByLocationCount: locations.filter((l) => l.billingProfileId === bp.id).length,
  }));
}

export async function createBillingProfile(companyId: string, data: {
  name: string; address1: string; address2?: string; city: string; state: string; zip: string;
  apEmail: string; apPhone?: string; paymentTerms: string; netDays?: number;
  isDefault?: boolean; placeId?: string;
}) {
  const id = newId("bp");
  if (data.isDefault) {
    await db.update(hsBillingProfilesTable)
      .set({ isDefault: false }).where(eq(hsBillingProfilesTable.companyId, companyId));
  }
  const [bp] = await db.insert(hsBillingProfilesTable)
    .values({ id, companyId, validated: true, ...data }).returning();
  await log(null, "hubspot", "createBillingProfile", { companyId, ...data }, { id });
  return bp!;
}

export async function updateBillingProfile(bpId: string, companyId: string, data: Partial<{
  name: string; address1: string; address2: string; city: string; state: string; zip: string;
  apEmail: string; apPhone: string; paymentTerms: string; netDays: number; isDefault: boolean;
}>) {
  if (data.isDefault) {
    await db.update(hsBillingProfilesTable)
      .set({ isDefault: false }).where(eq(hsBillingProfilesTable.companyId, companyId));
  }
  const [bp] = await db.update(hsBillingProfilesTable)
    .set(data).where(and(eq(hsBillingProfilesTable.id, bpId), eq(hsBillingProfilesTable.companyId, companyId)))
    .returning();
  await log(null, "hubspot", "updateBillingProfile", { bpId, data }, { id: bpId });
  return bp!;
}

export async function deleteBillingProfile(bpId: string, companyId: string) {
  await db.delete(hsBillingProfilesTable)
    .where(and(eq(hsBillingProfilesTable.id, bpId), eq(hsBillingProfilesTable.companyId, companyId)));
  await log(null, "hubspot", "deleteBillingProfile", { bpId, companyId }, { deleted: true });
}

// ─── Locations ────────────────────────────────────────────────────────────────

async function attachBillingToLocations(locations: (typeof hsLocationsTable.$inferSelect)[]) {
  if (locations.length === 0) return [];
  const bpIds = [...new Set(locations.map((l) => l.billingProfileId))];
  const billingProfiles = await db
    .select().from(hsBillingProfilesTable)
    .where(eq(hsBillingProfilesTable.companyId, locations[0]!.companyId));
  const bpMap = Object.fromEntries(billingProfiles.map((bp) => [bp.id, bp]));
  return locations.map((l) => ({ ...l, billingProfile: bpMap[l.billingProfileId] ?? null }));
}

export async function getLocations(companyId: string) {
  const locations = await db
    .select().from(hsLocationsTable).where(eq(hsLocationsTable.companyId, companyId));
  return attachBillingToLocations(locations);
}

export async function getLocation(locationId: string) {
  const [loc] = await db.select().from(hsLocationsTable).where(eq(hsLocationsTable.id, locationId));
  if (!loc) return null;
  const [bp] = await db.select().from(hsBillingProfilesTable).where(eq(hsBillingProfilesTable.id, loc.billingProfileId));
  return { ...loc, billingProfile: bp ?? null };
}

export async function createLocation(companyId: string, data: {
  billingProfileId: string; nickname: string; address1: string; address2?: string;
  city: string; state: string; zip: string; phone?: string; isDefault?: boolean; placeId?: string;
}) {
  const id = newId("loc");
  if (data.isDefault) {
    await db.update(hsLocationsTable)
      .set({ isDefault: false }).where(eq(hsLocationsTable.companyId, companyId));
  }
  const [loc] = await db.insert(hsLocationsTable)
    .values({ id, companyId, validated: true, validationSource: "mock", ...data }).returning();
  await log(null, "hubspot", "createLocation", { companyId, ...data }, { id });
  return loc!;
}

export async function updateLocation(locationId: string, companyId: string, data: Partial<{
  billingProfileId: string; nickname: string; address1: string; address2: string;
  city: string; state: string; zip: string; phone: string; isDefault: boolean;
}>) {
  if (data.isDefault) {
    await db.update(hsLocationsTable)
      .set({ isDefault: false }).where(eq(hsLocationsTable.companyId, companyId));
  }
  const [loc] = await db.update(hsLocationsTable)
    .set(data).where(and(eq(hsLocationsTable.id, locationId), eq(hsLocationsTable.companyId, companyId)))
    .returning();
  await log(null, "hubspot", "updateLocation", { locationId, data }, { id: locationId });
  return loc!;
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function getContacts(companyId: string) {
  const contacts = await db.select().from(hsContactsTable).where(eq(hsContactsTable.companyId, companyId));
  return attachEmailsToContacts(contacts);
}

async function attachEmailsToContacts(contacts: (typeof hsContactsTable.$inferSelect)[]) {
  if (contacts.length === 0) return [];
  const emails = await db.select().from(hsContactEmailsTable);
  const emailMap: Record<string, typeof hsContactEmailsTable.$inferSelect[]> = {};
  for (const e of emails) {
    emailMap[e.contactId] = emailMap[e.contactId] ?? [];
    emailMap[e.contactId]!.push(e);
  }
  return contacts.map((c) => ({ ...c, emails: emailMap[c.id] ?? [] }));
}

export async function getContact(contactId: string) {
  const [contact] = await db.select().from(hsContactsTable).where(eq(hsContactsTable.id, contactId));
  if (!contact) return null;
  const emails = await db.select().from(hsContactEmailsTable).where(eq(hsContactEmailsTable.contactId, contactId));
  return { ...contact, emails };
}

export async function createContact(companyId: string, data: {
  firstName: string; lastName: string; roleTitle: string; email: string;
}) {
  const id = newId("ct");
  const [contact] = await db.insert(hsContactsTable)
    .values({ id, companyId, firstName: data.firstName, lastName: data.lastName, roleTitle: data.roleTitle })
    .returning();
  await db.insert(hsContactEmailsTable).values({ contactId: id, email: data.email, isPrimary: true });
  await log(null, "hubspot", "createContact", { companyId, ...data }, { id });
  const emails = await db.select().from(hsContactEmailsTable).where(eq(hsContactEmailsTable.contactId, id));
  return { ...contact!, emails };
}

export async function updateContact(contactId: string, companyId: string, data: Partial<{
  firstName: string; lastName: string; roleTitle: string; isActive: boolean;
}>) {
  const [contact] = await db.update(hsContactsTable)
    .set(data).where(and(eq(hsContactsTable.id, contactId), eq(hsContactsTable.companyId, companyId)))
    .returning();
  await log(null, "hubspot", "updateContact", { contactId, data }, { id: contactId });
  const emails = await db.select().from(hsContactEmailsTable).where(eq(hsContactEmailsTable.contactId, contactId));
  return { ...contact!, emails };
}

export async function addContactEmail(contactId: string, email: string) {
  await db.insert(hsContactEmailsTable).values({ contactId, email, isPrimary: false });
  await log(null, "hubspot", "addContactEmail", { contactId, email }, { ok: true });
}

// ─── PO Creation (for orders) ─────────────────────────────────────────────────

export async function createPurchaseOrder(orderId: number, data: {
  companyId: string; locationId: string; contactId: string;
  poNumber: string; totalCents: number; orderNumber: string;
}) {
  const hubspotPoId = `PO-${newId("hs")}`;
  // Mirrors the HubSpot CRM v3 object-create payload for a custom
  // "purchase_order" object (or a Deal), with v4 associations linking the PO
  // to the Contact, Company, and Location custom object.
  // NOTE: associationTypeId 0 is a placeholder — replace with the real
  // typeIds from the live HubSpot portal in phase 2.
  const payload = {
    properties: {
      po_number: data.poNumber,
      portal_order_number: data.orderNumber,
      amount: (data.totalCents / 100).toFixed(2),
      order_date: new Date().toISOString().slice(0, 10),
    },
    associations: [
      { to: { id: data.contactId }, types: [{ associationCategory: "USER_DEFINED", associationTypeId: 0 }] },
      { to: { id: data.companyId }, types: [{ associationCategory: "USER_DEFINED", associationTypeId: 0 }] },
      { to: { id: data.locationId }, types: [{ associationCategory: "USER_DEFINED", associationTypeId: 0 }] },
    ],
  };
  await log(orderId, "hubspot", "purchase_order.create", payload, { hubspotPoId, status: "synced" });
  return { hubspotPoId, hubspotPoStatus: "synced" };
}
