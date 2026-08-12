import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").unique().notNull(),
  shopifyProductId: text("shopify_product_id"),
  shopifyVariantId: text("shopify_variant_id"),
  name: text("name").notNull(),
  productLine: text("product_line").notNull(),
  description: text("description").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  imageUrl: text("image_url").notNull(),
  active: boolean("active").notNull().default(true),
});

export type Product = typeof productsTable.$inferSelect;
