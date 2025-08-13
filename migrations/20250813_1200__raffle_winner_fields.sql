-- Добавление полей для результата розыгрыша и версионирования fairness
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS winner_user_id BIGINT;
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS winner_index INT;
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS participants_hash TEXT;
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS winner_hash TEXT;
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS seed_revealed TEXT;
ALTER TABLE raffles ADD COLUMN IF NOT EXISTS fairness_version TEXT DEFAULT 'v0b';

-- Если в твоей исходной схеме нет draw_at / completed_at (проверь), раскомментируй:
-- ALTER TABLE raffles ADD COLUMN IF NOT EXISTS draw_at TIMESTAMPTZ;
-- ALTER TABLE raffles ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
