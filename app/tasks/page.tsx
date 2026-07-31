import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FiFilter, FiSearch, FiX } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { SocialTaskCard } from '@/components/tasks/SocialTaskCard';
import { detectTaskPlatform } from '@/lib/task-platform';

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  reward_amount: number | string | null;
  slots_available: number | null;
  total_slots: number | null;
  reservation_minutes: number | null;
  minimum_trust_score: number | null;
  campaign_id: string | null;
  social_platform?: string | null;
  thumbnail_url?: string | null;
  banner_headline?: string | null;
  campaigns: { title?: string | null; status?: string | null } | { title?: string | null; status?: string | null }[] | null;
};

function actionFromType(type?: string | null) {
  const map: Record<string, string> = {
    like: 'Like Post', follow: 'Follow Us', comment: 'Comment', share: 'Like & Share',
    subscribe: 'Subscribe', join: 'Join Channel', visit: 'Visit Website', review: 'Post Review', general: 'Complete Task',
  };
  return map[type ?? 'general'] ?? 'Complete Task';
}

export default async function TasksPage({ searchParams }: {
  searchParams: Promise<{ error?: string; reserved?: string; q?: string; type?: string; platform?: string; min_reward?: string; sort?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name,role').eq('id', user.id).maybeSingle();

  const enhanced = await supabase
    .from('tasks')
    .select('id,title,description,type,reward_amount,slots_available,total_slots,reservation_minutes,minimum_trust_score,campaign_id,social_platform,thumbnail_url,banner_headline,campaigns!inner(title,status)')
    .eq('status', 'active').eq('campaigns.status', 'active').gt('slots_available', 0).order('created_at', { ascending: false });

  let rawTasks = enhanced.data as TaskRow[] | null;
  let taskError = enhanced.error;

  if (taskError && /column .* does not exist|schema cache/i.test(taskError.message)) {
    const fallback = await supabase
      .from('tasks')
      .select('id,title,description,type,reward_amount,slots_available,total_slots,reservation_minutes,minimum_trust_score,campaign_id,campaigns!inner(title,status)')
      .eq('status', 'active').eq('campaigns.status', 'active').gt('slots_available', 0).order('created_at', { ascending: false });
    rawTasks = fallback.data as TaskRow[] | null;
    taskError = fallback.error;
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Worker';
  const role = profile?.role ?? 'worker';
  const isAdmin = ['super_admin','admin','task_manager','proof_reviewer','finance_admin','support_admin','auditor'].includes(role);

  const search = (query.q ?? '').trim().toLowerCase();
  const selectedType = (query.type ?? '').trim().toLowerCase();
  const selectedPlatform = (query.platform ?? '').trim().toLowerCase();
  const minimumReward = Number(query.min_reward ?? 0);
  const sort = query.sort ?? 'newest';

  let tasks = (rawTasks ?? []).filter((task) => {
    const searchable = `${task.title ?? ''} ${task.description ?? ''} ${task.type ?? ''}`.toLowerCase();
    const platform = detectTaskPlatform(task);
    const reward = Number(task.reward_amount ?? 0);
    return (!search || searchable.includes(search)) && (!selectedType || task.type === selectedType) &&
      (!selectedPlatform || platform === selectedPlatform) && (!Number.isFinite(minimumReward) || reward >= minimumReward);
  });

  if (sort === 'reward_high') tasks.sort((a,b) => Number(b.reward_amount ?? 0)-Number(a.reward_amount ?? 0));
  else if (sort === 'reward_low') tasks.sort((a,b) => Number(a.reward_amount ?? 0)-Number(b.reward_amount ?? 0));
  else if (sort === 'slots') tasks.sort((a,b) => Number(b.slots_available ?? 0)-Number(a.slots_available ?? 0));

  const hasFilters = Boolean(search || selectedType || selectedPlatform || minimumReward || sort !== 'newest');

  return <AppShell userName={displayName} userRole={role} isAdmin={isAdmin}>
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-sm font-bold text-green-600">Available work</p><h1 className="mt-1 text-3xl font-black text-slate-950">Task center</h1><p className="mt-2 text-sm text-slate-500">Open a task to see its real thumbnail, complete instructions, proof requirements and schedule.</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm"><p className="text-xs font-semibold uppercase text-slate-500">Matching tasks</p><p className="mt-1 text-2xl font-black">{tasks.length.toLocaleString()}</p></div>
      </header>

      {query.error || taskError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{query.error ?? taskError?.message}</div> : null}
      {query.reserved ? <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">Task reserved successfully.</div> : null}

      <form className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="relative md:col-span-2"><FiSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"/><input name="q" defaultValue={query.q ?? ''} placeholder="Search tasks" className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-green-500"/></label>
          <select name="type" defaultValue={query.type ?? ''} className="h-11 rounded-xl border border-slate-300 px-3 text-sm"><option value="">All task types</option>{['like','follow','comment','share','subscribe','join','visit','review','general'].map(x=><option key={x} value={x}>{x}</option>)}</select>
          <select name="platform" defaultValue={query.platform ?? ''} className="h-11 rounded-xl border border-slate-300 px-3 text-sm"><option value="">All platforms</option>{['facebook','instagram','x','youtube','tiktok','telegram','whatsapp','linkedin','google','trustpilot','general'].map(x=><option key={x} value={x}>{x}</option>)}</select>
          <input name="min_reward" type="number" min="0" defaultValue={query.min_reward ?? ''} placeholder="Minimum reward" className="h-11 rounded-xl border border-slate-300 px-3 text-sm"/>
          <select name="sort" defaultValue={sort} className="h-11 rounded-xl border border-slate-300 px-3 text-sm"><option value="newest">Newest first</option><option value="reward_high">Highest reward</option><option value="reward_low">Lowest reward</option><option value="slots">Most slots</option></select>
        </div>
        <div className="mt-4 flex gap-3"><button className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white"><FiFilter/> Apply filters</button>{hasFilters?<Link href="/tasks" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold"><FiX/> Clear</Link>:null}</div>
      </form>

      {tasks.length ? <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{tasks.map(task => {
        const platform = detectTaskPlatform(task);
        return <SocialTaskCard key={task.id} id={task.id} platform={platform} title={task.title} action={task.banner_headline || actionFromType(task.type)} reward={Number(task.reward_amount ?? 0)} slots={Number(task.slots_available ?? 0)} type={task.type ?? 'general'} time={`${task.reservation_minutes || 60} min`} thumbnailUrl={task.thumbnail_url}/>;
      })}</section> : <div className="rounded-3xl border border-dashed bg-white px-6 py-16 text-center"><FiSearch className="mx-auto h-10 w-10 text-slate-300"/><h2 className="mt-4 text-lg font-black">No matching tasks</h2><p className="mt-2 text-sm text-slate-500">{hasFilters?'No task matches the selected filters.':'No active task currently has an open slot.'}</p></div>}
    </div>
  </AppShell>;
}
