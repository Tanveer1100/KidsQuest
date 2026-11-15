import { sql } from "drizzle-orm";
import { pgTable, serial, text, timestamp, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const childrenTable = pgTable("children", {
  id: serial("id").primaryKey(),
  parentId: text("parent_id").notNull(),
  nickname: text("nickname").notNull(),
  ageBucket: text("age_bucket").notNull(),
  defaultLanguage: text("default_language").notNull(),
  countryOfResidence: text("country_of_residence").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("children_parent_id_idx").on(table.parentId),
  check("children_age_bucket_check", sql`${table.ageBucket} in ('3-5', '6-8', '9-12')`),
  check("children_nickname_check", sql`length(trim(${table.nickname})) between 1 and 40`),
  check("children_language_check", sql`length(trim(${table.defaultLanguage})) between 2 and 80`),
  check("children_country_check", sql`${table.countryOfResidence} ~ '^[A-Z]{2}$'`),
]);

export const insertChildSchema = createInsertSchema(childrenTable).omit({ id: true, createdAt: true });
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof childrenTable.$inferSelect;
