import { and, asc, eq, isNull, lte, gte, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, heroSlidesTable } from "@workspace/db";

const router: IRouter = Router();

// Public: active slides inside their date window, in display order.
router.get("/slides", async (_req, res): Promise<void> => {
  const now = new Date();
  const rows = await db
    .select({
      id: heroSlidesTable.id,
      title: heroSlidesTable.title,
      updatedAt: heroSlidesTable.updatedAt,
    })
    .from(heroSlidesTable)
    .where(
      and(
        eq(heroSlidesTable.active, true),
        or(isNull(heroSlidesTable.startsAt), lte(heroSlidesTable.startsAt, now)),
        or(isNull(heroSlidesTable.endsAt), gte(heroSlidesTable.endsAt, now)),
      ),
    )
    .orderBy(asc(heroSlidesTable.sortOrder), asc(heroSlidesTable.id));

  res.set("Cache-Control", "public, max-age=60");
  res.json(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      url: `/api/slides/${row.id}/image?v=${row.updatedAt.getTime()}`,
    })),
  );
});

router.get("/slides/:id/image", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(404).end();
    return;
  }
  const [row] = await db
    .select({ mimeType: heroSlidesTable.mimeType, imageData: heroSlidesTable.imageData })
    .from(heroSlidesTable)
    .where(eq(heroSlidesTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).end();
    return;
  }
  res.set("Content-Type", row.mimeType);
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.set("X-Content-Type-Options", "nosniff");
  res.send(row.imageData);
});

export default router;
