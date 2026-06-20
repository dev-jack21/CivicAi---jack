-- 20260620000002_categories.sql
-- Policy categories lookup table

CREATE TABLE public.categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,  -- e.g. 'Health', 'Education', 'Finance'
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data
INSERT INTO public.categories (name, slug) VALUES
  ('Health', 'health'),
  ('Education', 'education'),
  ('Finance & Budget', 'finance'),
  ('Environment', 'environment'),
  ('Infrastructure', 'infrastructure'),
  ('Agriculture', 'agriculture'),
  ('Security & Defence', 'security'),
  ('Land & Housing', 'land'),
  ('General', 'general');