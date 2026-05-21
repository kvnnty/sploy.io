import type { AxiosInstance } from 'axios';

import type { AskResponse } from '@/types/analysis.types';
import type {
  CreateDataSourceBody,
  DataSourceSummary,
} from '@/types/data-source.types';

export class DataSourcesService {
  constructor(private readonly http: AxiosInstance) {}

  list(teamId: string): Promise<DataSourceSummary[]> {
    return this.http
      .get<DataSourceSummary[]>(`/teams/${teamId}/data-sources`)
      .then((r) => r.data);
  }

  create(
    teamId: string,
    body: CreateDataSourceBody,
  ): Promise<DataSourceSummary> {
    return this.http
      .post<DataSourceSummary>(`/teams/${teamId}/data-sources`, body)
      .then((r) => r.data);
  }

  remove(teamId: string, dataSourceId: string): Promise<void> {
    return this.http
      .delete(`/teams/${teamId}/data-sources/${dataSourceId}`)
      .then(() => undefined);
  }

  testConnection(
    teamId: string,
    dataSourceId: string,
  ): Promise<{ ok: true }> {
    return this.http
      .post<{ ok: true }>(
        `/teams/${teamId}/data-sources/${dataSourceId}/test`,
      )
      .then((r) => r.data);
  }

  getSchema(
    teamId: string,
    dataSourceId: string,
  ): Promise<{ tables: { name: string; columns: { name: string; type: string }[] }[] }> {
    return this.http
      .get(`/teams/${teamId}/data-sources/${dataSourceId}/schema`)
      .then((r) => r.data);
  }

  ask(
    teamId: string,
    dataSourceId: string,
    body: { question: string; schemaHint?: string },
  ): Promise<AskResponse> {
    return this.http
      .post<AskResponse>(
        `/teams/${teamId}/data-sources/${dataSourceId}/ask`,
        body,
      )
      .then((r) => r.data);
  }
}
