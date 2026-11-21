import { and, asc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, galleryItemsTable } from "@workspace/db";

const router: IRouter = Router();

// Public: active items of one kind in display order.
router.get("/gallery", async (req, res): Promise<void> => {
  const kind = req.query.kind === "package" ? "package" : "gallery";
  const rows = await db
    .select({
      id: galleryItemsTable.id,
      title: galleryItemsTable.title,
      caption: galleryItemsTable.caption,
      updatedAt: galleryItemsTable.updatedAt,
    })
    .from(galleryItemsTable)
    .where(and(eq(galleryItemsTable.kind, kind), eq(galleryItemsTable.active, true)))
    .orderBy(asc(galleryItemsTable.sortOrder), asc(galleryItemsTable.id));
  res.set("Cache-Control", "public, max-age=60");
  res.json(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      caption: row.caption,
      url: `/api/gallery/${row.id}/image?v=${row.updatedAt.getTime()}`,
    })),
  );
});

router.get("/gallery/:id/image", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(404).end();
    return;
  }
  const [row] = await db
    .select({ mimeType: galleryItemsTable.mimeType, imageData: galleryItemsTable.imageData })
    .from(galleryItemsTable)
    .where(eq(galleryItemsTable.id, id))
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
