import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { portalUsersTable } from "./portal-users";

export const locationRequestsTable = pgTable("location_requests", {
  id: serial("id").primaryKey(),
  hubspotCompanyId: text("hubspot_company_id").notNull(),
  requestedByUserId: integer("requested_by_user_id")
    .notNull()
    .references(() => portalUsersTable.id),
  nickname: text("nickname").notNull(),
  address1: text("address1").notNull(),
  address2: text("address2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  phone: text("phone"),
  validated: boolean("validated").notNull().default(false),
  placeId: text("place_id"),
  status: text("status").notNull().default("pending"),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LocationRequest = typeof locationRequestsTable.$inferSelect;
