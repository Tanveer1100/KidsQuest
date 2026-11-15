import { z } from "zod";

export const SUBJECT_NAMES = {
  math: "Math",
  "english-reading": "English reading",
  science: "Science",
  "second-language": "Second language",
} as const;
export type Subject = keyof typeof SUBJECT_NAMES;

const text = (max: number) => z.string().trim().min(1).max(max);
export const planSchema = z.object({
  title: text(100),
  goal: text(600),
  durationWeeks: z.number().int().min(1).max(26),
  sessionsPerWeek: z.number().int().min(1).max(7),
  minutesPerSession: z.number().int().min(5).max(45),
  steps: z.array(z.object({
    title: text(100),
    description: text(700),
    successCriteria: text(500),
  }).strict()).min(1).max(12),
  activityApproach: text(1000),
  successCriteria: text(700),
  assumptions: z.array(text(300)).max(8),
}).strict();

export const replySchema = z.object({
  kind: z.enum(["question", "draft"]),
  message: text(1200),
  plan: planSchema.nullable(),
}).strict().superRefine((value, ctx) => {
  if ((value.kind === "draft") !== (value.plan !== null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Draft must include a plan; question must not." });
  }
});

// Fast, deterministic rejection is an additional layer, not the relevance classifier.
export function obviousAttack(message: string): boolean {
  const normalized = message.normalize("NFKC").replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, "");
  return /(?:ignore|override|bypass|forget|disregard).{0,50}(?:instructions|rules|guardrails|prompt)|(?:reveal|print|show|repeat|leak).{0,40}(?:system prompt|api key|secret|internal instructions)|(?:developer|system)\s*[:>]|jailbreak|pretend (?:you are|to be)|(?:decode|base64|rot13).{0,60}(?:follow|execute|instructions)|https?:\/\/|<script|javascript:/is.test(normalized);
}

export function safeDisplayText(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return !/https?:\/\/|<script|javascript:|```|AIza[A-Za-z0-9_-]{20,}|sk_(?:live|test)_[A-Za-z0-9]+/i.test(serialized);
}

export function redirectFor(subject: Subject): string {
  return `I can only help create or adjust a ${SUBJECT_NAMES[subject]} learning adventure. Tell me what your child would like to learn, or how you'd like to adjust the plan.`;
}
