import { asc, eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import { adminUsersTable, db } from "@workspace/db";
import { getEnvAdminIds, requireAdmin } from "../lib/admin-auth";
import { logAudit } from "../lib/audit";
import { hashPassword } from "../lib/password";

const router: IRouter = Router();
router.use("/admin/users", requireAdmin);

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;
const MIN_PASSWORD = 10;

function parseId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "معرّف غير صحيح" });
    return null;
  }
  return id;
}

function publicUser(row: typeof adminUsersTable.$inferSelect) {
  return {
    id: row.id,
    adminId: row.adminId,
    displayName: row.displayName,
    active: row.active,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    lastLoginAt: row.lastLoginAt,
  };
}

function checkPassword(value: unknown): string | null {
  if (typeof value !== "string" || value.length < MIN_PASSWORD) return `كلمة المرور ${MIN_PASSWORD} أحرف على الأقل`;
  if (value.length > 128) return "كلمة المرور طويلة جداً";
  return null;
}

router.get("/admin/users", async (_req, res): Promise<void> => {
  const rows = await db.select().from(adminUsersTable).orderBy(asc(adminUsersTable.createdAt));
  res.json({ me: res.locals.adminId, system: getEnvAdminIds(), users: rows.map(publicUser) });
});

router.post("/admin/users", async (req, res): Promise<void> => {
  const adminId = typeof req.body?.adminId === "string" ? req.body.adminId.trim().toLowerCase() : "";
  const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim().slice(0, 80) : "";
  if (!ID_PATTERN.test(adminId)) {
    res.status(400).json({ error: "معرّف الدخول: 3 إلى 32 حرفاً إنجليزياً صغيراً أو أرقاماً (يسمح بـ . _ -)" });
    return;
  }
  if (getEnvAdminIds().includes(adminId)) {
    res.status(409).json({ error: "هذا المعرّف محجوز لحساب النظام" });
    return;
  }
  const passwordError = checkPassword(req.body?.password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }
  const [exists] = await db.select({ id: adminUsersTable.id }).from(adminUsersTable).where(eq(adminUsersTable.adminId, adminId)).limit(1);
  if (exists) {
    res.status(409).json({ error: "المعرّف مستخدم من قبل" });
    return;
  }
  const [row] = await db
    .insert(adminUsersTable)
    .values({ adminId, displayName, passwordHash: hashPassword(req.body.password), createdBy: String(res.locals.adminId) })
    .returning();
  await logAudit(req, res, "create", "admin_user", row.id, `إضافة مسؤول جديد (${adminId})`);
  res.status(201).json(publicUser(row));
});

router.patch("/admin/users/:id", async (req, res): Promise<void> => {
  const id = parseId(req, res);
  if (id === null) return;
  const [row] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
  if (!row) {
    res.status(404).json({ error: "الحساب غير موجود" });
    return;
  }
  const patch: Partial<typeof adminUsersTable.$inferInsert> = {};
  const notes: string[] = [];
  if (typeof req.body?.displayName === "string") patch.displayName = req.body.displayName.trim().slice(0, 80);
  if (typeof req.body?.active === "boolean") {
    if (!req.body.active && row.adminId === res.locals.adminId) {
      res.status(400).json({ error: "لا يمكنك إيقاف حسابك الحالي" });
      return;
    }
    patch.active = req.body.active;
    notes.push(req.body.active ? "تفعيل" : "إيقاف");
  }
  if (req.body?.password !== undefined) {
    const passwordError = checkPassword(req.body.password);
    if (passwordError) {
      res.status(400).json({ error: passwordError });
      return;
    }
    patch.passwordHash = hashPassword(req.body.password);
    notes.push("تغيير كلمة المرور");
  }
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "لا يوجد تغيير" });
    return;
  }
  const [updated] = await db.update(adminUsersTable).set(patch).where(eq(adminUsersTable.id, id)).returning();
  await logAudit(req, res, "update", "admin_user", id, `${notes.join(" + ") || "تعديل بيانات"} للمسؤول ${row.adminId}`);
  res.json(publicUser(updated));
});

router.delete("/admin/users/:id", async (req, res): Promise<void> => {
  const id = parseId(req, res);
  if (id === null) return;
  const [row] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
  if (!row) {
    res.status(404).json({ error: "الحساب غير موجود" });
    return;
  }
  if (row.adminId === res.locals.adminId) {
    res.status(400).json({ error: "لا يمكنك حذف حسابك الحالي" });
    return;
  }
  await db.delete(adminUsersTable).where(eq(adminUsersTable.id, id));
  await logAudit(req, res, "delete", "admin_user", id, `حذف المسؤول ${row.adminId}`);
  res.json({ ok: true });
});

export default router;
