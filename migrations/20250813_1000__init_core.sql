-- Init core schema: users, raffles, raffle_entries, balances, system_settings
-- Idempotency: НЕ запускать повторно без отката. Для последующих изменений — новые файлы.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  total_entries INT DEFAULT 0,
  total_wins INT DEFAULT 0,
  total_contributed INT DEFAULT 0,
  total_won INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE raffle_status AS ENUM ('init','collecting','ready','drawing','completed','cancelled');

CREATE TABLE IF NOT EXISTS raffles (
  id SERIAL PRIMARY KEY,
  status raffle_status NOT NULL DEFAULT 'init',
  threshold INT NOT NULL,
  entry_cost INT NOT NULL DEFAULT 1,
  winner_share_percent INT NOT NULL DEFAULT 70,
  commission_percent INT NOT NULL DEFAULT 30,
  total_entries INT NOT NULL DEFAULT 0,
  total_fund INT NOT NULL DEFAULT 0,
  seed_hash TEXT,
  seed_revealed TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  ready_at TIMESTAMPTZ,
  draw_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  forced BOOLEAN DEFAULT false,
  cancelled_reason TEXT,
  auto_started_due_to_timeout BOOLEAN DEFAULT false,
  grace_seconds INT NOT NULL DEFAULT 30
);

CREATE TABLE IF NOT EXISTS raffle_entries (
  id SERIAL PRIMARY KEY,
  raffle_id INT NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  entry_sequence INT NOT NULL,
  refunded BOOLEAN NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_raffle_user ON raffle_entries(raffle_id, user_id);
CREATE INDEX IF NOT EXISTS idx_entries_raffle ON raffle_entries(raffle_id);

CREATE TABLE IF NOT EXISTS balances (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Начальные настройки (пример)
INSERT INTO system_settings (key,value) VALUES
  ('default_threshold','1000'),
  ('winner_share_percent','70'),
  ('commission_percent','30')
ON CONFLICT (key) DO NOTHING;