'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    void handleRedirectCallback({
      afterSignInUrl: '/dashboard',
      afterSignUpUrl: '/dashboard',
    });
  }, [handleRedirectCallback]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm text-white/60">Completing sign in...</p>
      </div>
    </div>
  );
}
