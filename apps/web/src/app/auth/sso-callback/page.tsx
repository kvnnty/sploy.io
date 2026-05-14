'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';

/**
 * OAuth / SSO redirect completion - follows Clerk custom OAuth callback flow:
 * https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections
 */
export default function SSOCallbackPage() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    const navigateToSignIn = () => {
      router.replace('/auth/login');
    };

    const navigateToDashboard = async ({
      session,
      decorateUrl,
    }: {
      session?: { currentTask?: unknown } | null;
      decorateUrl: (path: string) => string;
    }) => {
      if (session?.currentTask) return;
      const url = decorateUrl('/dashboard');
      window.location.assign(url);
    };

    const finalizeSignIn = async () => {
      await signIn.finalize({ navigate: navigateToDashboard });
    };

    const finalizeSignUp = async () => {
      await signUp.finalize({ navigate: navigateToDashboard });
    };

    const run = async () => {
      if (!clerk.loaded) return;
      if (!signIn || !signUp) return;
      if (hasRun.current) return;
      hasRun.current = true;

      if (signIn.status === 'complete') {
        await finalizeSignIn();
        return;
      }

      if (signUp.isTransferable) {
        await signIn.create({ transfer: true });
        const signInStatus = signIn.status as typeof signIn.status | 'complete';
        if (signInStatus === 'complete') {
          await finalizeSignIn();
          return;
        }
        navigateToSignIn();
        return;
      }

      if (
        signIn.status === 'needs_first_factor' &&
        !signIn.supportedFirstFactors?.every((f) => f.strategy === 'enterprise_sso')
      ) {
        navigateToSignIn();
        return;
      }

      if (signIn.isTransferable) {
        await signUp.create({ transfer: true });
        if (signUp.status === 'complete') {
          await finalizeSignUp();
          return;
        }
        router.replace('/auth/sign-up');
        return;
      }

      if (signUp.status === 'complete') {
        await finalizeSignUp();
        return;
      }

      if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_new_password') {
        navigateToSignIn();
        return;
      }

      if (signIn.existingSession || signUp.existingSession) {
        const sessionId = signIn.existingSession?.sessionId || signUp.existingSession?.sessionId;
        if (sessionId) {
          await clerk.setActive({
            session: sessionId,
            navigate: navigateToDashboard,
          });
          return;
        }
      }

      navigateToSignIn();
    };

    void run().catch(() => {
      navigateToSignIn();
    });
  }, [clerk, signIn, signUp, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
        <div id="clerk-captcha" />
      </div>
    </div>
  );
}
