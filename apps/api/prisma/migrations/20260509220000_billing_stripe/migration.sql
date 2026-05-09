-- Billing: team columns, usage tables, webhook idempotency

CREATE TYPE "BillingPlan" AS ENUM ('free', 'starter', 'growth', 'pro', 'enterprise');
CREATE TYPE "BillingStatus" AS ENUM ('none', 'incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');
CREATE TYPE "UsageEventType" AS ENUM ('ai_query', 'connector_usage', 'agent_run', 'action_execution');
CREATE TYPE "UsageSyncStatus" AS ENUM ('pending', 'synced', 'failed');

ALTER TABLE "teams" ADD COLUMN "billing_plan" "BillingPlan" NOT NULL DEFAULT 'free';
ALTER TABLE "teams" ADD COLUMN "billing_status" "BillingStatus" NOT NULL DEFAULT 'none';
ALTER TABLE "teams" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "teams" ADD COLUMN "stripe_subscription_id" TEXT;
ALTER TABLE "teams" ADD COLUMN "stripe_si_ai_query" TEXT;
ALTER TABLE "teams" ADD COLUMN "stripe_si_agent_run" TEXT;
ALTER TABLE "teams" ADD COLUMN "stripe_si_action_execution" TEXT;
ALTER TABLE "teams" ADD COLUMN "billing_period_start" TIMESTAMPTZ(6);
ALTER TABLE "teams" ADD COLUMN "billing_period_end" TIMESTAMPTZ(6);
ALTER TABLE "teams" ADD COLUMN "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "teams_stripe_customer_id_key" ON "teams"("stripe_customer_id");
CREATE UNIQUE INDEX "teams_stripe_subscription_id_key" ON "teams"("stripe_subscription_id");

CREATE TABLE "usage_events" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "type" "UsageEventType" NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sync_status" "UsageSyncStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "usage_events_team_created" ON "usage_events"("team_id", "created_at");

CREATE TABLE "usage_summaries" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "period_start" TIMESTAMPTZ(6) NOT NULL,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "ai_query_count" INTEGER NOT NULL DEFAULT 0,
    "agent_run_count" INTEGER NOT NULL DEFAULT 0,
    "action_execution_count" INTEGER NOT NULL DEFAULT 0,
    "connector_usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_synced_ai_query" INTEGER NOT NULL DEFAULT 0,
    "last_synced_agent_run" INTEGER NOT NULL DEFAULT 0,
    "last_synced_action_execution" INTEGER NOT NULL DEFAULT 0,
    "last_synced_connector_usage" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_summaries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_usage_summary_team_period" ON "usage_summaries"("team_id", "period_start");

CREATE TABLE "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "usage_summaries" ADD CONSTRAINT "usage_summaries_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
