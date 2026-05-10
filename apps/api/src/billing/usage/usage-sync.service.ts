import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingStatus } from '@prisma/client';
import { PrismaService } from '../../database';
import { USAGE_SYNC_INTERVAL_MS } from '../billing.constants';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class UsageSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsageSyncService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.syncMeteredUsageToStripe().catch((err) =>
        this.logger.warn(`Usage sync failed: ${err}`),
      );
    }, USAGE_SYNC_INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async syncMeteredUsageToStripe(): Promise<void> {
    const ai = this.config.get<string>('STRIPE_PRICE_AI_QUERY_METERED');
    const agent = this.config.get<string>('STRIPE_PRICE_AGENT_RUN_METERED');
    const action = this.config.get<string>('STRIPE_PRICE_ACTION_EXECUTION_METERED');
    if (!ai || !agent || !action) {
      return;
    }

    try {
      this.stripeService.getStripe();
    } catch {
      return;
    }

    const teams = await this.prisma.team.findMany({
      where: {
        stripeSubscriptionId: { not: null },
        billingStatus: {
          in: [
            BillingStatus.active,
            BillingStatus.trialing,
            BillingStatus.past_due,
          ],
        },
        OR: [
          { stripeSubscriptionItemAiQueryId: { not: null } },
          { stripeSubscriptionItemAgentRunId: { not: null } },
          { stripeSubscriptionItemActionExecutionId: { not: null } },
        ],
      },
    });

    for (const team of teams) {
      if (!team.billingPeriodStart) continue;
      const summary = await this.prisma.usageSummary.findUnique({
        where: {
          teamId_periodStart: {
            teamId: team.id,
            periodStart: team.billingPeriodStart,
          },
        },
      });
      if (!summary) continue;

      await this.pushDelta(
        team.stripeSubscriptionItemAiQueryId,
        summary.aiQueryCount,
        summary.lastSyncedAiQuery,
        async (newLast) => {
          await this.prisma.usageSummary.update({
            where: { id: summary.id },
            data: { lastSyncedAiQuery: newLast },
          });
        },
      );
      await this.pushDelta(
        team.stripeSubscriptionItemAgentRunId,
        summary.agentRunCount,
        summary.lastSyncedAgentRun,
        async (newLast) => {
          await this.prisma.usageSummary.update({
            where: { id: summary.id },
            data: { lastSyncedAgentRun: newLast },
          });
        },
      );
      await this.pushDelta(
        team.stripeSubscriptionItemActionExecutionId,
        summary.actionExecutionCount,
        summary.lastSyncedActionExecution,
        async (newLast) => {
          await this.prisma.usageSummary.update({
            where: { id: summary.id },
            data: { lastSyncedActionExecution: newLast },
          });
        },
      );
    }
  }

  private async pushDelta(
    subscriptionItemId: string | null,
    total: number,
    lastSynced: number,
    persist: (newLast: number) => Promise<void>,
  ) {
    if (!subscriptionItemId) return;
    const delta = total - lastSynced;
    if (delta <= 0) return;
    try {
      await this.stripeService.createUsageRecord(subscriptionItemId, delta);
      await persist(lastSynced + delta);
    } catch (err) {
      this.logger.warn(
        `Stripe usage record failed for item ${subscriptionItemId}: ${err}`,
      );
    }
  }
}
