import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  ordersTable, orderItemsTable, productsTable,
  hsLocationsTable, hsBillingProfilesTable,
  userLocationAccessTable, hsContactEmailsTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePortalAuth } from "../middlewares/requirePortalAuth";
import * as hs from "../lib/hubspot";
import * as shopify from "../lib/shopify";
import * as mailer from "../lib/mailer";

const router = Router();
router.use(requirePortalAuth);

const MAX_QTY = 99;
const PO_MAX_LEN = 40;

/** Collision-safe order number: date + 6 random hex (16.7M/day space). */
function orderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `SOX-${y}${m}${d}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

// POST /api/portal/orders
router.post("/", async (req, res) => {
  const session = req.portalSession!;
  const { hubspotLocationId, billingProfileId, poNumber, orderNotes, items } = req.body as {
    hubspotLocationId?: string;
    billingProfileId?: string;
    poNumber?: string;
    orderNotes?: string;
    items?: Array<{ productId: number; quantity: number }>;
  };

  if (!hubspotLocationId || !billingProfileId || !poNumber || !items?.length) {
    res.status(400).json({ error: "Missing required order fields" });
    return;
  }
  if (poNumber.trim().length === 0 || poNumber.length > PO_MAX_LEN) {
    res.status(400).json({ error: `PO number is required (max ${PO_MAX_LEN} characters)` });
    return;
  }

  // Server-side quantity validation — never trust the client.
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QTY) {
      res.status(400).json({ error: `Invalid quantity for product ${item.productId} (must be 1-${MAX_QTY})` });
      return;
    }
    if (!Number.isInteger(item.productId)) {
      res.status(400).json({ error: "Invalid product reference" });
      return;
    }
  }

  // Location access check for non-org-admins.
  if (session.roleKey !== "org_admin") {
    const [access] = await db
      .select()
      .from(userLocationAccessTable)
      .where(and(
        eq(userLocationAccessTable.portalUserId, session.userId),
        eq(userLocationAccessTable.hubspotLocationId, hubspotLocationId),
      ));
    if (!access) {
      res.status(403).json({ error: "No access to this location" });
      return;
    }
  }

  // Fetch fresh location + billing (always bypass any cache for orders).
  const [location] = await db
    .select().from(hsLocationsTable).where(eq(hsLocationsTable.id, hubspotLocationId));
  const [billing] = await db
    .select().from(hsBillingProfilesTable).where(eq(hsBillingProfilesTable.id, billingProfileId));
  if (!location || !billing) {
    res.status(400).json({ error: "Invalid location or billing profile" });
    return;
  }

  // TENANT ISOLATION: both records must belong to the caller's organization,
  // regardless of role. Prevents cross-org shipping/billing.
  if (location.companyId !== session.hubspotCompanyId || billing.companyId !== session.hubspotCompanyId) {
    res.status(403).json({ error: "Location or billing profile does not belong to your organization" });
    return;
  }

  // Resolve products and recompute ALL money server-side from DB prices.
  const products = await db
    .select().from(productsTable)
    .where(eq(productsTable.active, true));
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let subtotalCents = 0;
  const resolvedItems: Array<{
    productId: number; sku: string; name: string; qty: number; unitPriceCents: number; lineTotal: number;
  }> = [];

  for (const item of items) {
    const product = productMap[item.productId];
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    const lineTotal = product.unitPriceCents * item.quantity;
    subtotalCents += lineTotal;
    resolvedItems.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      qty: item.quantity,
      unitPriceCents: product.unitPriceCents,
      lineTotal,
    });
  }

  const shippingCents = subtotalCents >= 50000 ? 0 : 1500;
  const totalCents = subtotalCents + shippingCents;
  const isNetTerms = billing.paymentTerms === "net_terms";
  const paymentStatus = isNetTerms ? "terms_net" : "paid";

  const shipSnapshot = {
    locationId: location.id,
    nickname: location.nickname,
    address1: location.address1,
    address2: location.address2,
    city: location.city,
    state: location.state,
    zip: location.zip,
    phone: location.phone,
  };
  const billingSnapshot = {
    billingProfileId: billing.id,
    name: billing.name,
    address1: billing.address1,
    address2: billing.address2,
    city: billing.city,
    state: billing.state,
    zip: billing.zip,
    apEmail: billing.apEmail,
    apPhone: billing.apPhone,
    paymentTerms: billing.paymentTerms,
    netDays: billing.netDays,
  };

  const num = orderNumber();

  // Purchaser's primary email (for the Shopify payload + confirmation).
  const [primaryEmail] = await db
    .select().from(hsContactEmailsTable)
    .where(and(
      eq(hsContactEmailsTable.contactId, session.hubspotContactId),
      eq(hsContactEmailsTable.isPrimary, true),
    ));

  // Create order + items atomically.
  const order = await db.transaction(async (tx) => {
    const [created] = await tx.insert(ordersTable).values({
      orderNumber: num,
      hubspotCompanyId: session.hubspotCompanyId,
      hubspotLocationId,
      hubspotContactId: session.hubspotContactId,
      portalUserId: session.userId,
      placedByRole: session.roleKey,
      poNumber: poNumber.trim(),
      orderNotes: orderNotes ?? null,
      shipSnapshot: shipSnapshot as Record<string, unknown>,
      billingSnapshot: billingSnapshot as Record<string, unknown>,
      paymentTermsSnapshot: billing.paymentTerms,
      netDaysSnapshot: isNetTerms ? (billing.netDays ?? undefined) : undefined,
      paymentStatus,
      subtotalCents,
      shippingCents,
      totalCents,
      status: "submitted",
    }).returning();

    await tx.insert(orderItemsTable).values(
      resolvedItems.map((i) => ({
        orderId: created!.id,
        productId: i.productId,
        skuSnapshot: i.sku,
        nameSnapshot: i.name,
        quantity: i.qty,
        unitPriceCents: i.unitPriceCents,
        lineTotalCents: i.lineTotal,
      })),
    );
    return created!;
  });

  // Shopify draft order + HubSpot PO (mock services log real API payload shapes).
  const [shopifyResult, hubspotResult] = await Promise.all([
    shopify.createDraftOrder(order.id, {
      hubspotCompanyId: session.hubspotCompanyId,
      hubspotLocationId,
      hubspotContactId: session.hubspotContactId,
      poNumber: poNumber.trim(),
      orderNotes: orderNotes ?? undefined,
      email: isNetTerms ? billing.apEmail : (primaryEmail?.email ?? billing.apEmail),
      items: resolvedItems.map((i) => ({ sku: i.sku, name: i.name, qty: i.qty, unitPriceCents: i.unitPriceCents })),
      shippingCents,
      shipTo: shipSnapshot,
      billTo: billingSnapshot,
      paymentTerms: isNetTerms ? { type: "NET", dueInDays: billing.netDays ?? 30 } : null,
    }),
    hs.createPurchaseOrder(order.id, {
      companyId: session.hubspotCompanyId,
      locationId: hubspotLocationId,
      contactId: session.hubspotContactId,
      poNumber: poNumber.trim(),
      totalCents,
      orderNumber: num,
    }),
  ]);

  await db.update(ordersTable).set({
    shopifyOrderId: shopifyResult.shopifyOrderId,
    shopifyOrderNumber: shopifyResult.shopifyOrderNumber,
    hubspotPoId: hubspotResult.hubspotPoId,
    hubspotPoStatus: hubspotResult.hubspotPoStatus,
  }).where(eq(ordersTable.id, order.id));

  // Confirmation email (best effort). CC the AP inbox on net-terms orders.
  try {
    if (primaryEmail) {
      await mailer.sendOrderConfirmation({
        to: primaryEmail.email,
        firstName: session.firstName,
        orderNumber: num,
        totalCents,
        shopifyOrderNumber: shopifyResult.shopifyOrderNumber,
        locationNickname: location.nickname,
        poNumber: poNumber.trim(),
      });
    }
  } catch { /* non-fatal */ }

  res.status(201).json({
    id: order.id,
    orderNumber: num,
    shopifyOrderNumber: shopifyResult.shopifyOrderNumber,
    hubspotPoId: hubspotResult.hubspotPoId,
  });
});

export default router;
