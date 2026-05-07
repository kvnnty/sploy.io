import type { AxiosInstance } from 'axios';

import type {
  AuthMeResponse,
  BootstrapPayload,
  ProviderStatus,
  TeamMembership,
} from '@/types/auth.types';

export class AuthService {
  constructor(private readonly http: AxiosInstance) {}

  async getMe(): Promise<AuthMeResponse> {
    const r = await this.http.get<AuthMeResponse>('/auth/me');
    return r.data;
  }

  async getTeams(): Promise<TeamMembership[]> {
    const r = await this.http.get<TeamMembership[]>('/auth/teams');
    return r.data;
  }

  async switchTeam(teamId: string): Promise<unknown> {
    const r = await this.http.post('/auth/switch-team', { teamId });
    return r.data as unknown;
  }

  async bootstrap(body: BootstrapPayload): Promise<unknown> {
    const r = await this.http.post('/auth/bootstrap', body);
    return r.data as unknown;
  }

  async connectProvider(provider: string): Promise<unknown> {
    const r = await this.http.post(`/auth/connect/${provider}`);
    return r.data as unknown;
  }

  async disconnectProvider(provider: string): Promise<unknown> {
    const r = await this.http.delete(`/auth/disconnect/${provider}`);
    return r.data as unknown;
  }

  async listProviders(): Promise<ProviderStatus[]> {
    const r = await this.http.get<ProviderStatus[]>('/auth/providers');
    return r.data;
  }
}
