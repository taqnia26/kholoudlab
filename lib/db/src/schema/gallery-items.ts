import { boolean, customType, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// kind: 'gallery' (offer grid) or 'package' (the two package banners).
export const galleryItemsTable = pgTable(
  "gallery_items",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull().default("gallery"),
    title: text("title").notNull().default(""),
    caption: text("caption").notNull().default(""),
    mimeType: text("mime_type").notNull(),
    imageData: bytea("image_data").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [index("gallery_items_kind_sort_idx").on(table.kind, table.sortOrder)],
);

export type GalleryItem = typeof galleryItemsTable.$inferSelect;
