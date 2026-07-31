import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FiFilter, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { AdminTaskActions } from './components/AdminTaskActions';
import { detectTaskPlatform, generatedTaskThumbnail } from '@/lib/task-platform';

type AdminTask = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  platform?: string | null;
  social_platform?: string | null;
  thumbnail_url?: string | null;
  reward_amount: number | string | null;
  total_slots: number | null;
  slots_available: number | null;
  status: string | null;
  created_at: string | null;
};

type SearchParams = Promise<{
  q?: string;
  status?: string;
  platform?: string;
  message?: string;
  error?: string;
}>;

const adminRoles = ['super_admin', 'admin', 'task_manager'];

function money(value: number | string | null) {
  return `₦${Number(value ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function statusClass(status: string) {
  if (status === 'active') return 'bg-green-100 text-green-700';
  if (status === 'paused') return 'bg-amber-100 text-amber-700';
  if (status === 'draft') return 'bg-slate-100 text-slate-700';
  if (status === 'completed') return 'bg-blue-100 text-blue-700';
  return 'bg-red-100 text-red-700';
}

export default async function AdminTasksPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?error=Please+sign+in+to+continue.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name,role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? 'worker';
  if (!adminRoles.includes(role)) {
    redirect('/dashboard?error=You+are+not+authorized+to+manage+tasks.');
  }

  let response = await supabase
    .from('tasks')
    .select('id,title,description,type,platform,social_platform,thumbnail_url,reward_amount,total_slots,slots_available,status,created_at')
    .order('created_at', { ascending: false });

  if (response.error && /column .* does not exist|schema cache/i.test(response.error.message)) {
    response = await supabase
      .from('tasks')
      .select('id,title,description,type,reward_amount,total_slots,slots_available,status,created_at')
      .order('created_at', { ascending: false });
  }

  const search = (query.q ?? '').trim().toLowerCase();
  const statusFilter = (query.status ?? '').trim().toLowerCase();
  const platformFilter = (query.platform ?? '').trim().toLowerCase();

  const tasks = ((response.data ?? []) as AdminTask[]).filter((task) => {
    const platform = detectTaskPlatform({
      social_platform: task.social_platform ?? task.platform,
      type: task.type,
      title: task.title,
      description: task.description,
    });
    const searchable = `${task.title ?? ''} ${task.description ?? ''} ${task.type ?? ''} ${platform}`.toLowerCase();
    return (!search || searchable.includes(search)) &&
      (!statusFilter || task.status === statusFilter) &&
      (!platformFilter || platform === platformFilter);
  });

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Administrator';
  const hasFilters = Boolean(search || statusFilter || platformFilter);

  return (
    <AppShell userName={displayName} userRole={role} isAdmin>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Task management"
          title="All created tasks"
          description="View every task and edit, suspend, resume or delete it. Thumbnails are displayed separately from task titles for a clear preview."
          action={
            <Link href="/admin/tasks/new" className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700">
              <FiPlus /> Create Task
            </Link>
          }
        />

        {query.message ? <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">{query.message}</div> : null}
        {query.error || response.error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{query.error ?? response.error?.message}</div> : null}

        <form className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="relative md:col-span-2">
              <FiSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={query.q ?? ''} placeholder="Search title, description or task type" className="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm outline-none focus:border-green-500" />
            </label>
            <select name="status" defaultValue={query.status ?? ''} className="h-11 rounded-xl border border-slate-300 px-3 text-sm">
              <option value="">All statuses</option>
              {['active', 'paused', 'draft', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select name="platform" defaultValue={query.platform ?? ''} className="h-11 rounded-xl border border-slate-300 px-3 text-sm">
              <option value="">All platforms</option>
              {['facebook','instagram','x','youtube','tiktok','telegram','whatsapp','linkedin','google','trustpilot','general'].map((platform) => <option key={platform} value={platform}>{platform}</option>)}
            </select>
            <div className="flex gap-2">
              <button className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white"><FiFilter /> Filter</button>
              {hasFilters ? <Link href="/admin/tasks" aria-label="Clear filters" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300"><FiX /></Link> : null}
            </div>
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-sm font-bold text-slate-900">{tasks.length.toLocaleString()} task{tasks.length === 1 ? '' : 's'}</p>
          </div>

          {tasks.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Thumbnail</th>
                    <th className="px-5 py-4">Task title</th>
                    <th className="px-5 py-4">Platform</th>
                    <th className="px-5 py-4">Reward</th>
                    <th className="px-5 py-4">Slots</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((task) => {
                    const platform = detectTaskPlatform({
                      social_platform: task.social_platform ?? task.platform,
                      type: task.type,
                      title: task.title,
                      description: task.description,
                    });
                    const thumbnail = task.thumbnail_url || generatedTaskThumbnail(platform);
                    return (
                      <tr key={task.id} className="align-middle hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <Link href={`/tasks/${task.id}`} className="block h-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                            <img src={thumbnail} alt={`${platform} task thumbnail`} className="h-full w-full object-cover" />
                          </Link>
                        </td>
                        <td className="max-w-xs px-5 py-4">
                          <Link href={`/tasks/${task.id}`} className="font-bold text-slate-950 hover:text-green-700">{task.title || 'Untitled task'}</Link>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{task.description || 'No description provided.'}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold capitalize text-slate-700">{platform}</td>
                        <td className="px-5 py-4 font-black text-slate-950">{money(task.reward_amount)}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">
                          <span className="font-bold">{Number(task.slots_available ?? 0)}</span>
                          <span className="text-slate-400"> / {Number(task.total_slots ?? 0)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(task.status ?? 'draft')}`}>{task.status ?? 'draft'}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">{task.created_at ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(task.created_at)) : '—'}</td>
                        <td className="px-5 py-4"><AdminTaskActions taskId={task.id} status={task.status ?? 'draft'} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <FiSearch className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-lg font-black text-slate-900">No tasks found</h2>
              <p className="mt-2 text-sm text-slate-500">{hasFilters ? 'No task matches your current filters.' : 'Create your first task to see it here.'}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
