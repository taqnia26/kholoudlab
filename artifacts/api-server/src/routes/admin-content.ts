import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { adminAuditTable, db, galleryItemsTable, siteSettingsTable } from "@workspace/db";
import { requireAdmin } from "../lib/admin-auth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();
router.use("/admin", requireAdmin);

const CONTENT_KEYS = ["contact", "hero", "services", "faq", "cta", "announcement", "seo", "sections"] as const;
const KEY_LABELS: Record<string, string> = {
  contact: "بيانات التواصل",
  hero: "واجهة الصفحة الرئيسية",
  services: "الخدمات",
  faq: "الأسئلة الشائعة",
  cta: "قسم الدعوة للحجز",
  announcement: "شريط الإعلان",
  seo: "إعدادات SEO",
  sections: "ظهور الأقسام",
};
const MAX_CONTENT_BYTES = 200 * 1024;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;

function parseId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return null;
  }
  return id;
}

function hasImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (mimeType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

// --- editable content blocks ----------------------------------------------
router.get("/admin/content", async (_req, res): Promise<void> => {
  const rows = await db.select().from(siteSettingsTable);
  const content: Record<string, { value: unknown; updatedAt: Date; updatedBy: string }> = {};
  for (const row of rows) content[row.key] = { value: row.value, updatedAt: row.updatedAt, updatedBy: row.updatedBy };
  res.json(content);
});

router.put("/admin/content/:key", async (req, res): Promise<void> => {
  const key = req.params.key;
  if (!(CONTENT_KEYS as readonly string[]).includes(key)) {
    res.status(404).json({ error: "Unknown content key" });
    return;
  }
  const value = req.body?.value;
  if (value === undefined || value === null || typeof value !== "object") {
    res.status(400).json({ error: "Invalid content" });
    return;
  }
  if (Buffer.byteLength(JSON.stringify(value)) > MAX_CONTENT_BYTES) {
    res.status(413).json({ error: "المحتوى كبير جداً" });
    return;
  }
  const adminId = String(res.locals.adminId);
  await db
    .insert(siteSettingsTable)
    .values({ key, value, updatedBy: adminId })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value, updatedBy: adminId, updatedAt: new Date() } });
  await logAudit(req, res, "update", "content", key, `تعديل: ${KEY_LABELS[key] ?? key}`);
  res.json({ success: true });
});

router.delete("/admin/content/:key", async (req, res): Promise<void> => {
  const key = req.params.key;
  if (!(CONTENT_KEYS as readonly string[]).includes(key)) {
    res.status(404).json({ error: "Unknown content key" });
    return;
  }
  await db.delete(siteSettingsTable).where(eq(siteSettingsTable.key, key));
  await logAudit(req, res, "reset", "content", key, `استرجاع الافتراضي: ${KEY_LABELS[key] ?? key}`);
  res.json({ success: true });
});

// --- gallery / package images ---------------------------------------------
const galleryColumns = {
  id: galleryItemsTable.id,
  kind: galleryItemsTable.kind,
  title: galleryItemsTable.title,
  caption: galleryItemsTable.caption,
  sortOrder: galleryItemsTable.sortOrder,
  active: galleryItemsTable.active,
  updatedAt: galleryItemsTable.updatedAt,
};

function withUrl<T extends { id: number; updatedAt: Date }>(row: T) {
  return { ...row, url: `/api/gallery/${row.id}/image?v=${row.updatedAt.getTime()}` };
}

function kindOf(value: unknown): "gallery" | "package" {
  return value === "package" ? "package" : "gallery";
}

router.get("/admin/gallery", async (req, res): Promise<void> => {
  const rows = await db
    .select(galleryColumns)
    .from(galleryItemsTable)
    .where(eq(galleryItemsTable.kind, kindOf(req.query.kind)))
    .orderBy(asc(galleryItemsTable.sortOrder), asc(galleryItemsTable.id));
  res.json(rows.map(withUrl));
});

router.post("/admin/gallery", async (req, res): Promise<void> => {
  const { title, caption, mimeType, imageData } = req.body ?? {};
  const kind = kindOf(req.body?.kind);
  if (
    typeof mimeType !== "string" ||
    !(IMAGE_TYPES as readonly string[]).includes(mimeType) ||
    typeof imageData !== "string" ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(imageData.replace(/\s/g, ""))
  ) {
    res.status(400).json({ error: "صيغة الصورة غير مدعومة (WebP أو JPG أو PNG)" });
    return;
  }
  const buffer = Buffer.from(imageData.replace(/\s/g, ""), "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    res.status(413).json({ error: "حجم الصورة يجب ألا يتجاوز 3 ميجابايت" });
    return;
  }
  if (!hasImageSignature(buffer, mimeType)) {
    res.status(400).json({ error: "محتوى الملف لا يطابق نوع الصورة" });
    return;
  }
  const [{ next }] = (await db.execute(
    sql`select coalesce(max(sort_order), 0) + 1 as next from gallery_items where kind = ${kind}`,
  )).rows as Array<{ next: number }>;
  const [row] = await db
    .insert(galleryItemsTable)
    .values({
      kind,
      title: typeof title === "string" ? title.trim().slice(0, 120) : "",
      caption: typeof caption === "string" ? caption.trim().slice(0, 200) : "",
      mimeType,
      imageData: buffer,
      sortOrder: Number(next),
    })
    .returning(galleryColumns);
  await logAudit(req, res, "create", kind === "package" ? "package" : "gallery", row.id, `إضافة صورة (${kind === "package" ? "باقات" : "معرض"})`);
  res.status(201).json(withUrl(row));
});

router.post("/admin/gallery/reorder", async (req, res): Promise<void> => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 300 || !ids.every((v) => Number.isInteger(v) && v > 0)) {
    res.status(400).json({ error: "Invalid ids" });
    return;
  }
  await db.transaction(async (tx) => {
    for (const [index, id] of (ids as number[]).entries()) {
      await tx.update(galleryItemsTable).set({ sortOrder: index + 1 }).where(eq(galleryItemsTable.id, id));
    }
  });
  await logAudit(req, res, "reorder", "gallery", "", "إعادة ترتيب الصور");
  res.json({ success: true });
});

router.patch("/admin/gallery/:id", async (req, res): Promise<void> => {
  const id = parseId(req, res);
  if (id === null) return;
  const update: Partial<{ title: string; caption: string; active: boolean }> = {};
  if (req.body?.title !== undefined) {
    if (typeof req.body.title !== "string") {
      res.status(400).json({ error: "Invalid title" });
      return;
    }
    update.title = req.body.title.trim().slice(0, 120);
  }
  if (req.body?.caption !== undefined) {
    if (typeof req.body.caption !== "string") {
      res.status(400).json({ error: "Invalid caption" });
      return;
    }
    update.caption = req.body.caption.trim().slice(0, 200);
  }
  if (req.body?.active !== undefined) {
    if (typeof req.body.active !== "boolean") {
      res.status(400).json({ error: "Invalid active" });
      return;
    }
    update.active = req.body.active;
  }
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  const [row] = await db.update(galleryItemsTable).set(update).where(eq(galleryItemsTable.id, id)).returning(galleryColumns);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await logAudit(req, res, "update", "gallery", id, update.active !== undefined ? (update.active ? "إظهار صورة" : "إخفاء صورة") : "تعديل بيانات صورة");
  res.json(withUrl(row));
});

router.delete("/admin/gallery/:id", async (req, res): Promise<void> => {
  const id = parseId(req, res);
  if (id === null) return;
  const deleted = await db
    .delete(galleryItemsTable)
    .where(and(eq(galleryItemsTable.id, id)))
    .returning({ id: galleryItemsTable.id });
  if (deleted.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await logAudit(req, res, "delete", "gallery", id, "حذف صورة");
  res.json({ success: true });
});

// --- activity log ----------------------------------------------------------
router.get("/admin/audit", async (_req, res): Promise<void> => {
  const rows = await db.select().from(adminAuditTable).orderBy(desc(adminAuditTable.createdAt)).limit(300);
  res.json(rows);
});

export default router;
