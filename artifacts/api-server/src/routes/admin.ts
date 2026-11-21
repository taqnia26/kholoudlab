import { asc, desc, eq, sql } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  bookingsTable,
  db,
  heroSlidesTable,
  jobApplicationsTable,
} from "@workspace/db";
import {
  createAdminSession,
  equalSecrets,
  getAdminAccessCode,
  requireAdmin,
} from "../lib/admin-auth";

const router: IRouter = Router();

const BOOKING_STATUSES = ["new", "contacted", "booked", "cancelled"] as const;
const APPLICATION_STATUSES = ["new", "reviewed", "shortlisted", "rejected"] as const;
const MAX_SLIDE_BYTES = 3 * 1024 * 1024;
const SLIDE_MIME_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;

// --- login rate limit (per IP) -------------------------------------------
const loginAttempts = new Map<string, number[]>();
function canTryLogin(req: Request): boolean {
  const key = req.ip || "unknown";
  const now = Date.now();
  const recent = (loginAttempts.get(key) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 10) {
    loginAttempts.set(key, recent);
    return false;
  }
  recent.push(now);
  loginAttempts.set(key, recent);
  return true;
}

function parseId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return null;
  }
  return id;
}

function optionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function hasImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (mimeType === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

// --- session ---------------------------------------------------------------
router.post("/admin/session", (req, res): void => {
  if (!canTryLogin(req)) {
    res.status(429).json({ error: "محاولات كثيرة، حاول بعد دقائق" });
    return;
  }
  const adminId = typeof req.body?.adminId === "string" ? req.body.adminId.trim() : "";
  const accessCode = typeof req.body?.accessCode === "string" ? req.body.accessCode : "";
  const expected = adminId ? getAdminAccessCode(adminId) : null;
  if (!expected || !equalSecrets(expected, accessCode)) {
    req.log.warn("Rejected admin session request");
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }
  req.log.info({ adminId }, "Created admin session");
  res.json({ ...createAdminSession(adminId), adminId });
});

router.use("/admin", requireAdmin);

// --- stats -----------------------------------------------------------------
router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [perDay, topTests, bookingStatus, applicationStatus, resultStatus, totals] = await Promise.all([
    db.execute(sql`
      select to_char(d::date, 'YYYY-MM-DD') as day, coalesce(c.count, 0)::int as count
      from generate_series((now() at time zone 'Asia/Riyadh')::date - 29, (now() at time zone 'Asia/Riyadh')::date, interval '1 day') d
      left join (
        select (created_at at time zone 'Asia/Riyadh')::date as day, count(*) as count
        from bookings group by 1
      ) c on c.day = d::date
      order by d`),
    db.execute(sql`select test_type as name, count(*)::int as count from bookings group by 1 order by 2 desc limit 8`),
    db.execute(sql`select status, count(*)::int as count from bookings group by 1`),
    db.execute(sql`select status, count(*)::int as count from job_applications group by 1`),
    db
      .execute(sql`select status, count(*)::int as count from analysis_reports group by 1`)
      .catch(() => ({ rows: [] as unknown[] })),
    db.execute(sql`
      select
        (select count(*) from bookings)::int as bookings_total,
        (select count(*) from bookings where created_at >= now() - interval '7 days')::int as bookings_7d,
        (select count(*) from bookings where created_at >= date_trunc('day', now() at time zone 'Asia/Riyadh') at time zone 'Asia/Riyadh')::int as bookings_today,
        (select count(*) from job_applications)::int as applications_total,
        (select count(*) from hero_slides where active)::int as slides_active`),
  ]);

  res.json({
    totals: totals.rows[0],
    bookingsPerDay: perDay.rows,
    topTests: topTests.rows,
    bookingStatus: bookingStatus.rows,
    applicationStatus: applicationStatus.rows,
    resultStatus: resultStatus.rows,
  });
});

// --- bookings --------------------------------------------------------------
router.get("/admin/bookings", async (req, res): Promise<void> => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 500, 1), 2000);
  const rows = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt)).limit(limit);
  res.json(rows);
});

router.patch("/admin/bookings/:id", async (req, res): Promise<void> => {
  const id = parseId(req, res);
  if (id === null) return;
  const update: Partial<{ status: string; notes: string }> = {};
  if (req.body?.status !== undefined) {
    if (!(BOOKING_STATUSES as readonly string[]).includes(req.body.status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    update.status = req.body.status;
  }
  if (req.body?.notes !== undefined) {
    if (typeof req.body.notes !== "string" || req.body.notes.length > 2000) {
      res.status(400).json({ error: "Invalid notes" });
      return;
    }
    update.notes = req.body.notes;
  }
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  const [row] = await db.update(bookingsTable).set(update).where(eq(bookingsTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

// --- job applications ------------------------------------------------------
const applicationColumns = {
  id: jobApplicationsTable.id,
  name: jobApplicationsTable.name,
  email: jobApplicationsTable.email,
  phone: jobApplicationsTable.phone,
  position: jobApplicationsTable.position,
  coverLetter: jobApplicationsTable.coverLetter,
  fileName: jobApplicationsTable.fileName,
  fileType: jobApplicationsTable.fileType,
  fileSize: jobApplicationsTable.fileSize,
  status: jobApplicationsTable.status,
  notes: jobApplicationsTable.notes,
  createdAt: jobApplicationsTable.createdAt,
};

router.get("/admin/job-applications", async (_req, res): Promise<void> => {
  const rows = await db
    .select(applicationColumns)
    .from(jobApplicationsTable)
    .orderBy(desc(jobApplicationsTable.createdAt))
    .limit(1000);
  res.json(rows);
});

router.patch("/admin/job-applications/:id", async (req, res): Promise<void> => {
  const id = parseId(req, res);
  if (id === null) return;
  const update: Partial<{ status: string; notes: string }> = {};
  if (req.body?.status !== undefined) {
    if (!(APPLICATION_STATUSES as readonly string[]).includes(req.body.status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    update.status = req.body.status;
  }
  if (req.body?.notes !== undefined) {
    if (typeof req.body.notes !== "string" || req.body.notes.length > 2000) {
      res.status(400).json({ error: "Invalid notes" });
      return;
    }
    update.notes = req.body.notes;
  }
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  const [row] = await db
    .update(jobApplicationsTable)
    .set(update)
    .where(eq(jobApplicationsTable.id, id))
    .returning(applicationColumns);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.get("/admin/job-applications/:id/file", async (req, res): Promise<void> => {
  const id = parseId(req, res);
  if (id === null) return;
  const [row] = await db
    .select({
      fileName: jobApplicationsTable.fileName,
      fileType: jobApplicationsTable.fileType,
      fileData: jobApplicationsTable.fileData,
    })
    .from(jobApplicationsTable)
    .where(eq(jobApplicationsTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.set("Content-Type", row.fileType);
  res.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(row.fileName)}`);
  res.set("X-Content-Type-Options", "nosniff");
  res.send(row.fileData);
});

// --- hero slides -----------------------------------------------------------
const slideColumns = {
  id: heroSlidesTable.id,
  title: heroSlidesTable.title,
  sortOrder: heroSlidesTable.sortOrder,
  active: heroSlidesTable.active,
  startsAt: heroSlidesTable.startsAt,
  endsAt: heroSlidesTable.endsAt,
  updatedAt: heroSlidesTable.updatedAt,
};

function withUrl<T extends { id: number; updatedAt: Date }>(row: T) {
  return { ...row, url: `/api/slides/${row.id}/image?v=${row.updatedAt.getTime()}` };
}

router.get("/admin/slides", async (_req, res): Promise<void> => {
  const rows = await db
    .select(slideColumns)
    .from(heroSlidesTable)
    .orderBy(asc(heroSlidesTable.sortOrder), asc(heroSlidesTable.id));
  res.json(rows.map(withUrl));
});

router.post("/admin/slides", async (req, res): Promise<void> => {
  const { title, mimeType, imageData } = req.body ?? {};
  if (
    typeof mimeType !== "string" ||
    !(SLIDE_MIME_TYPES as readonly string[]).includes(mimeType) ||
    typeof imageData !== "string" ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(imageData.replace(/\s/g, ""))
  ) {
    res.status(400).json({ error: "صيغة الصورة غير مدعومة (WebP أو JPG أو PNG)" });
    return;
  }
  const buffer = Buffer.from(imageData.replace(/\s/g, ""), "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_SLIDE_BYTES) {
    res.status(413).json({ error: "حجم الصورة يجب ألا يتجاوز 3 ميجابايت" });
    return;
  }
  if (!hasImageSignature(buffer, mimeType)) {
    res.status(400).json({ error: "محتوى الملف لا يطابق نوع الصورة" });
    return;
  }
  const startsAt = optionalDate(req.body?.startsAt);
  const endsAt = optionalDate(req.body?.endsAt);
  if (startsAt === undefined && req.body?.startsAt !== undefined) {
    res.status(400).json({ error: "تاريخ البداية غير صالح" });
    return;
  }
  if (endsAt === undefined && req.body?.endsAt !== undefined) {
    res.status(400).json({ error: "تاريخ النهاية غير صالح" });
    return;
  }

  const [{ next }] = (await db.execute(
    sql`select coalesce(max(sort_order), 0) + 1 as next from hero_slides`,
  )).rows as Array<{ next: number }>;

  const [row] = await db
    .insert(heroSlidesTable)
    .values({
      title: typeof title === "string" ? title.trim().slice(0, 120) : "",
      mimeType,
      imageData: buffer,
      sortOrder: Number(next),
      startsAt: startsAt ?? null,
      endsAt: endsAt ?? null,
    })
    .returning(slideColumns);
  res.status(201).json(withUrl(row));
});

router.post("/admin/slides/reorder", async (req, res): Promise<void> => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200 || !ids.every((v) => Number.isInteger(v) && v > 0)) {
    res.status(400).json({ error: "Invalid ids" });
    return;
  }
  await db.transaction(async (tx) => {
    for (const [index, id] of (ids as number[]).entries()) {
      await tx.update(heroSlidesTable).set({ sortOrder: index + 1 }).where(eq(heroSlidesTable.id, id));
    }
  });
  res.json({ success: true });
});

router.patch("/admin/slides/:id", async (req, res): Promise<void> => {
  const id = parseId(req, res);
  if (id === null) return;
  const update: Partial<{ title: string; active: boolean; startsAt: Date | null; endsAt: Date | null }> = {};
  if (req.body?.title !== undefined) {
    if (typeof req.body.title !== "string") {
      res.status(400).json({ error: "Invalid title" });
      return;
    }
    update.title = req.body.title.trim().slice(0, 120);
  }
  if (req.body?.active !== undefined) {
    if (typeof req.body.active !== "boolean") {
      res.status(400).json({ error: "Invalid active" });
      return;
    }
    update.active = req.body.active;
  }
  for (const key of ["startsAt", "endsAt"] as const) {
    if (req.body?.[key] !== undefined) {
      const parsed = optionalDate(req.body[key]);
      if (parsed === undefined) {
        res.status(400).json({ error: "Invalid date" });
        return;
      }
      update[key] = parsed;
    }
  }
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  const [row] = await db.update(heroSlidesTable).set(update).where(eq(heroSlidesTable.id, id)).returning(slideColumns);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(withUrl(row));
});

router.delete("/admin/slides/:id", async (req, res): Promise<void> => {
  const id = parseId(req, res);
  if (id === null) return;
  const deleted = await db.delete(heroSlidesTable).where(eq(heroSlidesTable.id, id)).returning({ id: heroSlidesTable.id });
  if (deleted.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
});


export default router;
