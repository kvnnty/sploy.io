CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  VARCHAR(255) NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);

CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  domain      TEXT UNIQUE,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations (slug);
CREATE INDEX idx_organizations_domain ON organizations (domain) WHERE domain IS NOT NULL;

CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role        org_role NOT NULL DEFAULT 'member',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_membership UNIQUE (user_id, org_id)
);

CREATE INDEX idx_memberships_org ON memberships (org_id);
CREATE INDEX idx_memberships_user ON memberships (user_id);

CREATE TYPE sso_provider AS ENUM ('saml');

CREATE TABLE sso_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        sso_provider NOT NULL DEFAULT 'saml',
  domain          TEXT NOT NULL,
  metadata_url    TEXT,
  metadata_xml    TEXT,
  attribute_mapping JSONB NOT NULL DEFAULT '{}',
  enabled         BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_sso_domain UNIQUE (domain)
);

CREATE INDEX idx_sso_connections_org ON sso_connections (org_id);
CREATE INDEX idx_sso_connections_domain ON sso_connections (domain);

CREATE TYPE auth_event_type AS ENUM (
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

CREATE TABLE auth_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  auth_event_type NOT NULL,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_events_user ON auth_events (user_id);
CREATE INDEX idx_auth_events_type ON auth_events (event_type);
CREATE INDEX idx_auth_events_created ON auth_events (created_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sso_connections_updated_at
  BEFORE UPDATE ON sso_connections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
