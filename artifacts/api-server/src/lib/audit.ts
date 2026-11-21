import type { Request, Response } from "express";
import { adminAuditTable, db } from "@workspace/db";

/** Best-effort activity log; never throws so it cannot break the action it records. */
export async function logAudit(
  req: Request,
  res: Response,
  action: string,
  entity: string,
  entityId: string | number,
  summary: string,
): Promise<void> {
  try {
    await db.insert(adminAuditTable).values({
      adminId: String(res.locals.adminId ?? "unknown"),
      action,
      entity,
      entityId: String(entityId),
      summary: summary.slice(0, 300),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to write audit log");
  }
}
