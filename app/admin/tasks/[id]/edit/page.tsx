import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateTask } from '@/app/admin/tasks/actions';
import { AppShell } from '@/components/layout/AppShell';
import { detectTaskPlatform, generatedTaskThumbnail } from '@/lib/task-platform';

type EditTaskPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

type TaskRecord = {
  id: string;
  title: string | null;
  description: string | null;
  instructions: string | null;
  platform?: string | null;
  social_platform?: string | null;
  thumbnail_url?: string | null;
  type: string | null;
  task_url: string | null;
  reward_amount: number | string | null;
  total_slots: number | null;
  proof_instructions: string | null;
  status: string | null;
};

const allowedAdminRoles = ['super_admin', 'admin', 'task_manager'];

export default async function EditTaskPage({ params, searchParams }: EditTaskPageProps) {
  const { id } = await params;
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
  if (!allowedAdminRoles.includes(role)) {
    redirect('/dashboard?error=You+are+not+authorized+to+manage+tasks.');
  }

  let response = await supabase
    .from('tasks')
    .select('id,title,description,instructions,platform,social_platform,thumbnail_url,type,task_url,reward_amount,total_slots,proof_instructions,status')
    .eq('id', id)
    .maybeSingle();

  if (response.error && /column .* does not exist|schema cache/i.test(response.error.message)) {
    response = await supabase
      .from('tasks')
      .select('id,title,description,instructions,platform,type,task_url,reward_amount,total_slots,proof_instructions,status')
      .eq('id', id)
      .maybeSingle();
  }

  if (response.error || !response.data) notFound();

  const task = response.data as TaskRecord;
  const platform = detectTaskPlatform({
    social_platform: task.social_platform ?? task.platform,
    type: task.type,
    title: task.title,
    description: task.description,
  });
  const thumbnail = task.thumbnail_url || generatedTaskThumbnail(platform);
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Administrator';

  return (
    <AppShell userName={displayName} userRole={role} isAdmin>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-green-600">Task management</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Edit task</h1>
            <p className="mt-2 text-sm text-slate-500">Update the real task details shown to workers.</p>
          </div>
          <Link href="/admin/tasks" className="w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:border-green-500 hover:text-green-700">Back to tasks</Link>
        </header>

        {query.error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{query.error}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
              <img src={thumbnail} alt={`${platform} task thumbnail`} className="h-full w-full object-cover" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-green-600">{platform}</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">{task.title || 'Untitled task'}</h2>
            <p className="mt-2 text-sm text-slate-500">The thumbnail is kept separate from the title so the image remains clear.</p>
            <Link href={`/tasks/${task.id}`} className="mt-4 block rounded-xl border border-green-600 px-4 py-2.5 text-center text-sm font-bold text-green-700 hover:bg-green-600 hover:text-white">View public task</Link>
          </aside>

          <form action={updateTask} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <input type="hidden" name="task_id" value={task.id} />

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Task title</span>
              <input name="title" required defaultValue={task.title ?? ''} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Short description</span>
              <textarea name="description" required rows={3} defaultValue={task.description ?? ''} className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Full instructions</span>
              <textarea name="instructions" required rows={7} defaultValue={task.instructions ?? ''} className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500" />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Platform</span>
                <select name="platform" defaultValue={task.platform ?? platform} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500">
                  {['facebook','instagram','tiktok','youtube','whatsapp','telegram','x','linkedin','google','trustpilot','general'].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Task type</span>
                <select name="taskType" defaultValue={task.type ?? 'general'} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500">
                  {['follow','like','comment','share','subscribe','join','visit','review','general'].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Task URL</span>
              <input name="taskUrl" type="url" defaultValue={task.task_url ?? ''} placeholder="https://example.com/task" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500" />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Reward amount</span>
                <input name="rewardAmount" type="number" min="0.01" step="0.01" required defaultValue={Number(task.reward_amount ?? 0)} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Total worker slots</span>
                <input name="totalSlots" type="number" min="1" step="1" required defaultValue={task.total_slots ?? 1} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500" />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Required proof</span>
              <textarea name="proofInstructions" rows={4} defaultValue={task.proof_instructions ?? ''} className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Status</span>
              <select name="status" defaultValue={task.status ?? 'draft'} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500">
                {['draft','active','paused','completed','cancelled'].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>

            <button type="submit" className="w-full rounded-xl bg-green-600 px-5 py-4 font-bold text-white transition hover:bg-green-700">Save changes</button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
