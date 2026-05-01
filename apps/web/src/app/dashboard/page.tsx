import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="mx-auto w-full max-w-lg space-y-6 rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-white/60">
          Signed in as <strong className="text-white">{user.email}</strong>
        </p>
        <pre className="overflow-auto rounded-lg bg-black/30 p-4 text-xs text-white/50">
          {JSON.stringify({ id: user.id, email: user.email, provider: user.app_metadata.provider }, null, 2)}
        </pre>
        <a
          href="/logout"
          className="inline-block rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
        >
          Sign out
        </a>
      </div>
    </div>
  );
}
