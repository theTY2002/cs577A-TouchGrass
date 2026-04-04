-- When each post was created (for feed ordering: newest posts first).
-- Legacy rows: stamp with migration time so they share one baseline; tie-break is p_id.
-- Do not use datetime_start here — future event dates would sort above real "just posted" rows.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE posts SET created_at = now() WHERE created_at IS NULL;

ALTER TABLE posts ALTER COLUMN created_at SET DEFAULT now();
