-- Upgrade legacy org-based schema to current team-based schema in public.

-- 1) Rename enums to the Prisma enum names.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_role') THEN
    ALTER TYPE org_role RENAME TO "TeamRole";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sso_provider') THEN
    ALTER TYPE sso_provider RENAME TO "SsoProvider";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'data_source_kind') THEN
    ALTER TYPE data_source_kind RENAME TO "DataSourceKind";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_event_type') THEN
    ALTER TYPE auth_event_type RENAME TO "AuthEventType";
  END IF;
END $$;

-- 2) Keep event values aligned.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthEventType') THEN
    BEGIN
      ALTER TYPE "AuthEventType" RENAME VALUE 'org_created' TO 'team_created';
    EXCEPTION WHEN undefined_object THEN
      -- value already renamed/missing
      NULL;
    END;
  END IF;
END $$;

-- 3) Rename main table and relationship columns.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='organizations'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='teams'
  ) THEN
    ALTER TABLE "organizations" RENAME TO "teams";
  END IF;
END $$;

ALTER TABLE "memberships" RENAME COLUMN "org_id" TO "team_id";
ALTER TABLE "sso_connections" RENAME COLUMN "org_id" TO "team_id";
ALTER TABLE "data_sources" RENAME COLUMN "org_id" TO "team_id";
ALTER TABLE "auth_events" RENAME COLUMN "org_id" TO "team_id";

-- 4) Ensure required user column exists.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferred_team_id" UUID;

-- 5) Ensure unique/indexes expected by current app.
CREATE UNIQUE INDEX IF NOT EXISTS "teams_slug_key" ON "teams"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "teams_domain_key" ON "teams"("domain");
CREATE INDEX IF NOT EXISTS "data_sources_team_id_idx" ON "data_sources"("team_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_membership" ON "memberships"("user_id","team_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sso_connections_domain_key" ON "sso_connections"("domain");
CREATE INDEX IF NOT EXISTS "idx_auth_events_user" ON "auth_events"("user_id");
CREATE INDEX IF NOT EXISTS "idx_auth_events_type" ON "auth_events"("event_type");
CREATE INDEX IF NOT EXISTS "idx_auth_events_created" ON "auth_events"("created_at");

-- 6) Add missing lookup/feature enums.
DO $$
BEGIN
  BEGIN
    CREATE TYPE "InvitationStatus" AS ENUM ('pending','accepted','declined','expired');
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    CREATE TYPE "NotificationCategory" AS ENUM ('account_security','team_collaboration','system_product');
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 7) Create missing tables used by current modules.
CREATE TABLE IF NOT EXISTS "invitations" (
  "id" UUID NOT NULL,
  "team_id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "role" "TeamRole" NOT NULL DEFAULT 'member',
  "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
  "invited_by" UUID NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "category" "NotificationCategory" NOT NULL,
  "type" VARCHAR(100) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "body" TEXT,
  "action_url" VARCHAR(512),
  "read_at" TIMESTAMPTZ(6),
  "idempotency_key" VARCHAR(255),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "category" "NotificationCategory" NOT NULL,
  "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
  "email_enabled" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "team_activities" (
  "id" UUID NOT NULL,
  "team_id" UUID NOT NULL,
  "actor_user_id" UUID,
  "type" VARCHAR(50) NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "team_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "auth_session_id" VARCHAR(255) NOT NULL,
  "ip_address" VARCHAR(128),
  "user_agent" TEXT,
  "last_active_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- 8) Required indexes for new tables.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_invitation_team_email" ON "invitations"("team_id","email");
CREATE INDEX IF NOT EXISTS "idx_notifications_user_created" ON "notifications"("user_id","created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_notifications_user_read" ON "notifications"("user_id","read_at");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_notification_idempotency" ON "notifications"("user_id","idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_notification_pref_user_category" ON "notification_preferences"("user_id","category");
CREATE INDEX IF NOT EXISTS "idx_team_activity_team_created" ON "team_activities"("team_id","created_at" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_user_sessions_auth_session_id" ON "user_sessions"("auth_session_id");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_id" ON "user_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_user_last_active" ON "user_sessions"("user_id","last_active_at");

-- 9) Add expected foreign keys when absent.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='auth_events_user_id_fkey') THEN
    ALTER TABLE "auth_events" ADD CONSTRAINT "auth_events_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='auth_events_team_id_fkey') THEN
    ALTER TABLE "auth_events" ADD CONSTRAINT "auth_events_team_id_fkey"
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='memberships_user_id_fkey') THEN
    ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='memberships_team_id_fkey') THEN
    ALTER TABLE "memberships" ADD CONSTRAINT "memberships_team_id_fkey"
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sso_connections_team_id_fkey') THEN
    ALTER TABLE "sso_connections" ADD CONSTRAINT "sso_connections_team_id_fkey"
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='data_sources_team_id_fkey') THEN
    ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_team_id_fkey"
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_preferred_team_id_fkey') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_preferred_team_id_fkey"
      FOREIGN KEY ("preferred_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='invitations_team_id_fkey') THEN
    ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_id_fkey"
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='invitations_invited_by_fkey') THEN
    ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey"
      FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='notifications_user_id_fkey') THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='notification_preferences_user_id_fkey') THEN
    ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='team_activities_team_id_fkey') THEN
    ALTER TABLE "team_activities" ADD CONSTRAINT "team_activities_team_id_fkey"
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='team_activities_actor_user_id_fkey') THEN
    ALTER TABLE "team_activities" ADD CONSTRAINT "team_activities_actor_user_id_fkey"
      FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='user_sessions_user_id_fkey') THEN
    ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
