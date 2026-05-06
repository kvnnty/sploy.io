ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "preferred_team_id" UUID;
