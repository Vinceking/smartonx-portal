import { pgTable, serial, text, boolean } from "drizzle-orm/pg-core";
import { hsCompaniesTable } from "./hs-companies";

export const hsContactsTable = pgTable("hs_contacts", {
  id: text("id").primaryKey(),
  companyId: text("company_id")
    .notNull()
    .references(() => hsCompaniesTable.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  roleTitle: text("role_title").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const hsContactEmailsTable = pgTable("hs_contact_emails", {
  id: serial("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => hsContactsTable.id, { onDelete: "cascade" }),
  email: text("email").unique().notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
});

export type HsContact = typeof hsContactsTable.$inferSelect;
export type HsContactEmail = typeof hsContactEmailsTable.$inferSelect;
