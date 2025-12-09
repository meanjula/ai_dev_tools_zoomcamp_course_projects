-- Schema for CodeCollab app
-- Idempotent table creation statements

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  language TEXT NOT NULL,
  code TEXT DEFAULT '',
  owner_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_owner FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_participants (
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  cursor_line INTEGER,
  cursor_column INTEGER,
  PRIMARY KEY (session_id, user_id),
  CONSTRAINT fk_participant_session FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_participant_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID,
  user_id UUID,
  code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_session FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  CONSTRAINT fk_history_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Optional: extension for gen_random_uuid if Postgres supports pgcrypto
-- This will be executed only if the extension does not exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END$$;

-- Ensure updated_at is refreshed on update
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON sessions;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
