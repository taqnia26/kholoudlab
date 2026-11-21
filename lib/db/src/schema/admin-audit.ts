import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const adminAuditTable = pgTable(
  "admin_audit",
  {
    id: serial("id").primaryKey(),
    adminId: text("admin_id").notNull(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull().default(""),
    summary: text("summary").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("admin_audit_created_at_idx").on(table.createdAt)],
);

export type AdminAudit = typeof adminAuditTable.$inferSelect;
