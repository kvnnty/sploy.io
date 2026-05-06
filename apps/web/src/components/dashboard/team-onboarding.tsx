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
import { useBootstrapMutation } from '@/hooks/useAuth';

function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s.slice(0, 50) || 'team';
}

export function TeamOnboarding({ email }: { email: string }) {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [teamSlug, setTeamSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const bootstrap = useBootstrapMutation();
  const error = localError ?? bootstrap.error?.message ?? null;

  function onNameChange(name: string) {
    setTeamName(name);
    if (!slugTouched) setTeamSlug(slugify(name));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const name = teamName.trim() || 'My team';
    const slug = (teamSlug.trim() || slugify(name)).toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setLocalError(
        'Slug must be lowercase letters, numbers, and hyphens only.',
      );
      return;
    }
    try {
      await bootstrap.mutateAsync({
        displayName: email.split('@')[0],
        teamName: name,
        teamSlug: slug,
      });
      router.refresh();
    } catch {
      /* surfaced via bootstrap.error */
    }
  }

  return (
    <Card className="max-w-md border-border bg-card/80 ring-border">
      <CardHeader>
        <CardTitle>Set up your workspace</CardTitle>
        <CardDescription>
          Create a team to connect data sources and run decision-focused
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
            <label htmlFor="team-name" className="text-xs font-medium text-muted-foreground">
              Team name
            </label>
            <input
              id="team-name"
              value={teamName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Acme Inc."
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="team-slug" className="text-xs font-medium text-muted-foreground">
              URL slug
            </label>
            <input
              id="team-slug"
              value={teamSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setTeamSlug(e.target.value.toLowerCase());
              }}
              placeholder="acme-inc"
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
        </CardContent>
        <CardFooter className="border-border">
          <Button type="submit" disabled={bootstrap.isPending} className="w-full">
            {bootstrap.isPending ? 'Creating…' : 'Continue'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
