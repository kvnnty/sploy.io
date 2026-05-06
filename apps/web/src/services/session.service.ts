import type { AxiosInstance } from 'axios';

import type { SessionInfo } from '@/types/session.types';

export class SessionService {
  constructor(private readonly http: AxiosInstance) {}

  async list(): Promise<SessionInfo[]> {
    const r = await this.http.get<SessionInfo[]>('/sessions');
    return r.data;
  }

  async revoke(sessionId: string): Promise<unknown> {
    const r = await this.http.delete(`/sessions/${sessionId}`);
    return r.data as unknown;
  }

  async revokeOthers(): Promise<unknown> {
    const r = await this.http.delete('/sessions/others');
    return r.data as unknown;
  }
}
