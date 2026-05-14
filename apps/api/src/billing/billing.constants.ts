import { BillingPlan } from '@prisma/client';

/** Soft warning threshold: fraction of limit. */
export const USAGE_WARNING_RATIO = 0.8;

export type PlanLimits = {
  maxConnectors: number;
  maxAiQueriesPerPeriod: number;
  maxAgentRunsPerPeriod: number;
  maxActionsPerPeriod: number;
};

export const PLAN_LIMITS: Record<BillingPlan, PlanLimits> = {
  [BillingPlan.free]: {
    maxConnectors: 1,
    maxAiQueriesPerPeriod: 50,
    maxAgentRunsPerPeriod: 10,
    maxActionsPerPeriod: 20,
  },
  [BillingPlan.starter]: {
    maxConnectors: 3,
    maxAiQueriesPerPeriod: 2_000,
    maxAgentRunsPerPeriod: 200,
    maxActionsPerPeriod: 500,
  },
  [BillingPlan.growth]: {
    maxConnectors: 10,
    maxAiQueriesPerPeriod: 10_000,
    maxAgentRunsPerPeriod: 2_000,
    maxActionsPerPeriod: 5_000,
  },
  [BillingPlan.pro]: {
    maxConnectors: 30,
    maxAiQueriesPerPeriod: 50_000,
    maxAgentRunsPerPeriod: 10_000,
    maxActionsPerPeriod: 20_000,
  },
  [BillingPlan.enterprise]: {
    maxConnectors: 1_000_000,
    maxAiQueriesPerPeriod: 1_000_000_000,
    maxAgentRunsPerPeriod: 1_000_000_000,
    maxActionsPerPeriod: 1_000_000_000,
  },
};

export const CHECKOUT_SUCCESS_PATH = '/dashboard/settings/billing?checkout=success';
export const CHECKOUT_CANCEL_PATH = '/pricing?checkout=cancel';
