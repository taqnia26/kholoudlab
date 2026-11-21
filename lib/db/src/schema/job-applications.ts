import { customType, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const jobApplicationsTable = pgTable(
  "job_applications",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    position: text("position").notNull().default(""),
    coverLetter: text("cover_letter").notNull().default(""),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull().default(0),
    fileData: bytea("file_data").notNull(),
    status: text("status").notNull().default("new"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [index("job_applications_created_at_idx").on(table.createdAt)],
);

export type JobApplication = typeof jobApplicationsTable.$inferSelect;
