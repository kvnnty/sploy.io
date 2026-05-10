'use client';

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

const ActiveTeamContext = createContext<string | null>(null);

export function ActiveTeamProvider({
  teamId,
  children,
}: {
  teamId: string | null;
  children: ReactNode;
}) {
  return (
    <ActiveTeamContext.Provider value={teamId}>
      {children}
    </ActiveTeamContext.Provider>
  );
}

export function useActiveTeamId(): string | null {
  return useContext(ActiveTeamContext);
}
