import type { AxiosInstance } from 'axios';

export class UserService {
  constructor(private readonly http: AxiosInstance) {}

  async updateProfile(body: { displayName: string }): Promise<unknown> {
    const r = await this.http.patch('/user', body);
    return r.data as unknown;
  }

  async deleteAccount(): Promise<unknown> {
    const r = await this.http.delete('/user');
    return r.data as unknown;
  }
}
