'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function VerifyPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setStatus('success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    });

    const timeout = setTimeout(() => {
      if (status === 'verifying') setStatus('error');
    }, 30000);

    return () => clearTimeout(timeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm space-y-6 rounded-xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
        {status === 'verifying' && (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-white/60">Verifying your sign in...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-white/60">Signed in. Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-sm text-red-400">Verification timed out or failed.</p>
            <a href="/auth/login" className="text-sm text-white/50 hover:text-white/70">
              Try again
            </a>
          </>
        )}
      </div>
    </div>
  );
}
