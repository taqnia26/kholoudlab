import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { analysisReportsTable } from "./analysis-reports";

export const resultStatusAuditTable = pgTable("result_status_audit", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => analysisReportsTable.id),
  staffId: text("staff_id").notNull(),
  previousStatus: text("previous_status").notNull(),
  nextStatus: text("next_status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});