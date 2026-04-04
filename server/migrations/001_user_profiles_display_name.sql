-- Run once against your Postgres (e.g. Supabase SQL editor) if signup/login fails
-- on missing column. Safe to re-run.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS display_name text;
