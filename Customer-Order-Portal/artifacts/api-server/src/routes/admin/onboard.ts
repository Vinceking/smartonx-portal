import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import { portalUsersTable, rolesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth";
import * as hs from "../../lib/hubspot";
import * as mailer from "../../lib/mailer";

const router = Router();
router.use(requireAdminAuth);

// POST /api/admin/onboard
router.post("/", async (req, res) => {
  const {
    orgName, orgType,
    billingName, billingAddress1, billingAddress2, billingCity, billingState, billingZip,
    billingApEmail, billingApPhone, billingPaymentTerms, billingNetDays,
    locationNickname, locationAddress1, locationAddress2, locationCity, locationState, locationZip, locationPhone,
    contactFirst, contactLast, contactRoleTitle, contactEmail,
    username,
  } = req.body as {
    orgName?: string; orgType?: string;
    billingName?: string; billingAddress1?: string; billingAddress2?: string;
    billingCity?: string; billingState?: string; billingZip?: string;
    billingApEmail?: string; billingApPhone?: string; billingPaymentTerms?: string; billingNetDays?: number;
    locationNickname?: string; locationAddress1?: string; locationAddress2?: string;
    locationCity?: string; locationState?: string; locationZip?: string; locationPhone?: string;
    contactFirst?: string; contactLast?: string; contactRoleTitle?: string; contactEmail?: string;
    username?: string;
  };

  if (!orgName || !orgType || !billingName || !billingAddress1 || !billingCity || !billingState || !billingZip ||
      !billingApEmail || !billingPaymentTerms || !locationNickname || !locationAddress1 ||
      !locationCity || !locationState || !locationZip || !contactFirst || !contactLast ||
      !contactRoleTitle || !contactEmail || !username) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  // Check username
  const [existingUser] = await db.select().from(portalUsersTable).where(eq(portalUsersTable.username, username.toLowerCase().trim()));
  if (existingUser) { res.status(409).json({ error: "Username already taken" }); return; }

  // 1. Create company
  const company = await hs.createCompany({ name: orgName, orgType });

  // 2. Create billing profile
  const billingProfile = await hs.createBillingProfile(company.id, {
    name: billingName, address1: billingAddress1, address2: billingAddress2,
    city: billingCity, state: billingState, zip: billingZip,
    apEmail: billingApEmail, apPhone: billingApPhone,
    paymentTerms: billingPaymentTerms, netDays: billingNetDays,
    isDefault: true,
  });

  // 3. Create location
  const location = await hs.createLocation(company.id, {
    billingProfileId: billingProfile.id,
    nickname: locationNickname, address1: locationAddress1, address2: locationAddress2,
    city: locationCity, state: locationState, zip: locationZip, phone: locationPhone,
    isDefault: true,
  });

  // 4. Create contact
  const contact = await hs.createContact(company.id, {
    firstName: contactFirst, lastName: contactLast,
    roleTitle: contactRoleTitle, email: contactEmail.toLowerCase().trim(),
  });

  // 5. Create portal user
  const [orgAdminRole] = await db.select().from(rolesTable).where(eq(rolesTable.key, "org_admin"));
  const tempPassword = `Temp${crypto.randomBytes(4).toString("hex")}!`;
  const hash = await bcrypt.hash(tempPassword, 12);
  const [user] = await db.insert(portalUsersTable).values({
    hubspotContactId: contact.id,
    hubspotCompanyId: company.id,
    username: username.toLowerCase().trim(),
    passwordHash: hash,
    roleId: orgAdminRole!.id,
    mustChangePassword: true,
    isActive: true,
  }).returning();

  // Send welcome email
  try {
    await mailer.sendTempPassword({ to: contactEmail, firstName: contactFirst, username: username.toLowerCase().trim(), tempPassword });
  } catch { /* non-fatal */ }

  res.status(201).json({
    companyId: company.id,
    billingProfileId: billingProfile.id,
    locationId: location.id,
    contactId: contact.id,
    portalUserId: user!.id,
    username: user!.username,
    tempPassword,
  });
});

export default router;
