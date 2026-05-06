import type { AxiosInstance } from 'axios';

import type {
  CreateTeamBody,
  TeamActivityEntry,
  TeamCreated,
  TeamDashboardResponse,
} from '@/types/team.types';

export class TeamService {
  constructor(private readonly http: AxiosInstance) {}

  async getDashboard(): Promise<TeamDashboardResponse> {
    const r = await this.http.get<TeamDashboardResponse>('/team');
    return r.data;
  }

  async getActivity(): Promise<TeamActivityEntry[]> {
    const r = await this.http.get<TeamActivityEntry[]>('/team/activity');
    return r.data;
  }

  async createTeam(body: CreateTeamBody): Promise<TeamCreated> {
    const r = await this.http.post<TeamCreated>('/team', body);
    return r.data;
  }

  async updateTeam(body: { name: string }): Promise<unknown> {
    const r = await this.http.patch('/team', body);
    return r.data as unknown;
  }

  async updateLogo(body: { logoUrl: string }): Promise<unknown> {
    const r = await this.http.patch('/team/logo', body);
    return r.data as unknown;
  }

  async deleteTeam(): Promise<unknown> {
    const r = await this.http.delete('/team');
    return r.data as unknown;
  }

  async inviteMember(body: { email: string; role: string }): Promise<unknown> {
    const r = await this.http.post('/team/invite', body);
    return r.data as unknown;
  }

  async respondToInvite(
    action: 'accept' | 'decline',
    invitationId: string,
  ): Promise<unknown> {
    const r = await this.http.post(`/team/${action}`, { invitationId });
    return r.data as unknown;
  }

  async updateRole(memberId: string, role: string): Promise<unknown> {
    const r = await this.http.patch('/team/role', { memberId, role });
    return r.data as unknown;
  }

  async removeMember(memberId: string): Promise<unknown> {
    const r = await this.http.delete(`/team/member/${memberId}`);
    return r.data as unknown;
  }

  async transferOwnership(memberId: string): Promise<unknown> {
    const r = await this.http.patch('/team/ownership', { memberId });
    return r.data as unknown;
  }

  async resendInvite(inviteId: string): Promise<unknown> {
    const r = await this.http.post(`/team/invite/${inviteId}/resend`);
    return r.data as unknown;
  }

  async cancelInvite(inviteId: string): Promise<unknown> {
    const r = await this.http.delete(`/team/invite/${inviteId}`);
    return r.data as unknown;
  }
}
