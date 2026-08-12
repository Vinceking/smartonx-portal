import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const emailLogTable = pgTable("email_log", {
  id: serial("id").primaryKey(),
  toAddress: text("to_address").notNull(),
  ccAddress: text("cc_address"),
  subject: text("subject").notNull(),
  bodyText: text("body_text").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EmailLog = typeof emailLogTable.$inferSelect;
