-- Admin dashboard tables for Kholoud Lab.
-- Additive only: CREATE TABLE IF NOT EXISTS. No drops, no alters, no data changes.
-- Apply manually (after a pg_dump backup):  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f this-file.sql

BEGIN;

CREATE TABLE IF NOT EXISTS bookings (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  phone       text NOT NULL,
  test_type   text NOT NULL,
  status      text NOT NULL DEFAULT 'new',
  notes       text NOT NULL DEFAULT '',
  email_sent  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings (created_at);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

CREATE TABLE IF NOT EXISTS job_applications (
  id           serial PRIMARY KEY,
  name         text NOT NULL,
  email        text NOT NULL,
  phone        text NOT NULL,
  position     text NOT NULL DEFAULT '',
  cover_letter text NOT NULL DEFAULT '',
  file_name    text NOT NULL,
  file_type    text NOT NULL,
  file_size    integer NOT NULL DEFAULT 0,
  file_data    bytea NOT NULL,
  status       text NOT NULL DEFAULT 'new',
  notes        text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_applications_created_at_idx ON job_applications (created_at);

CREATE TABLE IF NOT EXISTS hero_slides (
  id          serial PRIMARY KEY,
  title       text NOT NULL DEFAULT '',
  mime_type   text NOT NULL,
  image_data  bytea NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hero_slides_sort_idx ON hero_slides (sort_order);

COMMIT;
