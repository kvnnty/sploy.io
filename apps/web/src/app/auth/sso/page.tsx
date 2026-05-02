'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';

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
      setError(error.errors?.[0]?.longMessage ?? error.errors?.[0]?.message ?? 'SSO sign-in failed');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Enterprise SSO</h1>
          <p className="mt-1 text-sm text-white/60">
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
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-white/20 focus:ring-1 focus:ring-white/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Continue with SSO'}
          </button>
        </form>

        <a
          href="/auth/login"
          className="block text-center text-sm text-white/50 transition hover:text-white/70"
        >
          Back to sign in
        </a>
      </div>
    </div>
  );
}
