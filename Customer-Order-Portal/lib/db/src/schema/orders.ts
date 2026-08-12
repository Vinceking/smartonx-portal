import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { portalUsersTable } from "./portal-users";
import { productsTable } from "./products";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").unique().notNull(),
  hubspotCompanyId: text("hubspot_company_id").notNull(),
  hubspotLocationId: text("hubspot_location_id").notNull(),
  hubspotContactId: text("hubspot_contact_id").notNull(),
  portalUserId: integer("portal_user_id")
    .notNull()
    .references(() => portalUsersTable.id),
  placedByRole: text("placed_by_role").notNull(),
  poNumber: text("po_number").notNull(),
  orderNotes: text("order_notes"),
  shipSnapshot: jsonb("ship_snapshot").notNull().$type<Record<string, unknown>>(),
  billingSnapshot: jsonb("billing_snapshot").notNull().$type<Record<string, unknown>>(),
  paymentTermsSnapshot: text("payment_terms_snapshot").notNull(),
  netDaysSnapshot: integer("net_days_snapshot"),
  paymentStatus: text("payment_status").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("submitted"),
  shopifyOrderId: text("shopify_order_id"),
  shopifyOrderNumber: text("shopify_order_number"),
  hubspotPoId: text("hubspot_po_id"),
  hubspotPoStatus: text("hubspot_po_status").notNull().default("pending"),
  orderedAt: timestamp("ordered_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  skuSnapshot: text("sku_snapshot").notNull(),
  nameSnapshot: text("name_snapshot").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  lineTotalCents: integer("line_total_cents").notNull(),
});

export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
