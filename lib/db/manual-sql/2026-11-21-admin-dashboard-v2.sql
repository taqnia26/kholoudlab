-- Admin dashboard v2: editable site content, gallery, audit log.
-- Additive only (CREATE ... IF NOT EXISTS). Run after 2026-11-21-admin-dashboard.sql.
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f this-file.sql

BEGIN;

CREATE TABLE IF NOT EXISTS site_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_by  text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery_items (
  id          serial PRIMARY KEY,
  kind        text NOT NULL DEFAULT 'gallery',
  title       text NOT NULL DEFAULT '',
  caption     text NOT NULL DEFAULT '',
  mime_type   text NOT NULL,
  image_data  bytea NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gallery_items_kind_sort_idx ON gallery_items (kind, sort_order);

CREATE TABLE IF NOT EXISTS admin_audit (
  id          serial PRIMARY KEY,
  admin_id    text NOT NULL,
  action      text NOT NULL,
  entity      text NOT NULL,
  entity_id   text NOT NULL DEFAULT '',
  summary     text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_created_at_idx ON admin_audit (created_at);

COMMIT;
