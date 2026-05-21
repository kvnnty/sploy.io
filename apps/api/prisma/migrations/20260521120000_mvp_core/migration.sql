-- CreateEnum
CREATE TYPE "DecisionActionStatus" AS ENUM ('draft', 'approved', 'sent');
CREATE TYPE "DeliveryChannel" AS ENUM ('slack', 'email', 'copy');

-- CreateSchema for CSV imports
CREATE SCHEMA IF NOT EXISTS team_imports;

-- CreateTable
CREATE TABLE "team_imports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "columns" JSONB NOT NULL DEFAULT '[]',
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_imports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analysis_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "data_source_id" UUID,
    "import_id" UUID,
    "question" TEXT NOT NULL,
    "sql" TEXT NOT NULL,
    "row_count" INTEGER NOT NULL,
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "brief" JSONB,
    "chart_spec" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "analysis_run_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "DecisionActionStatus" NOT NULL DEFAULT 'draft',
    "delivery_channel" "DeliveryChannel" NOT NULL DEFAULT 'slack',
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_integrations" (
    "team_id" UUID NOT NULL,
    "slack_webhook_url_enc" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_integrations_pkey" PRIMARY KEY ("team_id")
);

-- CreateIndex
CREATE INDEX "idx_team_imports_team_created" ON "team_imports"("team_id", "created_at" DESC);
CREATE INDEX "idx_analysis_runs_team_created" ON "analysis_runs"("team_id", "created_at" DESC);
CREATE INDEX "idx_decision_actions_team_created" ON "decision_actions"("team_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "team_imports" ADD CONSTRAINT "team_imports_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "team_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "decision_actions" ADD CONSTRAINT "decision_actions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decision_actions" ADD CONSTRAINT "decision_actions_analysis_run_id_fkey" FOREIGN KEY ("analysis_run_id") REFERENCES "analysis_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_integrations" ADD CONSTRAINT "team_integrations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
