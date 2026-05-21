import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DecisionActionStatus,
  DeliveryChannel,
  UsageEventType,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database';
import { UsageService } from '../billing/usage/usage.service';
import { DeliveryService } from '../delivery/delivery.service';
import type { AskAnalysisBrief } from '../query/analysis-brief.service';

export type DecisionActionPublic = {
  id: string;
  teamId: string;
  analysisRunId: string;
  title: string;
  body: string;
  status: DecisionActionStatus;
  deliveryChannel: DeliveryChannel;
  sentAt: Date | null;
  createdAt: Date;
};

@Injectable()
export class DecisionActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: DeliveryService,
    private readonly usage: UsageService,
    private readonly config: ConfigService,
  ) {}

  async createFromRun(
    teamId: string,
    analysisRunId: string,
    overrides?: { title?: string; body?: string },
  ): Promise<DecisionActionPublic> {
    const run = await this.prisma.analysisRun.findFirst({
      where: { id: analysisRunId, teamId },
    });
    if (!run) throw new NotFoundException('Analysis run not found');

    const brief = run.brief as AskAnalysisBrief | null;
    const title =
      overrides?.title?.trim() ||
      (brief?.recommendedNextStep?.slice(0, 120) ?? 'Recommended action');
    const body =
      overrides?.body?.trim() ||
      [
        brief?.answer ?? '',
        brief?.drivers?.length
          ? `\nDrivers:\n${brief.drivers.map((d) => `- ${d.headline}`).join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

    const row = await this.prisma.decisionAction.create({
      data: {
        teamId,
        analysisRunId,
        title,
        body,
        status: DecisionActionStatus.draft,
        deliveryChannel: DeliveryChannel.slack,
      },
    });
    return this.toPublic(row);
  }

  async approve(teamId: string, id: string): Promise<DecisionActionPublic> {
    const action = await this.requireForTeam(teamId, id);
    if (action.status === DecisionActionStatus.sent) {
      throw new BadRequestException('Action was already sent');
    }
    const row = await this.prisma.decisionAction.update({
      where: { id },
      data: { status: DecisionActionStatus.approved },
    });
    return this.toPublic(row);
  }

  async send(teamId: string, id: string): Promise<DecisionActionPublic> {
    const action = await this.requireForTeam(teamId, id);
    if (action.status !== DecisionActionStatus.approved) {
      throw new BadRequestException('Approve the action before sending');
    }

    const run = await this.prisma.analysisRun.findFirst({
      where: { id: action.analysisRunId, teamId },
    });
    if (!run) throw new NotFoundException('Analysis run not found');

    const brief = run.brief as AskAnalysisBrief | null;
    const appUrl =
      this.config.get<string>('APP_URL')?.replace(/\/$/, '') ||
      'http://localhost:3000';
    const reportUrl = `${appUrl}/dashboard/ask?run=${run.id}`;

    await this.delivery.sendViaSlack(teamId, {
      title: action.title,
      body: action.body,
      drivers: brief?.drivers ?? [],
      reportUrl,
    });

    const row = await this.prisma.decisionAction.update({
      where: { id },
      data: {
        status: DecisionActionStatus.sent,
        sentAt: new Date(),
      },
    });

    await this.usage.record(teamId, UsageEventType.action_execution, {
      actionId: id,
      analysisRunId: run.id,
    });

    return this.toPublic(row);
  }

  private async requireForTeam(teamId: string, id: string) {
    const row = await this.prisma.decisionAction.findFirst({
      where: { id, teamId },
    });
    if (!row) throw new NotFoundException('Action not found');
    return row;
  }

  private toPublic(row: {
    id: string;
    teamId: string;
    analysisRunId: string;
    title: string;
    body: string;
    status: DecisionActionStatus;
    deliveryChannel: DeliveryChannel;
    sentAt: Date | null;
    createdAt: Date;
  }): DecisionActionPublic {
    return {
      id: row.id,
      teamId: row.teamId,
      analysisRunId: row.analysisRunId,
      title: row.title,
      body: row.body,
      status: row.status,
      deliveryChannel: row.deliveryChannel,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
    };
  }
}
