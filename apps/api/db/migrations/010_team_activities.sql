CREATE TABLE core.team_activities (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID        NOT NULL REFERENCES core.teams(id) ON DELETE CASCADE,
  actor_user_id UUID        REFERENCES core.users(id) ON DELETE SET NULL,
  type          VARCHAR(50) NOT NULL,
  metadata      JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_activity_team_created
  ON core.team_activities (team_id, created_at DESC);
