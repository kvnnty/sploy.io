'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    void handleRedirectCallback({});
  }, [handleRedirectCallback]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
