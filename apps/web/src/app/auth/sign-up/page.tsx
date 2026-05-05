'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useClerk, useSignUp } from '@clerk/nextjs';
import { OAuthLastUsedBadge } from '@/components/auth/oauth-last-used-badge';
import Logo from '@/components/shared/logo';
import { formatClerkError } from '@/lib/clerk-errors';
import { useLastOAuthStrategy, type OAuthStrategy } from '@/lib/last-oauth-strategy';

export default function SignUpPage() {
  const { loaded: clerkLoaded } = useClerk();
  const { signUp } = useSignUp();
  const { lastStrategy, rememberStrategy } = useLastOAuthStrategy();
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUpWithOAuth(strategy: OAuthStrategy) {
    if (!signUp) return;
    rememberStrategy(strategy);
    setError(null);
    const { error: err } = await signUp.sso({
      strategy,
      redirectUrl: '/auth/sso-callback',
      redirectCallbackUrl: '/dashboard',
    });
    if (err) setError(formatClerkError(err));
  }

  async function signUpWithMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !signUp) return;
    setLoading(true);
    setError(null);

    const { error: createError } = await signUp.create({ emailAddress: email });
    if (createError) {
      setError(formatClerkError(createError));
      setLoading(false);
      return;
    }

    const protocol = window.location.protocol;
    const host = window.location.host;

    const { error: sendError } = await signUp.verifications.sendEmailLink({
      verificationUrl: `${protocol}//${host}/auth/verify-signup`,
    });

    if (sendError) {
      setError(formatClerkError(sendError));
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  }

  if (!clerkLoaded || !signUp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      </div>
    );
  }

  if (magicLinkSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-sm space-y-4 flex flex-col items-center justify-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-center text-xl font-semibold text-foreground">Check your email</h2>
          <p className="text-center text-sm text-muted-foreground">
            We sent a verification link to <strong className="text-foreground">{email}</strong>.
            Open it to finish creating your account.
          </p>
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="text-center flex flex-col items-center justify-center gap-5">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signUpWithOAuth('oauth_google')}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/70"
          >
            <span className="flex min-w-0 flex-1 items-center justify-center gap-3">
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </span>
            {lastStrategy === 'oauth_google' ? <OAuthLastUsedBadge /> : null}
          </button>

          <button
            type="button"
            onClick={() => signUpWithOAuth('oauth_microsoft')}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/70"
          >
            <span className="flex min-w-0 flex-1 items-center justify-center gap-3">
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Continue with Microsoft
            </span>
            {lastStrategy === 'oauth_microsoft' ? <OAuthLastUsedBadge /> : null}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-foreground/40">or</span>
          </div>
        </div>

        <form onSubmit={signUpWithMagicLink} className="space-y-3">
          <div id="clerk-captcha" />
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send verification link'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-foreground/40">enterprise</span>
          </div>
        </div>

        <Link
          href="/auth/sso"
          className="flex w-full items-center justify-center rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/70"
        >
          Sign up with SSO
        </Link>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-foreground hover:text-foreground/80 underline-offset-5 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
