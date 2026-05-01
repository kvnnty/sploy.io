CREATE TYPE audit.auth_event_type AS ENUM (
  'login_success',
  'login_failure',
  'logout',
  'magic_link_sent',
  'sso_initiated',
  'sso_completed',
  'user_bootstrapped',
  'org_created',
  'membership_changed',
  'session_revoked'
);

CREATE TABLE audit.auth_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  audit.auth_event_type NOT NULL,
  user_id     UUID REFERENCES core.users(id) ON DELETE SET NULL,
  org_id      UUID REFERENCES core.organizations(id) ON DELETE SET NULL,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_events_user ON audit.auth_events (user_id);
CREATE INDEX idx_auth_events_type ON audit.auth_events (event_type);
CREATE INDEX idx_auth_events_created ON audit.auth_events (created_at);
