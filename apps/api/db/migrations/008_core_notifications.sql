CREATE TYPE core.notification_category AS ENUM (
  'account_security',
  'team_collaboration',
  'system_product'
);

CREATE TABLE core.notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  category         core.notification_category NOT NULL,
  type             VARCHAR(100) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  body             TEXT,
  action_url       VARCHAR(512),
  read_at          TIMESTAMPTZ,
  idempotency_key  VARCHAR(255),
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_notification_idempotency UNIQUE (user_id, idempotency_key)
);

CREATE INDEX idx_notifications_user_created
  ON core.notifications (user_id, created_at DESC);

CREATE INDEX idx_notifications_user_read
  ON core.notifications (user_id, read_at);

CREATE TABLE core.notification_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  category        core.notification_category NOT NULL,
  in_app_enabled  BOOLEAN NOT NULL DEFAULT true,
  email_enabled   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_notification_pref_user_category UNIQUE (user_id, category)
);

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON core.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();
