export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

export type AuthMeResponse = {
  authUserId: string;
  email: string;
  internalUserId: string | null;
  activeOrgId?: string | null;
  role?: string | null;
};

export type OrgMembership = {
  org_id: string;
  name: string;
  slug: string;
  role: string;
};

export type DataSourceSummary = {
  id: string;
  orgId: string;
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
