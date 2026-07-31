import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { SocialTaskCard } from '@/components/tasks/SocialTaskCard';

function platformFromTask(task: { type?: string | null; title?: string | null; description?: string | null }) {
  const text = `${task.type ?? ''} ${task.title ?? ''} ${task.description ?? ''}`.toLowerCase();
  if (text.includes('instagram')) return 'instagram';
  if (text.includes('youtube') || text.includes('subscribe')) return 'youtube';
  if (text.includes('tiktok')) return 'tiktok';
  if (text.includes('telegram')) return 'telegram';
  if (text.includes('whatsapp') || text.includes('status')) return 'whatsapp';
  if (text.includes('twitter') || text.includes('retweet') || text.includes(' x ')) return 'x';
  return 'facebook';
}

function actionFromType(type?: string | null) {
  const map: Record<string, string> = {
    like: 'Like Post', follow: 'Follow Us', comment: 'Comment', share: 'Like & Share',
    subscribe: 'Subscribe', join: 'Join Channel', visit: 'Visit Website', review: 'Post Review', general: 'Complete Task',
  };
  return map[type ?? 'general'] ?? 'Complete Task';
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reserved?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: tasks, error }] = await Promise.all([
    supabase.from('profiles').select('full_name,role').eq('id', user.id).maybeSingle(),
    supabase
      .from('tasks')
      .select(`id,title,description,type,reward_amount,slots_available,total_slots,reservation_minutes,minimum_trust_score,campaign_id,campaigns!inner(title,status)`)
      .eq('status', 'active')
      .eq('campaigns.status', 'active')
      .gt('slots_available', 0)
      .order('created_at', { ascending: false }),
  ]);

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Worker';
  const role = profile?.role ?? 'worker';
  const isAdmin = ['super_admin','task_manager','proof_reviewer','finance_admin','support_admin','auditor'].includes(role);

  return (
    <AppShell userName={displayName} userRole={role} isAdmin={isAdmin}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <p className="text-sm font-semibold text-green-600">Available work</p>
          <h1 className="mt-1 text-3xl font-black">Tasks</h1>
          <p className="mt-2 text-sm text-slate-500">Choose a verified task, reserve it and submit proof before the timer expires.</p>
        </div>

        {query.error || error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{query.error ?? error?.message}</div> : null}
        {query.reserved ? <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">Task reserved successfully.</div> : null}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {(tasks ?? []).map((task: any) => (
            <SocialTaskCard
              key={task.id}
              id={task.id}
              platform={platformFromTask(task)}
              title={task.title}
              action={actionFromType(task.type)}
              reward={Number(task.reward_amount ?? 0)}
              slots={Number(task.slots_available ?? 0)}
              type={task.type ?? 'general'}
              time={`${task.reservation_minutes || 60} min`}
            />
          ))}
        </section>

        {!tasks?.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">No tasks are currently available.</div>
        ) : null}
      </div>
    </AppShell>
  );
}
