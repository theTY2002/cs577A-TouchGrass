-- Cover image for each post (data URL or external URL)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;
