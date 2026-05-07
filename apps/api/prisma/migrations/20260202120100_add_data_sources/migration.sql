CREATE TYPE data_source_kind AS ENUM ('postgresql');

CREATE TABLE data_sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  kind                  data_source_kind NOT NULL DEFAULT 'postgresql',
  host                  TEXT NOT NULL,
  port                  INT NOT NULL DEFAULT 5432,
  db_name               TEXT NOT NULL,
  username              TEXT NOT NULL,
  encrypted_credential  TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_data_sources_org ON data_sources (org_id);

CREATE TRIGGER trg_data_sources_updated_at
  BEFORE UPDATE ON data_sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
