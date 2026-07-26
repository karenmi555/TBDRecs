import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, suggestionsTable } from "@workspace/db";
import { GetSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/summary", async (_req, res): Promise<void> => {
  const [counts] = await db
    .select({
      total: sql<number>`cast(count(*) as int)`,
      books: sql<number>`cast(sum(case when ${suggestionsTable.category} = 'book' then 1 else 0 end) as int)`,
      movies: sql<number>`cast(sum(case when ${suggestionsTable.category} = 'movie' then 1 else 0 end) as int)`,
      tv: sql<number>`cast(sum(case when ${suggestionsTable.category} = 'tv' then 1 else 0 end) as int)`,
      restaurants: sql<number>`cast(sum(case when ${suggestionsTable.category} = 'restaurant' then 1 else 0 end) as int)`,
      hotels: sql<number>`cast(sum(case when ${suggestionsTable.category} = 'hotel' then 1 else 0 end) as int)`,
    })
    .from(suggestionsTable);

  res.json(GetSummaryResponse.parse({
    total: counts.total ?? 0,
    books: counts.books ?? 0,
    movies: counts.movies ?? 0,
    tv: counts.tv ?? 0,
    restaurants: counts.restaurants ?? 0,
    hotels: counts.hotels ?? 0,
  }));
});

export default router;
