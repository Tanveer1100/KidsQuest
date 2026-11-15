import { sql } from "drizzle-orm";
import { pgTable, serial, text, timestamp, integer, jsonb, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { childrenTable } from "./children";

export type LearningPlan = {
  title: string;
  goal: string;
  durationWeeks: number;
  sessionsPerWeek: number;
  minutesPerSession: number;
  steps: { title: string; description: string; successCriteria: string }[];
  activityApproach: string;
  successCriteria: string;
  assumptions: string[];
};
export type PlanningMessage = { id: string; role: "parent" | "assistant"; text: string; blocked?: boolean };

export const adventuresTable = pgTable("learning_adventures", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => childrenTable.id),
  parentId: text("parent_id").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("draft"),
  title: text("title").notNull().default("New learning adventure"),
  messages: jsonb("messages").$type<PlanningMessage[]>().notNull().default([]),
  plan: jsonb("plan").$type<LearningPlan | null>(),
  revision: integer("revision").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [
  index("adventures_parent_child_idx").on(t.parentId, t.childId),
  check("adventures_subject_check", sql`${t.subject} in ('math','english-reading','science','second-language')`),
  check("adventures_status_check", sql`${t.status} in ('draft','active','completed')`),
]);

export const planningUsageTable = pgTable("planning_usage", {
  id: serial("id").primaryKey(),
  parentId: text("parent_id").notNull(),
  day: text("day").notNull(),
  calls: integer("calls").notNull().default(0),
}, (t) => [uniqueIndex("planning_usage_parent_day_idx").on(t.parentId, t.day)]);

export const insertAdventureSchema = createInsertSchema(adventuresTable).omit({ id: true, createdAt: true, updatedAt: true });
export type Adventure = typeof adventuresTable.$inferSelect;
