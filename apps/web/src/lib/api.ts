export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

export type AuthMeResponse = {
  authUserId: string;
  email: string;
  internalUserId: string | null;
  activeTeamId?: string | null;
  role?: string | null;
};

export type TeamMembership = {
  team_id: string;
  name: string;
  slug: string;
  role: string;
  logoUrl?: string | null;
};

export type DataSourceSummary = {
  id: string;
  teamId: string;
  name: string;
  kind: string;
  host: string;
  port: number;
  database: string;
  username: string;
  createdAt: string;
  updatedAt: string;
};

export async function apiFetchServer<T = unknown>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API error ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/**
 * Client-side API fetch. Import `useAuth` from `@clerk/nextjs` and pass the
 * token: `const { getToken } = useAuth(); const token = await getToken();`
 */
export async function apiFetchWithToken<T = unknown>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  return apiFetchServer<T>(path, token, options);
}

/**
 * Upload a file via multipart/form-data.
 * Do NOT set Content-Type — the browser will set the boundary automatically.
 */
export async function apiUploadFile<T = unknown>(
  path: string,
  token: string,
  formData: FormData,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Upload error ${res.status}`);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
