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
