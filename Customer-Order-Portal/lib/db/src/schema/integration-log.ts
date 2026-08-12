import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";

export const integrationLogTable = pgTable("integration_log", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => ordersTable.id),
  system: text("system").notNull(),
  operation: text("operation").notNull(),
  direction: text("direction").notNull().default("outbound"),
  payloadJson: jsonb("payload_json").notNull().$type<Record<string, unknown>>(),
  resultJson: jsonb("result_json").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type IntegrationLog = typeof integrationLogTable.$inferSelect;
