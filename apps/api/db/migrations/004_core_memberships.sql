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
