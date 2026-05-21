import { Injectable } from '@nestjs/common';
import { UsageEventType } from '@prisma/client';
import { UsageService } from '../billing/usage/usage.service';
import {
  AnalysisBriefService,
  type AskAnalysisBrief,
} from '../query/analysis-brief.service';
import { buildChartSpec, type ChartSpec } from '../query/chart-spec.util';
import { NlSqlService } from '../query/nl-sql.service';
import { AnalysisRunsService } from './analysis-runs.service';

export type AskResult = {
  sql: string;
  rows: Record<string, unknown>[];
  truncated: boolean;
  brief?: AskAnalysisBrief;
  chartSpec?: ChartSpec | null;
  analysisRunId: string;
  schemaUsed: boolean;
};

@Injectable()
export class AnalysisAskService {
  constructor(
    private readonly nlSql: NlSqlService,
    private readonly analysisBrief: AnalysisBriefService,
    private readonly analysisRuns: AnalysisRunsService,
    private readonly usage: UsageService,
  ) {}

  async completeAsk(params: {
    teamId: string;
    userId: string;
    dataSourceId?: string | null;
    importId?: string | null;
    question: string;
    schemaHint?: string;
    sql?: string;
    runQuery: (sql: string) => Promise<{
      rows: Record<string, unknown>[];
      truncated: boolean;
    }>;
    schemaUsed?: boolean;
  }): Promise<AskResult> {
    const schemaHint = params.schemaHint?.trim();
    const sql =
      params.sql?.trim() ||
      (await this.nlSql.questionToSelectSql(params.question, schemaHint));

    const result = await params.runQuery(sql);
    const brief = await this.analysisBrief.summarize({
      question: params.question,
      sql,
      rows: result.rows,
      truncated: result.truncated,
    });

    const chartSpec = buildChartSpec(result.rows);

    const run = await this.analysisRuns.create({
      teamId: params.teamId,
      userId: params.userId,
      dataSourceId: params.dataSourceId ?? null,
      importId: params.importId ?? null,
      question: params.question,
      sql,
      rowCount: result.rows.length,
      truncated: result.truncated,
      brief,
      chartSpec,
    });

    await this.usage.record(params.teamId, UsageEventType.ai_query, {
      dataSourceId: params.dataSourceId ?? undefined,
      importId: params.importId ?? undefined,
      analysisRunId: run.id,
    });

    return {
      sql,
      rows: result.rows,
      truncated: result.truncated,
      brief: brief ?? undefined,
      chartSpec,
      analysisRunId: run.id,
      schemaUsed: params.schemaUsed ?? Boolean(schemaHint),
    };
  }
}
