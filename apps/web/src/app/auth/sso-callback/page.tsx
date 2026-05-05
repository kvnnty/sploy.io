'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (!clerk.loaded || hasRun.current) return;
      hasRun.current = true;

      const navigateToDashboard = async ({ decorateUrl }: { decorateUrl: (path: string) => string }) => {
        const url = decorateUrl('/dashboard');
        if (url.startsWith('http')) {
          window.location.href = url;
        } else {
          router.replace(url);
        }
      };

      const navigateToSignIn = () => {
        router.replace('/auth/login');
      };

      if (signIn.status === 'complete') {
        await signIn.finalize({ navigate: navigateToDashboard });
        return;
      }

      if (signUp.isTransferable) {
        await signIn.create({ transfer: true });
      }

      if (signIn.isTransferable) {
        await signUp.create({ transfer: true });
      }

      if (signUp.status === 'complete') {
        await signUp.finalize({ navigate: navigateToDashboard });
        return;
      }

      const signInStatus = signIn.status as typeof signIn.status | 'complete';
      if (signInStatus === 'complete') {
        await signIn.finalize({ navigate: navigateToDashboard });
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
      router.replace('/auth/login');
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
