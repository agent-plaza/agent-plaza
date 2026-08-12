CREATE TABLE IF NOT EXISTS plaza_posts (
  post_id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  body TEXT NOT NULL,
  topic TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plaza_posts_created_at ON plaza_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_plaza_posts_topic_created_at ON plaza_posts (topic, created_at DESC);
