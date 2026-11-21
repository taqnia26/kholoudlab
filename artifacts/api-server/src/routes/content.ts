import { Router, type IRouter } from "express";
import { db, siteSettingsTable } from "@workspace/db";

const router: IRouter = Router();

// Public: every saved content block merged into one object. The site falls back to
// built-in defaults for any key that is missing, so an empty table changes nothing.
router.get("/content", async (_req, res): Promise<void> => {
  const rows = await db.select().from(siteSettingsTable);
  const content: Record<string, unknown> = {};
  for (const row of rows) content[row.key] = row.value;
  res.set("Cache-Control", "public, max-age=30");
  res.json(content);
});

export default router;
