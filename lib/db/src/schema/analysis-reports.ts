import { createInsertSchema } from "drizzle-zod";
import { date, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const analysisReportsTable = pgTable("analysis_reports", {
  id: serial("id").primaryKey(),
  analysisNumber: text("analysis_number").notNull().unique(),
  patientName: text("patient_name").notNull(),
  dateOfBirth: date("date_of_birth", { mode: "string" }).notNull(),
  phoneLast4: text("phone_last4").notNull(),
  verificationCodeHash: text("verification_code_hash").notNull(),
  sampleDate: date("sample_date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("pending"),
  resultValues: jsonb("result_values").$type<Array<{
    name: string;
    value: string;
    unit: string;
    referenceRange: string;
  }>>().notNull().default([]),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAnalysisReportSchema = createInsertSchema(analysisReportsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAnalysisReport = z.infer<typeof insertAnalysisReportSchema>;
export type AnalysisReport = typeof analysisReportsTable.$inferSelect;