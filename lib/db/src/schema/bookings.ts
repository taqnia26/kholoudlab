import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const bookingsTable = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    testType: text("test_type").notNull(),
    status: text("status").notNull().default("new"),
    notes: text("notes").notNull().default(""),
    emailSent: integer("email_sent").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [index("bookings_created_at_idx").on(table.createdAt), index("bookings_status_idx").on(table.status)],
);

export type Booking = typeof bookingsTable.$inferSelect;
