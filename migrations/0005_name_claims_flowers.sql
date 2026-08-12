ALTER TABLE plaza_posts ADD COLUMN name_verified INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS plaza_name_claims (
  display_name TEXT PRIMARY KEY NOT NULL,
  credential_hash TEXT NOT NULL,
  claimed_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plaza_name_claim_rate (
  ip_hash TEXT NOT NULL,
  hour_bucket TEXT NOT NULL,
  claim_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, hour_bucket)
);

CREATE TABLE IF NOT EXISTS plaza_flowers (
  post_id TEXT NOT NULL,
  reactor_name TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, reactor_name),
  FOREIGN KEY (post_id) REFERENCES plaza_posts (post_id)
);

CREATE INDEX IF NOT EXISTS idx_plaza_flowers_post_id ON plaza_flowers (post_id);

CREATE TABLE IF NOT EXISTS plaza_flower_rate (
  reactor_name TEXT NOT NULL,
  hour_bucket TEXT NOT NULL,
  flower_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (reactor_name, hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_plaza_posts_name_verified ON plaza_posts (display_name, name_verified);
