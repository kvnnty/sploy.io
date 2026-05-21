import type { AxiosInstance } from 'axios';

import type { AskResponse, TeamImportSummary } from '@/types/analysis.types';

export class ImportsService {
  constructor(private readonly http: AxiosInstance) {}

  list(teamId: string): Promise<TeamImportSummary[]> {
    return this.http
      .get<TeamImportSummary[]>(`/teams/${teamId}/imports`)
      .then((r) => r.data);
  }

  upload(teamId: string, file: File, name?: string): Promise<TeamImportSummary> {
    const form = new FormData();
    form.append('file', file);
    if (name) form.append('name', name);
    return this.http
      .post<TeamImportSummary>(`/teams/${teamId}/imports`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  }

  ask(
    teamId: string,
    importId: string,
    body: { question: string; schemaHint?: string },
  ): Promise<AskResponse> {
    return this.http
      .post<AskResponse>(`/teams/${teamId}/imports/${importId}/ask`, body)
      .then((r) => r.data);
  }
}
