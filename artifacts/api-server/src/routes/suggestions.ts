import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, suggestionsTable, usersTable, commentsTable } from "@workspace/db";
import {
  CreateSuggestionBody,
  CreateSuggestionResponse,
  GetSuggestionParams,
  GetSuggestionResponse,
  DeleteSuggestionParams,
  ListSuggestionsQueryParams,
  ListSuggestionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/suggestions", async (req, res): Promise<void> => {
  const query = ListSuggestionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = query.data.category
    ? eq(suggestionsTable.category, query.data.category)
    : undefined;

  const rows = await db
    .select({
      id: suggestionsTable.id,
      userId: suggestionsTable.userId,
      userName: usersTable.name,
      category: suggestionsTable.category,
      title: suggestionsTable.title,
      description: suggestionsTable.description,
      createdAt: suggestionsTable.createdAt,
      commentCount: sql<number>`cast(count(${commentsTable.id}) as int)`,
    })
    .from(suggestionsTable)
    .leftJoin(usersTable, eq(suggestionsTable.userId, usersTable.id))
    .leftJoin(commentsTable, eq(commentsTable.suggestionId, suggestionsTable.id))
    .where(conditions)
    .groupBy(suggestionsTable.id, usersTable.name)
    .orderBy(desc(suggestionsTable.createdAt));

  res.json(ListSuggestionsResponse.parse(rows));
});

router.post("/suggestions", async (req, res): Promise<void> => {
  const parsed = CreateSuggestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [suggestion] = await db
    .insert(suggestionsTable)
    .values(parsed.data)
    .returning();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, suggestion.userId));

  const result = {
    ...suggestion,
    userName: user?.name ?? "Unknown",
    commentCount: 0,
  };

  res.status(201).json(CreateSuggestionResponse.parse(result));
});

router.get("/suggestions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSuggestionParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: suggestionsTable.id,
      userId: suggestionsTable.userId,
      userName: usersTable.name,
      category: suggestionsTable.category,
      title: suggestionsTable.title,
      description: suggestionsTable.description,
      createdAt: suggestionsTable.createdAt,
      commentCount: sql<number>`cast(count(${commentsTable.id}) as int)`,
    })
    .from(suggestionsTable)
    .leftJoin(usersTable, eq(suggestionsTable.userId, usersTable.id))
    .leftJoin(commentsTable, eq(commentsTable.suggestionId, suggestionsTable.id))
    .where(eq(suggestionsTable.id, params.data.id))
    .groupBy(suggestionsTable.id, usersTable.name);

  if (!row) {
    res.status(404).json({ error: "Suggestion not found" });
    return;
  }

  // Fetch comments with user names
  const commentRows = await db
    .select({
      id: commentsTable.id,
      suggestionId: commentsTable.suggestionId,
      userId: commentsTable.userId,
      userName: usersTable.name,
      content: commentsTable.content,
      createdAt: commentsTable.createdAt,
    })
    .from(commentsTable)
    .leftJoin(usersTable, eq(commentsTable.userId, usersTable.id))
    .where(eq(commentsTable.suggestionId, params.data.id))
    .orderBy(commentsTable.createdAt);

  const detail = {
    ...row,
    comments: commentRows.map((c) => ({
      ...c,
      userName: c.userName ?? "Unknown",
    })),
  };

  res.json(GetSuggestionResponse.parse(detail));
});

router.delete("/suggestions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteSuggestionParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(suggestionsTable).where(eq(suggestionsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
