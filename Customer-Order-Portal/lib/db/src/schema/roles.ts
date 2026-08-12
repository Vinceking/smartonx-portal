import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const rolesTable = pgTable("roles", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  label: text("label").notNull(),
  description: text("description").notNull(),
});

export type Role = typeof rolesTable.$inferSelect;
