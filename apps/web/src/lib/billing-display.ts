import type { BillingPlan, BillingStatus } from '@/types/billing.types';

export const PLAN_LABEL: Record<BillingPlan, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

/** Display-only prices aligned with product (Stripe prices configured separately). */
export const PLAN_PRICE_LABEL: Record<BillingPlan, string> = {
  free: '$0',
  starter: '$29/mo',
  growth: '$99/mo',
  pro: '$299/mo',
  enterprise: 'Custom',
};

export const SELF_SERVE_UPGRADE_SEQUENCE: Exclude<
  BillingPlan,
  'free' | 'enterprise'
>[] = ['starter', 'growth', 'pro'];

export function statusLabel(status: BillingStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trial';
    case 'past_due':
      return 'Past due';
    case 'unpaid':
      return 'Unpaid';
    case 'canceled':
      return 'Canceled';
    case 'incomplete':
      return 'Incomplete';
    case 'none':
      return 'Not subscribed';
    default:
      return status;
  }
}

/** Highest self‑serve tiers: show Manage Billing vs Upgrade when subscription is healthy. */
export function isTopSelfServeBillingState(
  plan: BillingPlan,
  status: BillingStatus,
): boolean {
  const ok = status === 'active' || status === 'trialing';
  return (
    ok && (plan === 'pro' || plan === 'enterprise')
  );
}

export function billingProfileActionLabel(
  plan: BillingPlan,
  status: BillingStatus,
): 'Manage Billing' | 'Upgrade Plan' {
  return isTopSelfServeBillingState(plan, status)
    ? 'Manage Billing'
    : 'Upgrade Plan';
}

export function upgradesAvailableFor(plan: BillingPlan): Exclude<
  BillingPlan,
  'free' | 'enterprise'
>[] {
  if (plan === 'free')
    return ['starter', 'growth', 'pro'];
  if (plan === 'starter') return ['growth', 'pro'];
  if (plan === 'growth') return ['pro'];
  return [];
}
