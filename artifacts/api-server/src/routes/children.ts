import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { CreateChildBody, UpdateChildBody } from "@workspace/api-zod";
import { childrenTable, db } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { countries } from "countries-list";

const router: IRouter = Router();

// The parent identity always comes from the verified session, never the body.
router.use("/children", (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Please sign in to access child profiles." });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  next();
});

router.get("/children", async (req, res, next) => {
  try {
    const parentId = getAuth(req).userId!;
    const rows = await db.select({
      id: childrenTable.id,
      nickname: childrenTable.nickname,
      ageBucket: childrenTable.ageBucket,
      defaultLanguage: childrenTable.defaultLanguage,
      countryOfResidence: childrenTable.countryOfResidence,
      createdAt: childrenTable.createdAt,
    }).from(childrenTable)
      .where(eq(childrenTable.parentId, parentId))
      .orderBy(desc(childrenTable.createdAt), desc(childrenTable.id));
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.post("/children", async (req, res, next) => {
  try {
    // Reject unknown fields, including attempts to supply another parent ID.
    const result = CreateChildBody.strict().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Please provide a nickname, a valid age group, language, and country." });
      return;
    }
    const data = {
      ...result.data,
      nickname: result.data.nickname.trim(),
      defaultLanguage: result.data.defaultLanguage.trim(),
    };
    if (!data.nickname || data.defaultLanguage.length < 2 || !Object.hasOwn(countries, data.countryOfResidence)) {
      res.status(400).json({ error: "Please check the nickname, language, and country." });
      return;
    }
    const [row] = await db.insert(childrenTable).values({
      ...data,
      parentId: getAuth(req).userId!,
    }).returning({
      id: childrenTable.id,
      nickname: childrenTable.nickname,
      ageBucket: childrenTable.ageBucket,
      defaultLanguage: childrenTable.defaultLanguage,
      countryOfResidence: childrenTable.countryOfResidence,
      createdAt: childrenTable.createdAt,
    });
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
});

router.patch("/children/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      res.status(400).json({ error: "Please choose a valid profile." });
      return;
    }

    // Nickname is intentionally not part of this strict update schema.
    const result = UpdateChildBody.strict().safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Please provide a valid age range, language, and country." });
      return;
    }

    const data = {
      ...result.data,
      defaultLanguage: result.data.defaultLanguage.trim(),
    };
    if (data.defaultLanguage.length < 2 || !Object.hasOwn(countries, data.countryOfResidence)) {
      res.status(400).json({ error: "Please check the language and country." });
      return;
    }

    const [row] = await db.update(childrenTable)
      .set(data)
      .where(and(
        eq(childrenTable.id, id),
        eq(childrenTable.parentId, getAuth(req).userId!),
      ))
      .returning({
        id: childrenTable.id,
        nickname: childrenTable.nickname,
        ageBucket: childrenTable.ageBucket,
        defaultLanguage: childrenTable.defaultLanguage,
        countryOfResidence: childrenTable.countryOfResidence,
        createdAt: childrenTable.createdAt,
      });

    if (!row) {
      res.status(404).json({ error: "This profile isn’t available on your account." });
      return;
    }
    res.json(row);
  } catch (error) {
    next(error);
  }
});

export default router;
