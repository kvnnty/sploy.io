CREATE TABLE core.user_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  auth_session_id  TEXT NOT NULL UNIQUE,
  ip_address       TEXT,
  user_agent       TEXT,
  last_active_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_sessions_user_id
  ON core.user_sessions (user_id);

CREATE INDEX idx_user_sessions_user_last_active
  ON core.user_sessions (user_id, last_active_at DESC);
