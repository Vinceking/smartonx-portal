import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { rolesTable } from "./roles";

export const portalUsersTable = pgTable("portal_users", {
  id: serial("id").primaryKey(),
  hubspotContactId: text("hubspot_contact_id").notNull(),
  hubspotCompanyId: text("hubspot_company_id").notNull(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  roleId: integer("role_id").notNull().references(() => rolesTable.id),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PortalUser = typeof portalUsersTable.$inferSelect;
