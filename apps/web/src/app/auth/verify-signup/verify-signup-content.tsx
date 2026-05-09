'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClerk, useSignUp } from '@clerk/nextjs';

function VerifySignUpInner() {
  const { loaded: clerkLoaded } = useClerk();
  const { signUp } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [finalized, setFinalized] = useState(false);

  const verification = signUp?.verifications?.emailLinkVerification;

  useEffect(() => {
    if (!clerkLoaded || !signUp || finalized) return;
    if (signUp.status !== 'complete') return;

    setFinalized(true);
    void signUp
      .finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          const url = decorateUrl('/dashboard');
          if (url.startsWith('http')) {
            window.location.href = url;
          } else {
            router.replace(url);
          }
        },
      })
      .catch(() => setFinalized(false));
  }, [clerkLoaded, signUp, signUp?.status, router, finalized]);

  if (!clerkLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      </div>
    );
  }

  if (!signUp || !verification) {
    if (searchParams.get('__clerk_status') === 'client_mismatch') {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="mx-auto w-full max-w-sm space-y-6 text-center">
            <p className="text-sm text-muted-foreground">
              Finish signing up on the same device and browser where you started.
            </p>
            <Link
              href="/auth/sign-up"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign up
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-sm space-y-6 text-center">
          <p className="text-sm text-muted-foreground">Loading verification…</p>
        </div>
      </div>
    );
  }

  if (verification.status === 'failed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-sm space-y-6 text-center">
          <p className="text-sm text-destructive">Email verification failed.</p>
          <Link
            href="/auth/sign-up"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Try signing up again
          </Link>
        </div>
      </div>
    );
  }

  if (verification.status === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-sm space-y-6 text-center">
          <p className="text-sm text-destructive">This link has expired.</p>
          <Link
            href="/auth/sign-up"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (verification.status === 'client_mismatch') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-sm space-y-6 text-center">
          <p className="text-sm text-muted-foreground">
            Finish signing up on the same device and browser where you started.
          </p>
          <Link
            href="/auth/sign-up"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <svg
            className="h-6 w-6 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">
          Account verified. Redirecting…
        </p>
      </div>
    </div>
  );
}

export function VerifySignUpContent() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        </div>
      }
    >
      <VerifySignUpInner />
    </Suspense>
  );
}
