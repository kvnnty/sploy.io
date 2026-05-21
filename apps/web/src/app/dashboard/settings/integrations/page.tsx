'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useActiveTeamId } from '@/components/dashboard/active-team-provider';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/query-keys';
import { useAnalysisService } from '@/hooks/service-instances';
import { ApiError } from '@/lib/axios';
import { SettingsShell } from '../settings-shell';

export default function IntegrationsSettingsPage() {
  const teamId = useActiveTeamId();
  const analysisApi = useAnalysisService();
  const queryClient = useQueryClient();
  const [webhookUrl, setWebhookUrl] = useState('');

  const slackQuery = useQuery({
    queryKey: queryKeys.analysis.slack(teamId ?? ''),
    queryFn: () => analysisApi.getSlackStatus(teamId!),
    enabled: Boolean(teamId),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!teamId) throw new Error('No team');
      await analysisApi.saveSlackWebhook(teamId, webhookUrl);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.analysis.slack(teamId ?? ''),
      });
      toast.success('Slack webhook saved');
      setWebhookUrl('');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'Save failed');
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      if (!teamId) throw new Error('No team');
      return analysisApi.testSlackWebhook(teamId);
    },
    onSuccess: () => toast.success('Test message sent to Slack'),
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'Test failed');
    },
  });

  return (
    <SettingsShell>
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Slack</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste an incoming webhook URL from your Slack app. Approved decision
            briefs will post to that channel.
          </p>
        </div>

        {slackQuery.data?.configured ? (
          <p className="text-xs text-primary">Webhook configured for this team.</p>
        ) : (
          <p className="text-xs text-muted-foreground">No webhook configured yet.</p>
        )}

        <label className="block text-sm font-medium text-foreground">
          Incoming webhook URL
          <input
            type="url"
            className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            placeholder="https://hooks.slack.com/services/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saveMutation.isPending || webhookUrl.trim().length < 10}
            onClick={() => void saveMutation.mutateAsync()}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save webhook'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!slackQuery.data?.configured || testMutation.isPending}
            onClick={() => void testMutation.mutateAsync()}
          >
            {testMutation.isPending ? 'Sending…' : 'Send test message'}
          </Button>
        </div>
      </section>
    </SettingsShell>
  );
}
