import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const hsCompaniesTable = pgTable("hs_companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  orgType: text("org_type").notNull(),
  allowAdminBillingEdit: boolean("allow_admin_billing_edit").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type HsCompany = typeof hsCompaniesTable.$inferSelect;
