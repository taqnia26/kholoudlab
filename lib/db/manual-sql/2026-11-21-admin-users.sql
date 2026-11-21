-- Admin accounts managed from the dashboard. Additive only.
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f this-file.sql

BEGIN;

CREATE TABLE IF NOT EXISTS admin_users (
  id            serial PRIMARY KEY,
  admin_id      text NOT NULL UNIQUE,
  display_name  text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  created_by    text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

COMMIT;
