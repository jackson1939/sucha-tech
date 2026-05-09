CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                 TEXT UNIQUE NOT NULL,
  voice_only_enabled    BOOLEAN NOT NULL DEFAULT true,
  voice_only_max_per_op NUMERIC(18,9) NOT NULL DEFAULT 0.1,
  voice_only_daily_cap  NUMERIC(18,9) NOT NULL DEFAULT 0.5,
  voice_daily_used      NUMERIC(18,9) NOT NULL DEFAULT 0,
  passkey_hash          TEXT,
  recovery_code_hash    TEXT,
  last_voice_reset      TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  simulation_id     TEXT NOT NULL,
  amount            NUMERIC(18,9) NOT NULL,
  token_from        TEXT NOT NULL,
  token_to          TEXT NOT NULL,
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN ('voice','double')),
  confirmed_by      TEXT,
  pin_attempts      INT NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','submitted','confirmed','failed','cancelled')),
  tx_hash           TEXT,
  receipt_id        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

INSERT INTO users (id, email, voice_only_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@vibebroker.dev', true)
ON CONFLICT DO NOTHING;
