'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SessionsList } from '@/components/settings/sessions-list';
import type { ProviderStatus } from '@/types';
import {
  useConnectProviderMutation,
  useConnectedAccountsQuery,
  useDisconnectProviderMutation,
} from '@/hooks/useAuth';

const providerMeta: Record<string, { label: string; icon: string }> = {
  google: { label: 'Google', icon: 'G' },
  github: { label: 'GitHub', icon: 'GH' },
  microsoft: { label: 'Microsoft', icon: 'MS' },
};

function ProviderCard({ provider }: { provider: ProviderStatus }) {
  const connect = useConnectProviderMutation();
  const disconnect = useDisconnectProviderMutation();
  const loading = connect.isPending || disconnect.isPending;
  const meta = providerMeta[provider.provider] ?? {
    label: provider.provider,
    icon: provider.provider[0]?.toUpperCase() ?? '?',
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground">
          {meta.icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{meta.label}</p>
          {provider.connected && provider.email ? (
            <p className="text-xs text-muted-foreground">{provider.email}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {provider.connected ? (
          <>
            <Badge variant="secondary">Connected</Badge>
            <Button
              variant="outline"
              size="xs"
              onClick={() => void disconnect.mutateAsync(provider.provider)}
              disabled={loading}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={() => void connect.mutateAsync(provider.provider)}
            disabled={loading}
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SecuritySettingsPage() {
  const providersQuery = useConnectedAccountsQuery();
  const loaded = !providersQuery.isPending;
  const error =
    providersQuery.isError ? 'Could not load connected accounts.' : null;
  const providers = providersQuery.data ?? [];

  return (
    <div className="space-y-6">
      <SessionsList />
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Link additional sign-in providers. You must always keep at least one
            active method to avoid account lockout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loaded ? (
            <p className="text-sm text-muted-foreground">Loading providers…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No providers available yet. Check back later.
            </p>
          ) : (
            <div className="space-y-3">
              {providers.map((p) => (
                <ProviderCard key={p.provider} provider={p} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
