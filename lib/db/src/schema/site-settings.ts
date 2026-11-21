import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// One row per editable content block (contact, hero, services, faq, cta, announcement, seo, sections).
export const siteSettingsTable = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedBy: text("updated_by").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type SiteSetting = typeof siteSettingsTable.$inferSelect;
