import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../database';
import type { AskAnalysisBrief } from '../query/analysis-brief.service';
import type { ChartSpec } from '../query/chart-spec.util';

export type AnalysisRunPublic = {
  id: string;
  teamId: string;
  userId: string;
  dataSourceId: string | null;
  importId: string | null;
  question: string;
  sql: string;
  rowCount: number;
  truncated: boolean;
  brief: AskAnalysisBrief | null;
  chartSpec: ChartSpec | null;
  rows?: Record<string, unknown>[];
  createdAt: Date;
};

@Injectable()
export class AnalysisRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    teamId: string;
    userId: string;
    dataSourceId?: string | null;
    importId?: string | null;
    question: string;
    sql: string;
    rowCount: number;
    truncated: boolean;
    brief: AskAnalysisBrief | null;
    chartSpec: ChartSpec | null;
    rows?: Record<string, unknown>[];
  }): Promise<AnalysisRunPublic> {
    const row = await this.prisma.analysisRun.create({
      data: {
        teamId: params.teamId,
        userId: params.userId,
        dataSourceId: params.dataSourceId ?? null,
        importId: params.importId ?? null,
        question: params.question,
        sql: params.sql,
        rowCount: params.rowCount,
        truncated: params.truncated,
        brief: params.brief as Prisma.InputJsonValue | undefined,
        chartSpec: params.chartSpec as Prisma.InputJsonValue | undefined,
      },
    });
    return this.toPublic(row, params.rows);
  }

  async listForTeam(teamId: string, limit = 30): Promise<AnalysisRunPublic[]> {
    const rows = await this.prisma.analysisRun.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => this.toPublic(r));
  }

  async getForTeam(
    teamId: string,
    id: string,
  ): Promise<AnalysisRunPublic> {
    const row = await this.prisma.analysisRun.findFirst({
      where: { id, teamId },
    });
    if (!row) {
      throw new NotFoundException('Analysis run not found');
    }
    return this.toPublic(row);
  }

  private toPublic(
    row: {
      id: string;
      teamId: string;
      userId: string;
      dataSourceId: string | null;
      importId: string | null;
      question: string;
      sql: string;
      rowCount: number;
      truncated: boolean;
      brief: unknown;
      chartSpec: unknown;
      createdAt: Date;
    },
    rows?: Record<string, unknown>[],
  ): AnalysisRunPublic {
    return {
      id: row.id,
      teamId: row.teamId,
      userId: row.userId,
      dataSourceId: row.dataSourceId,
      importId: row.importId,
      question: row.question,
      sql: row.sql,
      rowCount: row.rowCount,
      truncated: row.truncated,
      brief: (row.brief as AskAnalysisBrief | null) ?? null,
      chartSpec: (row.chartSpec as ChartSpec | null) ?? null,
      rows,
      createdAt: row.createdAt,
    };
  }
}
