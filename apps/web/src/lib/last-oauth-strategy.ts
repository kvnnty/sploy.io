import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'sploy:last-oauth-strategy';

export type OAuthStrategy = 'oauth_google' | 'oauth_microsoft';

const VALID: readonly OAuthStrategy[] = ['oauth_google', 'oauth_microsoft'];

function isOAuthStrategy(value: string): value is OAuthStrategy {
  return (VALID as readonly string[]).includes(value);
}

export function getLastOAuthStrategy(): OAuthStrategy | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isOAuthStrategy(raw)) return raw;
  } catch {
    /* ignore quota / private mode */
  }
  return null;
}

export function setLastOAuthStrategy(strategy: OAuthStrategy) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, strategy);
  } catch {
    /* ignore */
  }
}

export function useLastOAuthStrategy() {
  const [lastStrategy, setLast] = useState<OAuthStrategy | null>(null);

  useEffect(() => {
    setLast(getLastOAuthStrategy());
  }, []);

  const rememberStrategy = useCallback((strategy: OAuthStrategy) => {
    setLastOAuthStrategy(strategy);
    setLast(strategy);
  }, []);

  return { lastStrategy, rememberStrategy };
}
