import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { analysisReportsTable } from "./analysis-reports";

export const resultVerificationChallengesTable = pgTable("result_verification_challenges", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  reportId: integer("report_id").references(() => analysisReportsTable.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});