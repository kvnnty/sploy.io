import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_URL } from '@/lib/api-config';

export type TokenGetter = (options?: {
  skipCache?: boolean;
}) => Promise<string | null>;

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function messageFromAxiosError(error: AxiosError<{ message?: string }>): string {
  const data = error.response?.data;
  return (
    data?.message ??
    error.message ??
    `Request failed${error.response?.status ? ` (${error.response.status})` : ''}`
  );
}

/**
 * Stable Axios instance; reads `getTokenRef.current` on each request for Clerk JWTs.
 */
export function createAuthenticatedHttpClient(
  getTokenRef: { current: TokenGetter },
): AxiosInstance {
  const client = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 60_000,
  });

  client.interceptors.request.use(async (config) => {
    const token = await getTokenRef.current();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<{ message?: string }>) => {
      const original = error.config as
        | (InternalAxiosRequestConfig & { _retry?: boolean })
        | undefined;

      if (
        original &&
        !original._retry &&
        error.response?.status === 401
      ) {
        original._retry = true;
        try {
          const fresh = await getTokenRef.current({ skipCache: true });
          if (fresh) {
            original.headers.Authorization = `Bearer ${fresh}`;
            return client.request(original);
          }
        } catch {
          /* fall through */
        }
      }

      return Promise.reject(
        new ApiError(
          messageFromAxiosError(error),
          error.response?.status,
          error.response?.data,
        ),
      );
    },
  );

  return client;
}
