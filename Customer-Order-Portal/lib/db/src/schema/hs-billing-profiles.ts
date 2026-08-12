import { pgTable, text, boolean, integer } from "drizzle-orm/pg-core";
import { hsCompaniesTable } from "./hs-companies";

export const hsBillingProfilesTable = pgTable("hs_billing_profiles", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => hsCompaniesTable.id),
  name: text("name").notNull(),
  address1: text("address1").notNull(),
  address2: text("address2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  apEmail: text("ap_email").notNull(),
  apPhone: text("ap_phone"),
  paymentTerms: text("payment_terms").notNull(),
  netDays: integer("net_days"),
  isDefault: boolean("is_default").notNull().default(false),
  validated: boolean("validated").notNull().default(true),
  placeId: text("place_id"),
});

export type HsBillingProfile = typeof hsBillingProfilesTable.$inferSelect;
