import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingPlan, BillingStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../../database';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly stripeService: StripeService,
  ) {}

  private get stripe(): Stripe {
    return this.stripeService.getStripe();
  }

  async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.onSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'invoice.paid':
        await this.onInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.onInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;
      default:
        this.logger.log(`Ignoring Stripe event type ${event.type}`);
    }
  }

  private async onCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    if (session.mode !== 'subscription') return;
    const teamId = session.metadata?.teamId ?? session.client_reference_id;
    if (!teamId) {
      this.logger.warn('checkout.session.completed without teamId');
      return;
    }
    const subId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;
    if (!subId) return;

    const stripe = this.stripe;
    const sub = await stripe.subscriptions.retrieve(subId, {
      expand: ['items.data.price'],
    });
    await this.applySubscription(teamId, sub);
  }

  private async onSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
    const teamId = sub.metadata?.teamId;
    if (teamId) {
      await this.applySubscription(teamId, sub);
      return;
    }
    if (typeof sub.customer === 'string') {
      const team = await this.prisma.team.findFirst({
        where: { stripeCustomerId: sub.customer },
      });
      if (team) await this.applySubscription(team.id, sub);
    }
  }

  private async onSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
    const teamId = sub.metadata?.teamId;
    if (teamId) {
      await this.clearSubscription(teamId);
      return;
    }
    if (typeof sub.customer === 'string') {
      const team = await this.prisma.team.findFirst({
        where: { stripeCustomerId: sub.customer },
      });
      if (team) await this.clearSubscription(team.id);
    }
  }

  private async clearSubscription(teamId: string): Promise<void> {
    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        stripeSubscriptionId: null,
        stripeSubscriptionItemAiQueryId: null,
        stripeSubscriptionItemAgentRunId: null,
        stripeSubscriptionItemActionExecutionId: null,
        billingPlan: BillingPlan.free,
        billingStatus: BillingStatus.none,
        billingPeriodStart: null,
        billingPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
    });
  }

  private async onInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subId = invoiceSubscriptionId(invoice);
    if (!subId) return;
    const stripe = this.stripe;
    const sub = await stripe.subscriptions.retrieve(subId);
    const teamId = sub.metadata?.teamId;
    if (!teamId) return;
    await this.prisma.team.update({
      where: { id: teamId },
      data: { billingStatus: this.mapStripeSubStatus(sub.status) },
    });
  }

  private async onInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const subId = invoiceSubscriptionId(invoice);
    if (!subId) return;
    const stripe = this.stripe;
    const sub = await stripe.subscriptions.retrieve(subId);
    const teamId = sub.metadata?.teamId;
    if (!teamId) return;
    await this.prisma.team.update({
      where: { id: teamId },
      data: { billingStatus: BillingStatus.past_due },
    });
  }

  private mapStripeSubStatus(
    status: Stripe.Subscription.Status,
  ): BillingStatus {
    switch (status) {
      case 'active':
        return BillingStatus.active;
      case 'trialing':
        return BillingStatus.trialing;
      case 'past_due':
        return BillingStatus.past_due;
      case 'canceled':
      case 'unpaid':
        return BillingStatus.canceled;
      case 'incomplete':
      case 'incomplete_expired':
        return BillingStatus.incomplete;
      default:
        return BillingStatus.none;
    }
  }

  private async applySubscription(
    teamId: string,
    sub: Stripe.Subscription,
  ): Promise<void> {
    const priceStarter = this.config.get<string>('STRIPE_PRICE_STARTER_MONTHLY');
    const priceGrowth = this.config.get<string>('STRIPE_PRICE_GROWTH_MONTHLY');
    const pricePro = this.config.get<string>('STRIPE_PRICE_PRO_MONTHLY');

    let plan =
      (sub.metadata?.plan as BillingPlan | undefined) ?? BillingPlan.free;

    for (const item of sub.items.data) {
      const priceId = item.price.id;
      const recurring = item.price.recurring;
      if (recurring?.usage_type === 'metered') continue;
      if (priceId === priceStarter) plan = BillingPlan.starter;
      else if (priceId === priceGrowth) plan = BillingPlan.growth;
      else if (priceId === pricePro) plan = BillingPlan.pro;
    }

    const periodStart = new Date(subscriptionPeriodStart(sub) * 1000);
    const periodEnd = new Date(subscriptionPeriodEnd(sub) * 1000);
    const cust =
      typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

    await this.prisma.team.update({
      where: { id: teamId },
      data: {
        stripeSubscriptionId: sub.id,
        stripeSubscriptionItemAiQueryId: null,
        stripeSubscriptionItemAgentRunId: null,
        stripeSubscriptionItemActionExecutionId: null,
        billingPlan: plan,
        billingStatus: this.mapStripeSubStatus(sub.status),
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        ...(cust ? { stripeCustomerId: cust } : {}),
      },
    });
  }
}

function subscriptionPeriodStart(sub: Stripe.Subscription): number {
  const s = sub as unknown as { current_period_start?: number };
  return s.current_period_start ?? 0;
}

function subscriptionPeriodEnd(sub: Stripe.Subscription): number {
  const s = sub as unknown as { current_period_end?: number };
  return s.current_period_end ?? 0;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as unknown as {
    subscription?: string | { id?: string } | null;
  };
  const sub = inv.subscription;
  if (!sub) return null;
  if (typeof sub === 'string') return sub;
  return sub.id ?? null;
}
