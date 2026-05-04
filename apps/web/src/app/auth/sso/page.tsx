'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { formatClerkError } from '@/lib/clerk-errors';

export default function SSOPage() {
  const { signIn } = useSignIn();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSSO(e: React.FormEvent) {
    e.preventDefault();
    if (!domain || !signIn) return;
    setLoading(true);
    setError(null);

    const { error } = await signIn.sso({
      strategy: 'enterprise_sso',
      identifier: domain,
      redirectUrl: '/auth/sso-callback',
      redirectCallbackUrl: '/dashboard',
    });

    if (error) {
      setError(formatClerkError(error));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Enterprise SSO</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your company email domain to sign in via SAML
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSSO} className="space-y-3">
          <input
            type="text"
            placeholder="company.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Continue with SSO'}
          </button>
        </form>

        <a
          href="/auth/login"
          className="block text-center text-sm text-muted-foreground transition hover:text-foreground"
        >
          Back to sign in
        </a>
      </div>
    </div>
  );
}
