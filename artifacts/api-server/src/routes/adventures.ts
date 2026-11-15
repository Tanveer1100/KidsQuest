import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { rateLimit } from "express-rate-limit";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, adventuresTable, childrenTable, planningUsageTable, type Adventure } from "@workspace/db";
import {
  StartAdventureBody, ListAdventuresQueryParams, GetAdventureParams,
  SendPlanningMessageBody, ApproveAdventureBody, GetAdventureResponse,
} from "@workspace/api-zod";
import { obviousAttack, planSchema, redirectFor, SUBJECT_NAMES, type Subject } from "../lib/planning-guards";
import { planTurn } from "../lib/planning-ai";

const router: IRouter = Router();
const owned = (id: number, parentId: string) => and(eq(adventuresTable.id, id), eq(adventuresTable.parentId, parentId));
function output(row: Adventure) {
  return GetAdventureResponse.parse({
    ...row,
    plan: row.plan ?? undefined,
    approvedAt: row.approvedAt ?? undefined,
    completedAt: row.completedAt ?? undefined,
  });
}

router.use("/adventures", (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Please sign in to access learning adventures." });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  next();
});
const limiter = rateLimit({
  windowMs: 60_000,
  limit: 12,
  keyGenerator: (req) => getAuth(req).userId!,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Let’s take a short pause. Please try again in a minute." },
});
router.use("/adventures", (req, res, next) => {
  if (req.method === "POST") { limiter(req, res, next); } else { next(); }
});

router.get("/adventures", async (req, res): Promise<void> => {
  const parsed = ListAdventuresQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Please choose a valid child profile." }); return; }
  const parentId = getAuth(req).userId!;
  const [child] = await db.select().from(childrenTable).where(and(
    eq(childrenTable.id, parsed.data.childId), eq(childrenTable.parentId, parentId),
  ));
  if (!child) { res.status(404).json({ error: "This profile isn’t available on your account." }); return; }
  const rows = await db.select().from(adventuresTable)
    .where(and(eq(adventuresTable.childId, child.id), eq(adventuresTable.parentId, parentId)))
    .orderBy(desc(adventuresTable.updatedAt));
  res.json(rows.map(output));
});

router.post("/adventures", async (req, res): Promise<void> => {
  const parsed = StartAdventureBody.strict().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Please choose a child and subject." }); return; }
  const parentId = getAuth(req).userId!;
  const { childId, subject } = parsed.data;
  const [child] = await db.select().from(childrenTable).where(and(
    eq(childrenTable.id, childId), eq(childrenTable.parentId, parentId),
  ));
  if (!child) { res.status(404).json({ error: "This profile isn’t available on your account." }); return; }
  // Reuse an existing unapproved conversation rather than lose it or create accidental duplicates.
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`adventure-start:${parentId}:${childId}:${subject}`}))`);
    const [draft] = await tx.select().from(adventuresTable).where(and(
      eq(adventuresTable.childId, childId), eq(adventuresTable.parentId, parentId),
      eq(adventuresTable.subject, subject), eq(adventuresTable.status, "draft"),
    )).orderBy(desc(adventuresTable.updatedAt));
    if (draft) return draft;
    const [row] = await tx.insert(adventuresTable).values({
      childId, parentId, subject,
      messages: [{
        id: randomUUID(), role: "assistant",
        text: `Let’s plan a ${SUBJECT_NAMES[subject]} learning adventure. What would you like your child to learn, what can they do already, and how much time can you set aside? A rough idea is enough. Short in-app assessments and lessons aren’t available yet; for now we’ll use your observations.`,
      }],
    }).returning();
    return row;
  });
  res.status(201).json(output(result));
});

router.get("/adventures/:id", async (req, res): Promise<void> => {
  const params = GetAdventureParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Please choose a valid adventure." }); return; }
  const [row] = await db.select().from(adventuresTable).where(owned(params.data.id, getAuth(req).userId!));
  if (!row) { res.status(404).json({ error: "This adventure isn’t available on your account." }); return; }
  res.json(output(row));
});

router.post("/adventures/:id/messages", async (req, res): Promise<void> => {
  const params = GetAdventureParams.safeParse(req.params);
  const body = SendPlanningMessageBody.strict().safeParse(req.body);
  if (!params.success || !body.success || !body.data.message.trim()) {
    res.status(400).json({ error: "Please send a planning message of 1–1,500 characters." }); return;
  }
  const parentId = getAuth(req).userId!;
  const { message, requestId, revision } = body.data;
  const result = await db.transaction(async (tx) => {
    // Cross-instance concurrency control; a parent cannot fan out simultaneous paid requests.
    const lock = await tx.execute(sql`select pg_try_advisory_xact_lock(hashtext(${`planning:${parentId}`})) as locked`);
    if (!lock.rows[0]?.locked) return { status: 409, error: "Your previous planning message is still being processed." };
    const [row] = await tx.select().from(adventuresTable).where(owned(params.data.id, parentId)).for("update");
    if (!row) return { status: 404, error: "This adventure isn’t available on your account." };
    const repeated = row.messages.find((m) => m.id === requestId && m.role === "parent");
    if (repeated) {
      if (repeated.text !== message.trim()) return { status: 409, error: "Please retry with a new message." };
      return { status: 200, row };
    }
    if (row.status !== "draft") return { status: 409, error: "Only unapproved adventures can be changed in this planning chat." };
    if (row.revision !== revision) return { status: 409, error: "This conversation changed. Refresh it before sending again." };
    if (row.messages.length >= 61) return { status: 429, error: "This planning chat has reached its limit. Please approve an existing draft or try a different subject." };
    const [child] = await tx.select().from(childrenTable).where(and(eq(childrenTable.id, row.childId), eq(childrenTable.parentId, parentId)));
    if (!child) return { status: 404, error: "This profile isn’t available." };

    let blocked = obviousAttack(message);
    let reply: Awaited<ReturnType<typeof planTurn>> | undefined;
    if (!blocked) {
      const day = new Date().toISOString().slice(0, 10);
      // Reserve the maximum calls per turn durably, including provider failures.
      const [budget] = await tx.insert(planningUsageTable).values({ parentId, day, calls: 3 })
        .onConflictDoUpdate({
          target: [planningUsageTable.parentId, planningUsageTable.day],
          set: { calls: sql`${planningUsageTable.calls} + 3` },
          setWhere: sql`${planningUsageTable.calls} <= 87`,
        }).returning();
      if (!budget) return { status: 429, error: "You’ve reached today’s planning limit. Your conversation is saved; please return tomorrow." };
      try {
        reply = await planTurn(child, row, message.trim());
        blocked = reply.blocked;
      } catch {
        // Never expose raw provider errors: they can contain input text or credential details.
        req.log.warn({ event: "planning_unavailable" }, "Planning response withheld");
        return { status: 503, error: "We couldn’t safely prepare a planning response. Nothing was approved. Please try again." };
      }
    }
    if (blocked) req.log.info({ event: "planning_redirect" }, "Off-scope planning request redirected");
    const assistantText = blocked ? redirectFor(row.subject as Subject) : reply && !reply.blocked ? reply.reply.message : redirectFor(row.subject as Subject);
    const candidatePlan = !blocked && reply && !reply.blocked ? reply.reply.plan : row.plan;
    const [updated] = await tx.update(adventuresTable).set({
      messages: [...row.messages,
        { id: requestId, role: "parent", text: message.trim(), blocked },
        { id: randomUUID(), role: "assistant", text: assistantText, blocked },
      ],
      plan: candidatePlan,
      title: candidatePlan?.title ?? row.title,
      revision: row.revision + 1,
      updatedAt: new Date(),
    }).where(owned(row.id, parentId)).returning();
    return { status: 200, row: updated };
  });
  if ("error" in result) { res.status(result.status).json({ error: result.error }); return; }
  res.json(output(result.row!));
});

router.post("/adventures/:id/approve", async (req, res): Promise<void> => {
  const params = GetAdventureParams.safeParse(req.params);
  const body = ApproveAdventureBody.strict().safeParse(req.body);
  if (!params.success || !body.success || body.data.confirmed !== true) {
    res.status(400).json({ error: "Review the draft and explicitly approve it." }); return;
  }
  const parentId = getAuth(req).userId!;
  const result = await db.transaction(async (tx) => {
    const [row] = await tx.select().from(adventuresTable).where(owned(params.data.id, parentId)).for("update");
    if (!row) return { status: 404, error: "This adventure isn’t available on your account." };
    if (row.status === "active" && row.revision === body.data.revision + 1) return { status: 200, row };
    if (row.status !== "draft" || row.revision !== body.data.revision || !planSchema.safeParse(row.plan).success) {
      return { status: 409, error: "Please refresh and review the latest complete draft before approving." };
    }
    const [updated] = await tx.update(adventuresTable).set({
      status: "active", approvedAt: new Date(), updatedAt: new Date(), revision: row.revision + 1,
    }).where(owned(row.id, parentId)).returning();
    return { status: 200, row: updated };
  });
  if ("error" in result) { res.status(result.status).json({ error: result.error }); return; }
  res.json(output(result.row!));
});

router.post("/adventures/:id/complete", async (req, res): Promise<void> => {
  const params = GetAdventureParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Please choose a valid adventure." }); return; }
  const parentId = getAuth(req).userId!;
  const [row] = await db.select().from(adventuresTable).where(owned(params.data.id, parentId));
  if (!row) { res.status(404).json({ error: "This adventure isn’t available on your account." }); return; }
  if (row.status === "completed") { res.json(output(row)); return; }
  if (row.status !== "active") { res.status(409).json({ error: "Only approved active adventures can be marked completed." }); return; }
  const [updated] = await db.update(adventuresTable).set({
    status: "completed", completedAt: new Date(), updatedAt: new Date(), revision: row.revision + 1,
  }).where(and(owned(row.id, parentId), eq(adventuresTable.status, "active"))).returning();
  if (!updated) { res.status(409).json({ error: "This adventure changed. Please refresh." }); return; }
  res.json(output(updated));
});

export default router;
