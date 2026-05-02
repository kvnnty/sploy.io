-- Create custom schemas (keep app data separate from auth schema)
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS audit;

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

CREATE TABLE core.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  domain      TEXT UNIQUE,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON core.organizations (slug);
CREATE INDEX idx_organizations_domain ON core.organizations (domain) WHERE domain IS NOT NULL;

CREATE TYPE core.org_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE core.memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  role        core.org_role NOT NULL DEFAULT 'member',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_membership UNIQUE (user_id, org_id)
);

CREATE INDEX idx_memberships_org ON core.memberships (org_id);
CREATE INDEX idx_memberships_user ON core.memberships (user_id);

CREATE TYPE core.sso_provider AS ENUM ('saml');

CREATE TABLE core.sso_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  provider        core.sso_provider NOT NULL DEFAULT 'saml',
  domain          TEXT NOT NULL,
  metadata_url    TEXT,
  metadata_xml    TEXT,
  attribute_mapping JSONB NOT NULL DEFAULT '{}',
  enabled         BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_sso_domain UNIQUE (domain)
);

CREATE INDEX idx_sso_connections_org ON core.sso_connections (org_id);
CREATE INDEX idx_sso_connections_domain ON core.sso_connections (domain);

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

CREATE OR REPLACE FUNCTION core.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON core.users
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON core.organizations
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON core.memberships
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_sso_connections_updated_at
  BEFORE UPDATE ON core.sso_connections
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();
