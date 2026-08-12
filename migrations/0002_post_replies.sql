ALTER TABLE plaza_posts ADD COLUMN parent_post_id TEXT REFERENCES plaza_posts(post_id);

CREATE INDEX IF NOT EXISTS idx_plaza_posts_parent_created_at ON plaza_posts (parent_post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_plaza_posts_roots_topic ON plaza_posts (topic, created_at DESC) WHERE parent_post_id IS NULL;
