ALTER TABLE core.users
  ADD COLUMN preferred_team_id UUID REFERENCES core.teams(id) ON DELETE SET NULL;
