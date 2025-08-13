-- Adds transactions & audit_log tables
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  raffle_id INT REFERENCES raffles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('entry','payout','refund','commission_adjust','correction')),
  amount INT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_raffle ON transactions(raffle_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('raffle','system','wallet')),
  ref_id INT,
  action TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_scope ON audit_log(scope);
CREATE INDEX IF NOT EXISTS idx_audit_ref ON audit_log(ref_id);