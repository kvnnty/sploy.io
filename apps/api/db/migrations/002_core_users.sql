CREATE TABLE core.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_auth_user FOREIGN KEY (auth_user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_email ON core.users (email);
