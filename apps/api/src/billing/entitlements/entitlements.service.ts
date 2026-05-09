import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  BillingPlan,
  BillingStatus,
} from '@prisma/client';
import { PrismaService } from '../../database';
import { PLAN_LIMITS, USAGE_WARNING_RATIO } from '../billing.constants';
import { UsageService } from '../usage/usage.service';

const BLOCKING_STATUSES: BillingStatus[] = [
  BillingStatus.unpaid,
  BillingStatus.canceled,
];

@Injectable()
export class EntitlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
  ) {}

  async assertBillingHealthyForPaidOps(teamId: string): Promise<void> {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      select: { billingStatus: true, billingPlan: true },
    });
    if (team.billingPlan === BillingPlan.enterprise) return;
    if (BLOCKING_STATUSES.includes(team.billingStatus)) {
      throw new ForbiddenException(
        `Billing status ${team.billingStatus}. Update payment or subscription to continue.`,
      );
    }
  }

  async assertCanAddConnector(teamId: string): Promise<void> {
    await this.assertBillingHealthyForPaidOps(teamId);
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      select: { billingPlan: true },
    });
    const limits = PLAN_LIMITS[team.billingPlan];
    const count = await this.prisma.dataSource.count({ where: { teamId } });
    if (count >= limits.maxConnectors) {
      throw new ForbiddenException(
        `Connector limit reached for plan (${limits.maxConnectors}). Upgrade to add more.`,
      );
    }
  }

  async assertCanRunAiQuery(teamId: string): Promise<void> {
    await this.assertBillingHealthyForPaidOps(teamId);
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      select: { billingPlan: true },
    });
    const limits = PLAN_LIMITS[team.billingPlan];
    const summary = await this.usage.getSummaryForTeam(teamId);
    if (summary.aiQueryCount >= limits.maxAiQueriesPerPeriod) {
      throw new ForbiddenException(
        `AI query limit reached for this billing period (${limits.maxAiQueriesPerPeriod}).`,
      );
    }
  }

  async assertCanRunAgent(teamId: string): Promise<void> {
    await this.assertBillingHealthyForPaidOps(teamId);
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      select: { billingPlan: true },
    });
    const limits = PLAN_LIMITS[team.billingPlan];
    const summary = await this.usage.getSummaryForTeam(teamId);
    if (summary.agentRunCount >= limits.maxAgentRunsPerPeriod) {
      throw new ForbiddenException(
        `Agent run limit reached for this billing period (${limits.maxAgentRunsPerPeriod}).`,
      );
    }
  }

  async assertCanExecuteAction(teamId: string): Promise<void> {
    await this.assertBillingHealthyForPaidOps(teamId);
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      select: { billingPlan: true },
    });
    const limits = PLAN_LIMITS[team.billingPlan];
    const summary = await this.usage.getSummaryForTeam(teamId);
    if (summary.actionExecutionCount >= limits.maxActionsPerPeriod) {
      throw new ForbiddenException(
        `Action execution limit reached for this billing period (${limits.maxActionsPerPeriod}).`,
      );
    }
  }

  async getUsageWarnings(teamId: string, plan: BillingPlan): Promise<string[]> {
    const limits = PLAN_LIMITS[plan];
    const summary = await this.usage.getSummaryForTeam(teamId);
    const warnings: string[] = [];
    if (
      summary.aiQueryCount >=
      Math.floor(limits.maxAiQueriesPerPeriod * USAGE_WARNING_RATIO)
    ) {
      warnings.push('Approaching AI query limit for this period.');
    }
    if (
      summary.agentRunCount >=
      Math.floor(limits.maxAgentRunsPerPeriod * USAGE_WARNING_RATIO)
    ) {
      warnings.push('Approaching agent run limit for this period.');
    }
    if (
      summary.actionExecutionCount >=
      Math.floor(limits.maxActionsPerPeriod * USAGE_WARNING_RATIO)
    ) {
      warnings.push('Approaching action execution limit for this period.');
    }
    const connCount = await this.prisma.dataSource.count({
      where: { teamId },
    });
    if (
      connCount >= Math.floor(limits.maxConnectors * USAGE_WARNING_RATIO)
    ) {
      warnings.push('Approaching data connector limit.');
    }
    return warnings;
  }
}
