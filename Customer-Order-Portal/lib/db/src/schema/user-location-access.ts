import { pgTable, serial, text, boolean, integer, unique } from "drizzle-orm/pg-core";
import { portalUsersTable } from "./portal-users";

export const userLocationAccessTable = pgTable(
  "user_location_access",
  {
    id: serial("id").primaryKey(),
    portalUserId: integer("portal_user_id")
      .notNull()
      .references(() => portalUsersTable.id, { onDelete: "cascade" }),
    hubspotLocationId: text("hubspot_location_id").notNull(),
    canOrder: boolean("can_order").notNull().default(true),
  },
  (t) => [unique().on(t.portalUserId, t.hubspotLocationId)],
);

export type UserLocationAccess = typeof userLocationAccessTable.$inferSelect;
