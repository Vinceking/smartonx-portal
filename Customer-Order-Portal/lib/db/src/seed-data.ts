/**
 * Smart On X — complete seed script (v2, audited rebuild)
 * - IDEMPOTENT: wipes all tables first; safe to run repeatedly.
 * - 10 orgs / 21 locations / 12 billing profiles / 20 portal users / 14 products
 * - 25 historical orders dated within the LAST 120 DAYS (relative to run time)
 * - Email-alias demo: Dr. Sarah Chen has TWO login emails
 * - Regional-admin scoping demo: rnorth/pdiaz/csanders get SUBSETS of locations
 * - Multi-billing demo: Summit + BrightPath each have a second (card) profile
 * Demo password: DemoPass123! | Admin password: AdminDemo123!
 */
import bcrypt from "bcryptjs";
import { db } from "./index.js";
import {
  rolesTable, portalUsersTable, userLocationAccessTable, adminUsersTable,
  productsTable, ordersTable, orderItemsTable, hsCompaniesTable,
  hsBillingProfilesTable, hsLocationsTable, hsContactsTable, hsContactEmailsTable,
  locationRequestsTable, emailLogTable, integrationLogTable, passwordResetTokensTable,
} from "./schema/index.js";

const DEMO_PASSWORD = "DemoPass123!";
const ADMIN_PASSWORD = "AdminDemo123!";
const SHIPPING_THRESHOLD = 50000;
const SHIPPING_COST = 1500;
// Spec values ONLY — never "card". Enforced by convention across the app.
const CARD = "card_at_checkout";
const NET = "net_terms";

/**
 * Seeds (or fully re-seeds) the demo database. Idempotent: wipes all tables
 * first. `rounds` controls bcrypt cost — 10 keeps web-triggered setup fast
 * on small instances while remaining a realistic hash.
 */
export async function runSeed(opts: { rounds?: number } = {}): Promise<void> {
  const rounds = opts.rounds ?? 10;
  const hash = (pw: string) => bcrypt.hash(pw, rounds);
  console.log("🌱 Seeding Smart On X database (idempotent)...");

  // ─── WIPE (FK-safe order) ──────────────────────────────────────────────────
  await db.delete(orderItemsTable);
  await db.delete(integrationLogTable);
  await db.delete(ordersTable);
  await db.delete(emailLogTable);
  await db.delete(locationRequestsTable);
  await db.delete(passwordResetTokensTable);
  await db.delete(userLocationAccessTable);
  await db.delete(portalUsersTable);
  await db.delete(adminUsersTable);
  await db.delete(hsContactEmailsTable);
  await db.delete(hsContactsTable);
  await db.delete(hsLocationsTable);
  await db.delete(hsBillingProfilesTable);
  await db.delete(hsCompaniesTable);
  await db.delete(productsTable);
  await db.delete(rolesTable);
  console.log("✓ Wiped existing data");

  // ─── Roles ─────────────────────────────────────────────────────────────────
  const roles = await db.insert(rolesTable).values([
    { key: "org_admin", label: "Org Admin", description: "Full access to organization settings and ordering" },
    { key: "regional_admin", label: "Regional Admin", description: "Manages users and ordering for an assigned set of locations" },
    { key: "purchaser", label: "Purchaser", description: "Place orders for assigned locations" },
  ]).returning();
  const roleMap = Object.fromEntries(roles.map((r) => [r.key, r.id]));
  console.log("✓ Roles");

  // ─── Admin Users ───────────────────────────────────────────────────────────
  await db.insert(adminUsersTable).values([
    { name: "Rachelle Andersen", email: "rachelle@smartonx.com", passwordHash: await hash(ADMIN_PASSWORD), isActive: true },
    { name: "Vinny King", email: "vinny@smartonx.com", passwordHash: await hash(ADMIN_PASSWORD), isActive: true },
  ]);
  console.log("✓ Admin users");

  // ─── Products (14) ────────────────────────────────────────────────────────
  const productData = [
    { sku: "OMB-001", name: "Omnibut Standard", productLine: "Omnibut", description: "Standard Omnibut abutment for All-on-X cases. Universal fit for major implant systems.", unitPriceCents: 24900, imageUrl: "https://placehold.co/400x300/0B2545/ffffff?text=Omnibut+Standard", active: true },
    { sku: "OMB-002", name: "Omnibut Mini", productLine: "Omnibut", description: "Compact Omnibut for narrow ridge cases.", unitPriceCents: 22900, imageUrl: "https://placehold.co/400x300/0B2545/ffffff?text=Omnibut+Mini", active: true },
    { sku: "OMB-003", name: "Omnibut Plus", productLine: "Omnibut", description: "Enhanced retention with titanium nitride coating.", unitPriceCents: 29900, imageUrl: "https://placehold.co/400x300/0B2545/ffffff?text=Omnibut+Plus", active: true },
    { sku: "RA-001", name: "Rapid Arches Full Kit", productLine: "Rapid Arches", description: "Complete full-arch restoration kit.", unitPriceCents: 149900, imageUrl: "https://placehold.co/400x300/0EA5A0/ffffff?text=Rapid+Arches+Kit", active: true },
    { sku: "RA-002", name: "Rapid Arches Framework", productLine: "Rapid Arches", description: "Milled zirconia framework for Rapid Arches.", unitPriceCents: 89900, imageUrl: "https://placehold.co/400x300/0EA5A0/ffffff?text=Rapid+Arches+Framework", active: true },
    { sku: "RA-003", name: "Rapid Arches Titanium Bar", productLine: "Rapid Arches", description: "CAD/CAM titanium bar for full-arch restorations.", unitPriceCents: 119900, imageUrl: "https://placehold.co/400x300/0EA5A0/ffffff?text=Titanium+Bar", active: true },
    { sku: "RSP-001", name: "Rapid Set Pickup Acrylic 50ml", productLine: "Rapid Set Pickup Acrylic", description: "Fast-setting acrylic for chair-side pickup. 50ml syringe.", unitPriceCents: 8900, imageUrl: "https://placehold.co/400x300/1e3a5f/ffffff?text=Pickup+Acrylic+50ml", active: true },
    { sku: "RSP-002", name: "Rapid Set Pickup Acrylic 150ml", productLine: "Rapid Set Pickup Acrylic", description: "Economy size Rapid Set Pickup Acrylic. 150ml cartridge.", unitPriceCents: 21900, imageUrl: "https://placehold.co/400x300/1e3a5f/ffffff?text=Pickup+Acrylic+150ml", active: true },
    { sku: "ST-001", name: "SimpleTemp Crown Material", productLine: "SimpleTemp", description: "Bis-acryl provisional material, 50ml, 5 shades.", unitPriceCents: 12900, imageUrl: "https://placehold.co/400x300/4b6584/ffffff?text=SimpleTemp", active: true },
    { sku: "ST-002", name: "SimpleTemp Try-In Paste", productLine: "SimpleTemp", description: "Non-eugenol try-in paste for provisionals.", unitPriceCents: 7900, imageUrl: "https://placehold.co/400x300/4b6584/ffffff?text=TryIn+Paste", active: true },
    { sku: "ST-003", name: "SimpleTemp Mixing Tips 50pk", productLine: "SimpleTemp", description: "Replacement mixing tips. 50 per pack.", unitPriceCents: 2900, imageUrl: "https://placehold.co/400x300/4b6584/ffffff?text=Mixing+Tips", active: true },
    { sku: "SDC-001", name: "Smart Denture Conversion Kit", productLine: "Smart Denture Conversions", description: "Complete kit for converting dentures to implant-retained prosthetics.", unitPriceCents: 74900, imageUrl: "https://placehold.co/400x300/2d3436/ffffff?text=Conversion+Kit", active: true },
    { sku: "SDC-002", name: "Smart Denture Conversion Inserts", productLine: "Smart Denture Conversions", description: "Replacement retention inserts. 10-pack, pink retention.", unitPriceCents: 19900, imageUrl: "https://placehold.co/400x300/2d3436/ffffff?text=Conversion+Inserts", active: true },
    { sku: "SDC-003", name: "Smart Denture Housing Kit", productLine: "Smart Denture Conversions", description: "Metal housings for denture conversion. 4-pack.", unitPriceCents: 34900, imageUrl: "https://placehold.co/400x300/2d3436/ffffff?text=Housing+Kit", active: true },
  ];
  await db.insert(productsTable).values(productData);
  const products = await db.select().from(productsTable);
  const prodMap = Object.fromEntries(products.map((p) => [p.sku, p]));
  console.log("✓ Products (14)");

  // ─── Org definitions ──────────────────────────────────────────────────────
  type BillingDef = { key: string; name: string; address1: string; city: string; state: string; zip: string; apEmail: string; apPhone?: string; paymentTerms: string; netDays?: number; isDefault: boolean };
  type LocationDef = { nickname: string; address1: string; city: string; state: string; zip: string; isDefault: boolean; billingKey?: string };
  type ContactDef = { firstName: string; lastName: string; roleTitle: string; email: string; extraEmails?: string[]; username?: string; role?: string; locations?: number[] };
  type OrgDef = { id: string; name: string; orgType: string; billing: BillingDef[]; locations: LocationDef[]; contacts: ContactDef[] };

  const orgs: OrgDef[] = [
    {
      id: "co_wasatch", name: "Wasatch Implant Center", orgType: "dental_practice",
      billing: [{ key: "main", name: "Wasatch Implant AP", address1: "1200 E Fort Union Blvd", city: "Midvale", state: "UT", zip: "84047", apEmail: "ap@wasatchimplant.com", apPhone: "8015550101", paymentTerms: NET, netDays: 30, isDefault: true }],
      locations: [
        { nickname: "Wasatch Main", address1: "1200 E Fort Union Blvd", city: "Midvale", state: "UT", zip: "84047", isDefault: true },
        { nickname: "Wasatch Sandy", address1: "9265 S 700 E", city: "Sandy", state: "UT", zip: "84070", isDefault: false },
      ],
      contacts: [
        // ⭐ FLAGSHIP DEMO RECORD: two login emails → one identity.
        { firstName: "Sarah", lastName: "Chen", roleTitle: "Prosthodontist / Practice Owner", email: "schen@wasatchimplant.com", extraEmails: ["drchen.wasatch@gmail.com"], username: "schen", role: "org_admin" },
        { firstName: "Marco", lastName: "Ruiz", roleTitle: "Office Manager", email: "mruiz@wasatchimplant.com", username: "mruiz", role: "purchaser", locations: [0] },
        { firstName: "David", lastName: "Okafor", roleTitle: "Dentist", email: "dokafor@wasatchimplant.com" },
      ],
    },
    {
      id: "co_precision", name: "Precision Dental Lab", orgType: "lab",
      billing: [{ key: "main", name: "Precision Dental Lab AP", address1: "720 S River Rd", city: "St. George", state: "UT", zip: "84790", apEmail: "ap@precisiondental.com", paymentTerms: CARD, isDefault: true }],
      locations: [{ nickname: "Precision HQ", address1: "720 S River Rd", city: "St. George", state: "UT", zip: "84790", isDefault: true }],
      contacts: [
        { firstName: "Tyler", lastName: "Johnson", roleTitle: "Lab Director", email: "tjohnson@precisiondental.com", username: "tjohnson", role: "org_admin" },
        { firstName: "Karen", lastName: "Patel", roleTitle: "Lab Technician", email: "kpatel@precisiondental.com", username: "kpatel", role: "purchaser", locations: [0] },
      ],
    },
    {
      id: "co_summit", name: "Summit Smiles DSO", orgType: "dso",
      billing: [
        { key: "main", name: "Summit Corporate AP", address1: "100 W Center St", city: "Provo", state: "UT", zip: "84601", apEmail: "ap@summitsmiles.com", apPhone: "8015550202", paymentTerms: NET, netDays: 30, isDefault: true },
        { key: "stg", name: "Summit St. George Billing", address1: "1091 N Bluff St", city: "St. George", state: "UT", zip: "84770", apEmail: "stgeorge-ap@summitsmiles.com", paymentTerms: CARD, isDefault: false },
      ],
      locations: [
        { nickname: "Summit Provo", address1: "100 W Center St", city: "Provo", state: "UT", zip: "84601", isDefault: true },
        { nickname: "Summit Orem", address1: "451 N State St", city: "Orem", state: "UT", zip: "84057", isDefault: false },
        { nickname: "Summit Lehi", address1: "3400 N Traverse Mountain Blvd", city: "Lehi", state: "UT", zip: "84043", isDefault: false },
        { nickname: "Summit Ogden", address1: "3555 Harrison Blvd", city: "Ogden", state: "UT", zip: "84403", isDefault: false },
        { nickname: "Summit St. George", address1: "1091 N Bluff St", city: "St. George", state: "UT", zip: "84770", isDefault: false, billingKey: "stg" },
      ],
      contacts: [
        { firstName: "Derek", lastName: "Wallace", roleTitle: "COO", email: "dwallace@summitsmiles.com", username: "dwallace", role: "org_admin" },
        // regional_admin scoped to Lehi + Ogden ONLY (indices 2, 3)
        { firstName: "Rachel", lastName: "North", roleTitle: "Regional Director", email: "rnorth@summitsmiles.com", username: "rnorth", role: "regional_admin", locations: [2, 3] },
        // purchaser scoped to Ogden ONLY (index 3)
        { firstName: "James", lastName: "Beck", roleTitle: "Office Coordinator", email: "jbeck@summitsmiles.com", username: "jbeck", role: "purchaser", locations: [3] },
        { firstName: "Priya", lastName: "Shah", roleTitle: "Dentist", email: "pshah@summitsmiles.com" },
      ],
    },
    {
      id: "co_redrock", name: "Red Rock Oral Surgery", orgType: "dental_practice",
      billing: [{ key: "main", name: "Red Rock Oral Surgery AP", address1: "1240 E 100 S", city: "St. George", state: "UT", zip: "84790", apEmail: "billing@redrockoral.com", paymentTerms: CARD, isDefault: true }],
      locations: [{ nickname: "Red Rock Main", address1: "1240 E 100 S", city: "St. George", state: "UT", zip: "84790", isDefault: true }],
      contacts: [
        { firstName: "Andrea", lastName: "Larsen", roleTitle: "Practice Administrator", email: "alarsen@redrockoral.com", username: "alarsen", role: "org_admin" },
        { firstName: "Miguel", lastName: "Santos", roleTitle: "Oral Surgeon", email: "msantos@redrockoral.com" },
      ],
    },
    {
      id: "co_cache", name: "Cache Valley Prosthodontics", orgType: "dental_practice",
      billing: [{ key: "main", name: "Cache Valley AP", address1: "655 S Main St", city: "Logan", state: "UT", zip: "84321", apEmail: "ap@cachevalleydental.com", paymentTerms: NET, netDays: 30, isDefault: true }],
      locations: [{ nickname: "Cache Valley Main", address1: "655 S Main St", city: "Logan", state: "UT", zip: "84321", isDefault: true }],
      contacts: [
        { firstName: "Bradley", lastName: "Miller", roleTitle: "Practice Owner", email: "bmiller@cachevalleydental.com", username: "bmiller", role: "org_admin" },
        { firstName: "Sarah", lastName: "Foster", roleTitle: "Front Desk", email: "sfoster@cachevalleydental.com", username: "sfoster", role: "purchaser", locations: [0] },
      ],
    },
    {
      id: "co_alpine", name: "Alpine Prosthetics Group", orgType: "lab",
      billing: [{ key: "main", name: "Alpine Prosthetics AP", address1: "3300 N Triumph Blvd", city: "Lehi", state: "UT", zip: "84043", apEmail: "ap@alpineprosthetics.com", paymentTerms: CARD, isDefault: true }],
      locations: [
        { nickname: "Alpine Lehi Lab", address1: "3300 N Triumph Blvd", city: "Lehi", state: "UT", zip: "84043", isDefault: true },
        { nickname: "Alpine SLC Lab", address1: "940 N 400 W", city: "Salt Lake City", state: "UT", zip: "84116", isDefault: false },
      ],
      contacts: [
        { firstName: "George", lastName: "Kim", roleTitle: "Lab Owner", email: "gkim@alpineprosthetics.com", username: "gkim", role: "org_admin" },
        { firstName: "Lucia", lastName: "Vasquez", roleTitle: "Production Manager", email: "lvasquez@alpineprosthetics.com", username: "lvasquez", role: "purchaser", locations: [1] },
      ],
    },
    {
      id: "co_brightpath", name: "BrightPath Dental Partners", orgType: "dso",
      billing: [
        { key: "main", name: "BrightPath Corporate AP", address1: "5200 W 13400 S", city: "Herriman", state: "UT", zip: "84096", apEmail: "ap@brightpathdental.com", apPhone: "8015550303", paymentTerms: NET, netDays: 45, isDefault: true },
        { key: "wj", name: "BrightPath West Jordan Billing", address1: "1951 W 9000 S", city: "West Jordan", state: "UT", zip: "84088", apEmail: "wj-ap@brightpathdental.com", paymentTerms: CARD, isDefault: false },
      ],
      locations: [
        { nickname: "BrightPath Herriman", address1: "5200 W 13400 S", city: "Herriman", state: "UT", zip: "84096", isDefault: true },
        { nickname: "BrightPath West Jordan", address1: "1951 W 9000 S", city: "West Jordan", state: "UT", zip: "84088", isDefault: false, billingKey: "wj" },
        { nickname: "BrightPath Riverton", address1: "12634 S Redwood Rd", city: "Riverton", state: "UT", zip: "84065", isDefault: false },
      ],
      contacts: [
        { firstName: "Helen", lastName: "Carter", roleTitle: "CEO", email: "hcarter@brightpathdental.com", username: "hcarter", role: "org_admin" },
        // regional_admin scoped to West Jordan + Riverton (indices 1, 2)
        { firstName: "Paul", lastName: "Diaz", roleTitle: "Regional Manager", email: "pdiaz@brightpathdental.com", username: "pdiaz", role: "regional_admin", locations: [1, 2] },
        { firstName: "William", lastName: "Thompson", roleTitle: "Scheduling Coordinator", email: "wthompson@brightpathdental.com", username: "wthompson", role: "purchaser", locations: [0] },
      ],
    },
    {
      id: "co_nguyen", name: "Dr. Nguyen Implant Center", orgType: "dental_practice",
      billing: [{ key: "main", name: "Nguyen Implant AP", address1: "4801 S 900 E", city: "Murray", state: "UT", zip: "84107", apEmail: "billing@nguyenimplant.com", paymentTerms: CARD, isDefault: true }],
      locations: [{ nickname: "Nguyen Main", address1: "4801 S 900 E", city: "Murray", state: "UT", zip: "84107", isDefault: true }],
      contacts: [
        { firstName: "Nancy", lastName: "Nguyen", roleTitle: "Practice Owner", email: "nnguyen@nguyenimplant.com", username: "nnguyen", role: "org_admin" },
      ],
    },
    {
      id: "co_timpanogos", name: "Timpanogos Dental Lab", orgType: "lab",
      billing: [{ key: "main", name: "Timpanogos Lab AP", address1: "2230 N University Pkwy", city: "Provo", state: "UT", zip: "84604", apEmail: "ap@timpanogoslab.com", paymentTerms: NET, netDays: 30, isDefault: true }],
      locations: [{ nickname: "Timpanogos HQ", address1: "2230 N University Pkwy", city: "Provo", state: "UT", zip: "84604", isDefault: true }],
      contacts: [
        { firstName: "Elena", lastName: "Flores", roleTitle: "Lab Director", email: "eflores@timpanogoslab.com", username: "eflores", role: "org_admin" },
        { firstName: "Ben", lastName: "Whitaker", roleTitle: "CAD Technician", email: "bwhitaker@timpanogoslab.com" },
      ],
    },
    {
      id: "co_frontier", name: "Frontier Dental Collective", orgType: "dso",
      billing: [{ key: "main", name: "Frontier DSO AP", address1: "150 N 200 W", city: "Cedar City", state: "UT", zip: "84720", apEmail: "ap@frontierdental.com", apPhone: "4355550404", paymentTerms: NET, netDays: 45, isDefault: true }],
      locations: [
        { nickname: "Frontier Cedar City", address1: "150 N 200 W", city: "Cedar City", state: "UT", zip: "84720", isDefault: true },
        { nickname: "Frontier Parowan", address1: "430 S Main St", city: "Parowan", state: "UT", zip: "84761", isDefault: false },
        { nickname: "Frontier Hurricane", address1: "75 N 2260 W", city: "Hurricane", state: "UT", zip: "84737", isDefault: false },
        { nickname: "Frontier Kanab", address1: "355 S Main St", city: "Kanab", state: "UT", zip: "84741", isDefault: false },
      ],
      contacts: [
        { firstName: "Oliver", lastName: "Morgan", roleTitle: "Founder", email: "omorgan@frontierdental.com", username: "omorgan", role: "org_admin" },
        // regional_admin scoped to Hurricane + Kanab (indices 2, 3)
        { firstName: "Christine", lastName: "Sanders", roleTitle: "Regional Coordinator", email: "csanders@frontierdental.com", username: "csanders", role: "regional_admin", locations: [2, 3] },
        // purchaser with TWO locations (indices 0, 1)
        { firstName: "Ryan", lastName: "Young", roleTitle: "Office Assistant", email: "ryoung@frontierdental.com", username: "ryoung", role: "purchaser", locations: [0, 1] },
      ],
    },
  ];

  // ─── Insert orgs / billing / locations / contacts / users ─────────────────
  const locationIdMap: Record<string, string[]> = {};
  const locationDefMap: Record<string, LocationDef[]> = {};
  const billingByLocId: Record<string, BillingDef & { id: string }> = {};
  const firstUserIdMap: Record<string, number> = {};
  const firstContactIdMap: Record<string, string> = {};
  const usernameToUserId: Record<string, number> = {};

  for (const org of orgs) {
    await db.insert(hsCompaniesTable).values({
      id: org.id, name: org.name, orgType: org.orgType,
      allowAdminBillingEdit: org.orgType === "lab",
    });

    const bpIdByKey: Record<string, string> = {};
    for (const bp of org.billing) {
      const bpId = `bp_${org.id}_${bp.key}`;
      const { key, ...bpValues } = bp;
      await db.insert(hsBillingProfilesTable).values({ id: bpId, companyId: org.id, validated: true, ...bpValues });
      bpIdByKey[key] = bpId;
    }

    const locIds: string[] = [];
    for (let li = 0; li < org.locations.length; li++) {
      const loc = org.locations[li]!;
      const locId = `loc_${org.id}_${li}`;
      const bpKey = loc.billingKey ?? "main";
      const { billingKey, ...locValues } = loc;
      await db.insert(hsLocationsTable).values({
        id: locId, companyId: org.id, billingProfileId: bpIdByKey[bpKey]!, ...locValues,
        validated: true, validationSource: "seed",
      });
      locIds.push(locId);
      const bpDef = org.billing.find((b) => b.key === bpKey)!;
      billingByLocId[locId] = { ...bpDef, id: bpIdByKey[bpKey]! };
    }
    locationIdMap[org.id] = locIds;
    locationDefMap[org.id] = org.locations;

    let isFirstUser = true;
    for (let ci = 0; ci < org.contacts.length; ci++) {
      const ct = org.contacts[ci]!;
      const ctId = `ct_${org.id}_${ci}`;
      await db.insert(hsContactsTable).values({
        id: ctId, companyId: org.id,
        firstName: ct.firstName, lastName: ct.lastName, roleTitle: ct.roleTitle, isActive: true,
      });
      await db.insert(hsContactEmailsTable).values({ contactId: ctId, email: ct.email.toLowerCase(), isPrimary: true });
      for (const extra of ct.extraEmails ?? []) {
        await db.insert(hsContactEmailsTable).values({ contactId: ctId, email: extra.toLowerCase(), isPrimary: false });
      }

      // Contacts without a username are CRM-only (no portal login).
      if (!ct.username || !ct.role) continue;
      const roleId = roleMap[ct.role];
      if (!roleId) continue;

      const [user] = await db.insert(portalUsersTable).values({
        hubspotContactId: ctId, hubspotCompanyId: org.id,
        username: ct.username, passwordHash: await hash(DEMO_PASSWORD),
        roleId, mustChangePassword: false, isActive: true,
      }).returning();
      usernameToUserId[ct.username] = user!.id;

      if (isFirstUser) {
        firstUserIdMap[org.id] = user!.id;
        firstContactIdMap[org.id] = ctId;
        isFirstUser = false;
      }

      // Location access: EXPLICIT subsets from the contact definition.
      // org_admins get NO rows (implicit all-locations access).
      if (ct.role !== "org_admin") {
        const assigned = (ct.locations ?? [0]).map((idx) => locIds[idx]!).filter(Boolean);
        if (assigned.length > 0) {
          await db.insert(userLocationAccessTable).values(
            assigned.map((locId) => ({ portalUserId: user!.id, hubspotLocationId: locId, canOrder: true })),
          );
        }
      }
    }
  }
  console.log("✓ Organizations, billing profiles, locations, contacts, and portal users");

  // ─── Historical orders: last 120 days, mixed statuses ─────────────────────
  const orderConfigs: Array<{ orgId: string; locIdx: number; items: Array<{ sku: string; qty: number }>; poNum: string }> = [
    { orgId: "co_wasatch", locIdx: 0, items: [{ sku: "OMB-001", qty: 2 }, { sku: "RSP-001", qty: 3 }], poNum: "PO-2026-1001" },
    { orgId: "co_wasatch", locIdx: 1, items: [{ sku: "RA-001", qty: 1 }], poNum: "PO-2026-1002" },
    { orgId: "co_wasatch", locIdx: 0, items: [{ sku: "OMB-003", qty: 4 }, { sku: "ST-001", qty: 2 }], poNum: "PO-2026-1003" },
    { orgId: "co_precision", locIdx: 0, items: [{ sku: "SDC-001", qty: 1 }, { sku: "SDC-002", qty: 2 }], poNum: "PO-2026-2001" },
    { orgId: "co_precision", locIdx: 0, items: [{ sku: "RA-002", qty: 2 }], poNum: "PO-2026-2002" },
    { orgId: "co_summit", locIdx: 0, items: [{ sku: "OMB-001", qty: 6 }, { sku: "OMB-002", qty: 4 }], poNum: "PO-2026-3001" },
    { orgId: "co_summit", locIdx: 3, items: [{ sku: "RA-001", qty: 2 }, { sku: "RSP-002", qty: 1 }], poNum: "PO-2026-3002" },
    { orgId: "co_summit", locIdx: 2, items: [{ sku: "ST-002", qty: 5 }, { sku: "ST-003", qty: 10 }], poNum: "PO-2026-3003" },
    { orgId: "co_summit", locIdx: 4, items: [{ sku: "OMB-002", qty: 3 }], poNum: "PO-2026-3004" },
    { orgId: "co_redrock", locIdx: 0, items: [{ sku: "OMB-001", qty: 3 }], poNum: "PO-2026-4001" },
    { orgId: "co_cache", locIdx: 0, items: [{ sku: "SDC-003", qty: 2 }, { sku: "RSP-001", qty: 4 }], poNum: "PO-2026-5001" },
    { orgId: "co_alpine", locIdx: 0, items: [{ sku: "RA-002", qty: 3 }], poNum: "PO-2026-6001" },
    { orgId: "co_alpine", locIdx: 1, items: [{ sku: "RA-003", qty: 1 }, { sku: "OMB-003", qty: 2 }], poNum: "PO-2026-6002" },
    { orgId: "co_brightpath", locIdx: 0, items: [{ sku: "OMB-001", qty: 8 }, { sku: "OMB-002", qty: 6 }], poNum: "PO-2026-7001" },
    { orgId: "co_brightpath", locIdx: 1, items: [{ sku: "RSP-002", qty: 3 }, { sku: "ST-001", qty: 4 }], poNum: "PO-2026-7002" },
    { orgId: "co_brightpath", locIdx: 2, items: [{ sku: "SDC-001", qty: 2 }], poNum: "PO-2026-7003" },
    { orgId: "co_nguyen", locIdx: 0, items: [{ sku: "OMB-001", qty: 2 }, { sku: "ST-002", qty: 3 }], poNum: "PO-2026-8001" },
    { orgId: "co_timpanogos", locIdx: 0, items: [{ sku: "RA-001", qty: 1 }, { sku: "SDC-002", qty: 4 }], poNum: "PO-2026-9001" },
    { orgId: "co_timpanogos", locIdx: 0, items: [{ sku: "OMB-002", qty: 3 }], poNum: "PO-2026-9002" },
    { orgId: "co_frontier", locIdx: 0, items: [{ sku: "OMB-001", qty: 4 }, { sku: "OMB-003", qty: 2 }], poNum: "PO-2026-0101" },
    { orgId: "co_frontier", locIdx: 1, items: [{ sku: "RSP-001", qty: 6 }, { sku: "ST-003", qty: 20 }], poNum: "PO-2026-0102" },
    { orgId: "co_wasatch", locIdx: 0, items: [{ sku: "RA-003", qty: 1 }, { sku: "OMB-001", qty: 2 }], poNum: "PO-2026-1004" },
    { orgId: "co_summit", locIdx: 0, items: [{ sku: "OMB-001", qty: 10 }], poNum: "PO-2026-3005" },
    { orgId: "co_brightpath", locIdx: 0, items: [{ sku: "SDC-001", qty: 3 }, { sku: "SDC-003", qty: 2 }], poNum: "PO-2026-7004" },
    { orgId: "co_frontier", locIdx: 2, items: [{ sku: "OMB-003", qty: 5 }, { sku: "RSP-002", qty: 2 }], poNum: "PO-2026-0103" },
  ];

  // Spec status mix: 3 submitted / 4 processing / 6 shipped / 11 delivered / 1 cancelled
  const statuses = [
    "delivered", "delivered", "delivered", "delivered", "delivered", "delivered",
    "delivered", "delivered", "delivered", "delivered", "delivered",
    "shipped", "shipped", "shipped", "shipped", "shipped", "shipped",
    "processing", "processing", "processing", "processing",
    "submitted", "submitted", "submitted",
    "cancelled",
  ];

  for (let i = 0; i < orderConfigs.length; i++) {
    const cfg = orderConfigs[i]!;
    const orgLocIds = locationIdMap[cfg.orgId] ?? [];
    const locId = orgLocIds[cfg.locIdx] ?? orgLocIds[0]!;
    const bp = billingByLocId[locId]!;
    const contactId = firstContactIdMap[cfg.orgId]!;
    const portalUserId = firstUserIdMap[cfg.orgId]!;
    const locDef = locationDefMap[cfg.orgId]![cfg.locIdx] ?? locationDefMap[cfg.orgId]![0]!;

    let subtotal = 0;
    const resolvedItems: Array<{ sku: string; name: string; qty: number; price: number; total: number; productId: number }> = [];
    for (const item of cfg.items) {
      const product = prodMap[item.sku];
      if (!product) continue;
      const lineTotal = product.unitPriceCents * item.qty;
      subtotal += lineTotal;
      resolvedItems.push({ sku: product.sku, name: product.name, qty: item.qty, price: product.unitPriceCents, total: lineTotal, productId: product.id });
    }
    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + shipping;
    const isNet = bp.paymentTerms === NET;

    // Dates: oldest ~118 days ago, newest ~3 days ago (relative to NOW).
    const daysAgo = 118 - Math.floor((i / (orderConfigs.length - 1)) * 115);
    const orderedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const yyyymmdd = orderedAt.toISOString().slice(0, 10).replace(/-/g, "");
    const [order] = await db.insert(ordersTable).values({
      orderNumber: `SOX-${yyyymmdd}-${String(1000 + i)}`,
      hubspotCompanyId: cfg.orgId,
      hubspotLocationId: locId,
      hubspotContactId: contactId,
      portalUserId,
      placedByRole: "org_admin",
      poNumber: cfg.poNum,
      shipSnapshot: {
        locationId: locId, nickname: locDef.nickname, address1: locDef.address1,
        city: locDef.city, state: locDef.state, zip: locDef.zip,
      } as Record<string, unknown>,
      billingSnapshot: {
        billingProfileId: bp.id, name: bp.name, address1: bp.address1,
        city: bp.city, state: bp.state, zip: bp.zip, apEmail: bp.apEmail,
        paymentTerms: bp.paymentTerms, netDays: bp.netDays ?? null,
      } as Record<string, unknown>,
      paymentTermsSnapshot: bp.paymentTerms,
      netDaysSnapshot: isNet ? (bp.netDays ?? undefined) : undefined,
      paymentStatus: isNet ? "terms_net" : "paid",
      subtotalCents: subtotal,
      shippingCents: shipping,
      totalCents: total,
      status: statuses[i]!,
      shopifyOrderId: `gid://shopify/DraftOrder/seed${String(i).padStart(4, "0")}`,
      shopifyOrderNumber: `SX-${10100 + i}`,
      hubspotPoId: `PO-hs_${String(3000 + i)}`,
      hubspotPoStatus: "synced",
      orderedAt,
    }).returning();

    if (order && resolvedItems.length > 0) {
      await db.insert(orderItemsTable).values(
        resolvedItems.map((item) => ({
          orderId: order.id, productId: item.productId, skuSnapshot: item.sku,
          nameSnapshot: item.name, quantity: item.qty,
          unitPriceCents: item.price, lineTotalCents: item.total,
        })),
      );
    }
  }
  console.log("✓ Historical orders (25, last 120 days, incl. 1 cancelled)");

  // ─── Pending location request (jbeck → Summit "Ogden North") + email ──────
  const jbeckId = usernameToUserId["jbeck"]!;
  await db.insert(locationRequestsTable).values({
    hubspotCompanyId: "co_summit",
    requestedByUserId: jbeckId,
    nickname: "Summit Ogden North",
    address1: "1487 N Washington Blvd",
    city: "Ogden", state: "UT", zip: "84404",
    phone: "8015550909",
    validated: true, placeId: "seed_place_ogden_north",
    status: "pending",
  });
  await db.insert(emailLogTable).values({
    toAddress: "rachelle@smartonx.com",
    subject: "New location request — Summit Smiles DSO",
    bodyText: [
      "A new shipping location has been requested and needs verification.",
      "", "Organization: Summit Smiles DSO",
      "Requested by: James Beck (jbeck, Office Coordinator)",
      "Nickname: Summit Ogden North",
      "Address: 1487 N Washington Blvd, Ogden, UT 84404",
      "Phone: (801) 555-0909",
      "Address validated: yes (autocomplete)",
      "", "Review it in the admin console under Location Requests.",
    ].join("\n"),
    category: "location_request",
  });
  console.log("✓ Pending location request + notification email");

  console.log("\n🎉 Seeding complete!\n");
  console.log(`📋 Demo credentials (password: ${DEMO_PASSWORD}):`);
  for (const org of orgs) {
    const loginUsers = org.contacts.filter((c) => c.username);
    if (loginUsers.length === 0) continue;
    console.log(`  ${org.name}:`);
    for (const ct of loginUsers) console.log(`    ${ct.username} (${ct.role})`);
  }
  console.log(`\n  ⭐ Email-alias demo: log in with drchen.wasatch@gmail.com OR schen@wasatchimplant.com OR username schen — all reach Dr. Sarah Chen's account.`);
  console.log(`\n👑 Admin console (/admin/login):`);
  console.log(`  rachelle@smartonx.com | ${ADMIN_PASSWORD}`);
  console.log(`  vinny@smartonx.com | ${ADMIN_PASSWORD}`);
}
