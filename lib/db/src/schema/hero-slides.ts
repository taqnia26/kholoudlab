import { boolean, customType, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const heroSlidesTable = pgTable(
  "hero_slides",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull().default(""),
    mimeType: text("mime_type").notNull(),
    imageData: bytea("image_data").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [index("hero_slides_sort_idx").on(table.sortOrder)],
);

export type HeroSlide = typeof heroSlidesTable.$inferSelect;
