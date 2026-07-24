import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, commentsTable, usersTable } from "@workspace/db";
import {
  CreateCommentBody,
  CreateCommentResponse,
  DeleteCommentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/comments", async (req, res): Promise<void> => {
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [comment] = await db
    .insert(commentsTable)
    .values(parsed.data)
    .returning();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, comment.userId));

  const result = {
    ...comment,
    userName: user?.name ?? "Unknown",
  };

  res.status(201).json(CreateCommentResponse.parse(result));
});

router.delete("/comments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteCommentParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
