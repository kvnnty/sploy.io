import type { AxiosInstance } from 'axios';

export class UploadService {
  constructor(private readonly http: AxiosInstance) {}

  async uploadTeamAvatar(formData: FormData): Promise<{ url: string }> {
    const r = await this.http.post<{ url: string }>(
      '/uploads/team-avatar',
      formData,
    );
    return r.data;
  }
}
