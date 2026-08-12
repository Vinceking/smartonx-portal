import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { portalUsersTable } from "./portal-users";

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  portalUserId: integer("portal_user_id")
    .notNull()
    .references(() => portalUsersTable.id, { onDelete: "cascade" }),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export type PasswordResetToken = typeof passwordResetTokensTable.$inferSelect;
