import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  UsageEventType,
  UsageSyncStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Period boundaries for usage accounting: Stripe subscription window, or calendar month.
   */
  async getPeriodBounds(teamId: string): Promise<{ start: Date; end: Date }> {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      select: {
        billingPeriodStart: true,
        billingPeriodEnd: true,
      },
    });
    if (team.billingPeriodStart && team.billingPeriodEnd) {
      return {
        start: team.billingPeriodStart,
        end: team.billingPeriodEnd,
      };
    }
    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
    );
    return { start, end };
  }

  async record(
    teamId: string,
    type: UsageEventType,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const meta = metadata ?? {};
    const { start, end } = await this.getPeriodBounds(teamId);

    await this.prisma.$transaction(async (tx) => {
      await tx.usageEvent.create({
        data: {
          id: randomUUID(),
          teamId,
          type,
          metadata: meta as Prisma.InputJsonValue,
          syncStatus: UsageSyncStatus.pending,
        },
      });

      const baseCreate = {
        id: randomUUID(),
        teamId,
        periodStart: start,
        periodEnd: end,
        aiQueryCount: 0,
        agentRunCount: 0,
        actionExecutionCount: 0,
        connectorUsageCount: 0,
      };
      switch (type) {
        case UsageEventType.ai_query:
          baseCreate.aiQueryCount = 1;
          break;
        case UsageEventType.agent_run:
          baseCreate.agentRunCount = 1;
          break;
        case UsageEventType.action_execution:
          baseCreate.actionExecutionCount = 1;
          break;
        case UsageEventType.connector_usage:
          baseCreate.connectorUsageCount = 1;
          break;
        default:
          break;
      }

      await tx.usageSummary.upsert({
        where: {
          teamId_periodStart: { teamId, periodStart: start },
        },
        create: baseCreate,
        update: this.incrementField(type, 1),
      });
    });
  }

  private incrementField(
    type: UsageEventType,
    n: number,
  ): Pick<
    Prisma.UsageSummaryUpdateInput,
    | 'aiQueryCount'
    | 'agentRunCount'
    | 'actionExecutionCount'
    | 'connectorUsageCount'
  > {
    switch (type) {
      case UsageEventType.ai_query:
        return { aiQueryCount: { increment: n } };
      case UsageEventType.agent_run:
        return { agentRunCount: { increment: n } };
      case UsageEventType.action_execution:
        return { actionExecutionCount: { increment: n } };
      case UsageEventType.connector_usage:
        return { connectorUsageCount: { increment: n } };
      default:
        this.logger.warn(`Unknown usage type ${type}`);
        return {};
    }
  }

  async getSummaryForTeam(teamId: string): Promise<{
    periodStart: Date;
    periodEnd: Date;
    aiQueryCount: number;
    agentRunCount: number;
    actionExecutionCount: number;
    connectorUsageCount: number;
  }> {
    const { start, end } = await this.getPeriodBounds(teamId);
    const row = await this.prisma.usageSummary.findUnique({
      where: {
        teamId_periodStart: { teamId, periodStart: start },
      },
    });
    if (!row) {
      return {
        periodStart: start,
        periodEnd: end,
        aiQueryCount: 0,
        agentRunCount: 0,
        actionExecutionCount: 0,
        connectorUsageCount: 0,
      };
    }
    return {
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      aiQueryCount: row.aiQueryCount,
      agentRunCount: row.agentRunCount,
      actionExecutionCount: row.actionExecutionCount,
      connectorUsageCount: row.connectorUsageCount,
    };
  }
}
