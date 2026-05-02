'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s.slice(0, 50) || 'team';
}

export function OrgOnboarding({ email }: { email: string }) {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onNameChange(name: string) {
    setOrgName(name);
    if (!slugTouched) setOrgSlug(slugify(name));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = orgName.trim() || 'My organization';
    const slug = (orgSlug.trim() || slugify(name)).toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Slug must be lowercase letters, numbers, and hyphens only.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/bootstrap', {
        method: 'POST',
        body: JSON.stringify({
          displayName: email.split('@')[0],
          orgName: name,
          orgSlug: slug,
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create organization');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-md border-white/10 bg-white/3 ring-white/10">
      <CardHeader>
        <CardTitle>Set up your workspace</CardTitle>
        <CardDescription>
          Create an organization to connect data sources and run decision-focused
          analysis. You can invite teammates later.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <label htmlFor="org-name" className="text-xs font-medium text-muted-foreground">
              Organization name
            </label>
            <input
              id="org-name"
              value={orgName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Acme Inc."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="org-slug" className="text-xs font-medium text-muted-foreground">
              URL slug
            </label>
            <input
              id="org-slug"
              value={orgSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setOrgSlug(e.target.value.toLowerCase());
              }}
              placeholder="acme-inc"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
        </CardContent>
        <CardFooter className="border-white/10">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating…' : 'Continue'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
