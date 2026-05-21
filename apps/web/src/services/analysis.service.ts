import type { AxiosInstance } from 'axios';

import type {
  AnalysisRunSummary,
  AskResponse,
  DecisionActionSummary,
} from '@/types/analysis.types';

export class AnalysisService {
  constructor(private readonly http: AxiosInstance) {}

  listRuns(teamId: string): Promise<AnalysisRunSummary[]> {
    return this.http
      .get<AnalysisRunSummary[]>(`/teams/${teamId}/analysis-runs`)
      .then((r) => r.data);
  }

  getRun(teamId: string, runId: string): Promise<AnalysisRunSummary> {
    return this.http
      .get<AnalysisRunSummary>(`/teams/${teamId}/analysis-runs/${runId}`)
      .then((r) => r.data);
  }

  createAction(
    teamId: string,
    body: { analysisRunId: string; title?: string; body?: string },
  ): Promise<DecisionActionSummary> {
    return this.http
      .post<DecisionActionSummary>(`/teams/${teamId}/actions`, body)
      .then((r) => r.data);
  }

  approveAction(
    teamId: string,
    actionId: string,
  ): Promise<DecisionActionSummary> {
    return this.http
      .post<DecisionActionSummary>(
        `/teams/${teamId}/actions/${actionId}/approve`,
      )
      .then((r) => r.data);
  }

  sendAction(
    teamId: string,
    actionId: string,
  ): Promise<DecisionActionSummary> {
    return this.http
      .post<DecisionActionSummary>(`/teams/${teamId}/actions/${actionId}/send`)
      .then((r) => r.data);
  }

  getSlackStatus(teamId: string): Promise<{ configured: boolean }> {
    return this.http
      .get<{ configured: boolean }>(`/teams/${teamId}/integrations/slack`)
      .then((r) => r.data);
  }

  saveSlackWebhook(
    teamId: string,
    webhookUrl: string,
  ): Promise<void> {
    return this.http
      .put(`/teams/${teamId}/integrations/slack`, { webhookUrl })
      .then(() => undefined);
  }

  testSlackWebhook(teamId: string): Promise<{ ok: true }> {
    return this.http
      .post<{ ok: true }>(`/teams/${teamId}/integrations/slack/test`)
      .then((r) => r.data);
  }
}

export type { AskResponse };
