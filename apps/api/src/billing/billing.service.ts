import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingPlan } from '@prisma/client';
import { PrismaService } from '../database';
import { StripeService } from './stripe/stripe.service';
import { UsageService } from './usage/usage.service';
import { EntitlementsService } from './entitlements/entitlements.service';
import {
  CHECKOUT_CANCEL_PATH,
  CHECKOUT_SUCCESS_PATH,
  PLAN_LIMITS,
} from './billing.constants';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly stripeService: StripeService,
    private readonly usage: UsageService,
    private readonly entitlements: EntitlementsService,
  ) {}

  private appBaseUrl(): string {
    const u = this.config.get<string>('APP_URL');
    if (u) return u.replace(/\/$/, '');
    const cors = this.config.get<string>('CORS_ORIGIN') ?? '';
    const first = cors.split(',')[0]?.trim();
    if (first) return first.replace(/\/$/, '');
    return 'http://localhost:3000';
  }

  private planToBasePrice(plan: BillingPlan): string {
    switch (plan) {
      case BillingPlan.starter:
        return this.requireEnv('STRIPE_PRICE_STARTER_MONTHLY');
      case BillingPlan.growth:
        return this.requireEnv('STRIPE_PRICE_GROWTH_MONTHLY');
      case BillingPlan.pro:
        return this.requireEnv('STRIPE_PRICE_PRO_MONTHLY');
      default:
        throw new BadRequestException('Unsupported plan for self-serve checkout');
    }
  }

  private requireEnv(key: string): string {
    const v = this.config.get<string>(key);
    if (!v) {
      throw new BadRequestException(`Missing billing configuration: ${key}`);
    }
    return v;
  }

  async createCheckoutSession(params: {
    teamId: string;
    plan: BillingPlan;
    /** Logged-in user email — stored on Stripe Customer so Checkout pre-fills contact email */
    billingEmail?: string;
  }): Promise<{ url: string | null }> {
    const { teamId, plan, billingEmail } = params;
    if (
      plan !== BillingPlan.starter &&
      plan !== BillingPlan.growth &&
      plan !== BillingPlan.pro
    ) {
      throw new BadRequestException('Choose starter, growth, or pro for checkout');
    }

    const stripe = this.stripeService.getStripe();
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) throw new NotFoundException('Team not found');

    let customerId = team.stripeCustomerId;
    if (!customerId) {
      const c = await stripe.customers.create({
        name: team.name,
        ...(billingEmail ? { email: billingEmail } : {}),
        metadata: { teamId },
      });
      customerId = c.id;
      await this.prisma.team.update({
        where: { id: teamId },
        data: { stripeCustomerId: customerId },
      });
    } else if (billingEmail) {
      await stripe.customers.update(customerId, { email: billingEmail });
    }

    const base = this.planToBasePrice(plan);

    const baseUrl = this.appBaseUrl();
    const sep = CHECKOUT_SUCCESS_PATH.includes('?') ? '&' : '?';
    const successUrl = `${baseUrl}${CHECKOUT_SUCCESS_PATH}${sep}session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}${CHECKOUT_CANCEL_PATH}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: teamId,
      line_items: [{ price: base, quantity: 1 }],
      metadata: { teamId, plan },
      subscription_data: {
        metadata: { teamId, plan },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { url: session.url };
  }

  async createPortalSession(teamId: string): Promise<{ url: string | null }> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer for this team yet');
    }
    const returnUrl =
      this.config.get<string>('STRIPE_BILLING_PORTAL_RETURN_URL') ??
      `${this.appBaseUrl()}/dashboard/settings/billing`;

    const stripe = this.stripeService.getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: team.stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }

  async getStatus(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) throw new NotFoundException('Team not found');

    const [limits, usage, warnings, connectorCount] = await Promise.all([
      Promise.resolve(PLAN_LIMITS[team.billingPlan]),
      this.usage.getSummaryForTeam(teamId),
      this.entitlements.getUsageWarnings(teamId, team.billingPlan),
      this.prisma.dataSource.count({ where: { teamId } }),
    ]);

    return {
      teamId: team.id,
      plan: team.billingPlan,
      status: team.billingStatus,
      cancelAtPeriodEnd: team.cancelAtPeriodEnd,
      stripeCustomerId: team.stripeCustomerId,
      stripeSubscriptionId: team.stripeSubscriptionId,
      billingPeriod: {
        start: team.billingPeriodStart,
        end: team.billingPeriodEnd,
      },
      limits,
      connectorCount,
      usage: {
        periodStart: usage.periodStart,
        periodEnd: usage.periodEnd,
        aiQueries: usage.aiQueryCount,
        agentRuns: usage.agentRunCount,
        actionExecutions: usage.actionExecutionCount,
        connectorUsages: usage.connectorUsageCount,
      },
      warnings,
    };
  }

  async listInvoices(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) throw new NotFoundException('Team not found');
    if (!team.stripeCustomerId) {
      return { invoices: [] as BillingInvoiceSummary[] };
    }

    try {
      const stripe = this.stripeService.getStripe();
      const res = await stripe.invoices.list({
        customer: team.stripeCustomerId,
        limit: 24,
      });
      const invoices: BillingInvoiceSummary[] = res.data
        .filter((inv): inv is typeof inv & { id: string } => Boolean(inv.id))
        .map((inv) => ({
          id: inv.id,
          number: inv.number,
          status: inv.status ?? 'unknown',
          amountDue: inv.amount_due ?? 0,
          amountPaid: inv.amount_paid ?? 0,
          currency: inv.currency,
          created: inv.created,
          hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
          invoicePdf: inv.invoice_pdf ?? null,
        }));
      return { invoices };
    } catch {
      return { invoices: [] as BillingInvoiceSummary[] };
    }
  }
}

export type BillingInvoiceSummary = {
  id: string;
  number: string | null;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};
