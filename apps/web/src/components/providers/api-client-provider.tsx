'use client';

import { useAuth } from '@clerk/nextjs';
import type { AxiosInstance } from 'axios';
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import { createAuthenticatedHttpClient, type TokenGetter } from '@/lib/axios';

type ApiClientContextValue = {
  axios: AxiosInstance;
  getToken: TokenGetter;
};

const ApiClientContext = createContext<ApiClientContextValue | null>(null);

export function ApiClientProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const axiosClient = useMemo(
    () => createAuthenticatedHttpClient(getTokenRef),
    [],
  );

  const value = useMemo(
    () => ({ axios: axiosClient, getToken }),
    [axiosClient, getToken],
  );

  return (
    <ApiClientContext.Provider value={value}>
      {children}
    </ApiClientContext.Provider>
  );
}

export function useApiClient(): ApiClientContextValue {
  const ctx = useContext(ApiClientContext);
  if (!ctx) {
    throw new Error('useApiClient must be used within ApiClientProvider');
  }
  return ctx;
}
