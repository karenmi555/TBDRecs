import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  CreateUserBody,
  CreateUserResponse,
  DeleteUserParams,
  ListUsersResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db
    .select()
    .from(usersTable)
    .orderBy(usersTable.name);
  res.json(ListUsersResponse.parse(users));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Find existing user with that name (case-insensitive)
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.name, parsed.data.name));

  if (existing) {
    res.status(201).json(CreateUserResponse.parse(existing));
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ name: parsed.data.name })
    .returning();

  res.status(201).json(CreateUserResponse.parse(user));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteUserParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
