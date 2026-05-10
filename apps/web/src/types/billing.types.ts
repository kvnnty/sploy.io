export type BillingPlan =
  | 'free'
  | 'starter'
  | 'growth'
  | 'pro'
  | 'enterprise';

export type BillingStatus =
  | 'none'
  | 'incomplete'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

export type BillingInvoiceSummary = {
  id: string;
  number: string | null;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  /** Unix timestamp (seconds) from Stripe */
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

export type BillingInvoicesResponse = {
  invoices: BillingInvoiceSummary[];
};

export type BillingStatusResponse = {
  teamId: string;
  plan: BillingPlan;
  status: BillingStatus;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingPeriod: { start: string | null; end: string | null };
  /** Live connector count vs limits.maxConnectors */
  connectorCount: number;
  limits: {
    maxConnectors: number;
    maxAiQueriesPerPeriod: number;
    maxAgentRunsPerPeriod: number;
    maxActionsPerPeriod: number;
  };
  usage: {
    periodStart: string;
    periodEnd: string;
    aiQueries: number;
    agentRuns: number;
    actionExecutions: number;
    connectorUsages: number;
  };
  warnings: string[];
};

export type CheckoutSessionResponse = { url: string | null };
export type PortalSessionResponse = { url: string | null };
