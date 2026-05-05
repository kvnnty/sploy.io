'use client';

import { useEffect, useState } from 'react';
import { useClerk } from '@clerk/nextjs';

export default function VerifyPage() {
  const { handleEmailLinkVerification } = useClerk();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    handleEmailLinkVerification({
      redirectUrlComplete: '/dashboard',
    })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [handleEmailLinkVerification]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm space-y-6 text-center">
        {status === 'verifying' && (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
            <p className="text-sm text-muted-foreground">Verifying your sign in...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">Signed in. Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-sm text-destructive">Verification failed or the link has expired.</p>
            <a href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
              Try again
            </a>
          </>
        )}
      </div>
    </div>
  );
}
