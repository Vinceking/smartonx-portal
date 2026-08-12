import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { hsCompaniesTable } from "./hs-companies";
import { hsBillingProfilesTable } from "./hs-billing-profiles";

export const hsLocationsTable = pgTable("hs_locations", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => hsCompaniesTable.id),
  billingProfileId: text("billing_profile_id")
    .notNull()
    .references(() => hsBillingProfilesTable.id),
  nickname: text("nickname").notNull(),
  address1: text("address1").notNull(),
  address2: text("address2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  phone: text("phone"),
  isDefault: boolean("is_default").notNull().default(false),
  validated: boolean("validated").notNull().default(true),
  placeId: text("place_id"),
  validationSource: text("validation_source").notNull().default("mock"),
});

export type HsLocation = typeof hsLocationsTable.$inferSelect;
