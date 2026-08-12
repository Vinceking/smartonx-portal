/**
 * Shopify Mock Service — builds the EXACT Admin GraphQL draftOrderCreate
 * input shape and logs it to integration_log so phase-2 payloads can be
 * validated in /admin/integration-log before real credentials exist.
 * In production this calls the Shopify Admin GraphQL API.
 */
import crypto from "crypto";
import { db } from "@workspace/db";
import { integrationLogTable } from "@workspace/db/schema";

function newId(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

interface Address {
  address1?: string | null; address2?: string | null;
  city?: string | null; state?: string | null; zip?: string | null; phone?: string | null;
}

export async function createDraftOrder(
  orderId: number,
  data: {
    hubspotCompanyId: string;
    hubspotLocationId: string;
    hubspotContactId: string;
    poNumber: string;
    orderNotes?: string;
    email: string;
    items: Array<{ sku: string; name: string; qty: number; unitPriceCents: number }>;
    shippingCents: number;
    shipTo: Address & { nickname?: string };
    billTo: Address & { name?: string };
    paymentTerms: { type: "NET"; dueInDays: number } | null;
  },
): Promise<{ shopifyOrderId: string; shopifyOrderNumber: string }> {
  const shopifyOrderId = `gid://shopify/DraftOrder/${Date.now()}${newId().slice(0, 4)}`;
  const shopifyOrderNumber = `SX-${10000 + Math.floor(Math.random() * 89999)}`;

  // This mirrors the real draftOrderCreate mutation input. The
  // customAttributes are the load-bearing part: they carry the PO number and
  // all three HubSpot identifiers onto the Shopify order, which is what makes
  // the round-trip association (portal -> Shopify -> HubSpot PO) possible.
  const payload = {
    input: {
      lineItems: data.items.map((i) => ({
        sku: i.sku,
        title: i.name,
        quantity: i.qty,
        originalUnitPrice: centsToDecimalString(i.unitPriceCents),
      })),
      shippingAddress: {
        address1: data.shipTo.address1,
        address2: data.shipTo.address2 ?? null,
        city: data.shipTo.city,
        provinceCode: data.shipTo.state,
        zip: data.shipTo.zip,
        phone: data.shipTo.phone ?? null,
        countryCode: "US",
      },
      billingAddress: {
        address1: data.billTo.address1,
        address2: data.billTo.address2 ?? null,
        city: data.billTo.city,
        provinceCode: data.billTo.state,
        zip: data.billTo.zip,
        countryCode: "US",
      },
      email: data.email,
      note: data.orderNotes ?? "",
      customAttributes: [
        { key: "po_number", value: data.poNumber },
        { key: "hubspot_company_id", value: data.hubspotCompanyId },
        { key: "hubspot_location_id", value: data.hubspotLocationId },
        { key: "hubspot_contact_id", value: data.hubspotContactId },
      ],
      tags: ["portal-order"],
      shippingLine: {
        title: data.shippingCents === 0 ? "Free Shipping" : "Standard Shipping",
        price: centsToDecimalString(data.shippingCents),
      },
      ...(data.paymentTerms
        ? { paymentTerms: { paymentTermsType: data.paymentTerms.type, dueInDays: data.paymentTerms.dueInDays } }
        : {}),
    },
  };

  await db.insert(integrationLogTable).values({
    orderId,
    system: "shopify",
    operation: "draftOrderCreate",
    direction: "outbound",
    payloadJson: payload as unknown as Record<string, unknown>,
    resultJson: { shopifyOrderId, shopifyOrderNumber, status: "created" } as Record<string, unknown>,
  });

  return { shopifyOrderId, shopifyOrderNumber };
}
