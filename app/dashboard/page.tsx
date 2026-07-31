import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { FiArrowUpRight, FiCheckCircle, FiClock, FiDollarSign } from 'react-icons/fi';

type WorkerTaskSummary = {
  status: string;
  task_id: string;
  tasks:
    | { title: string | null; reward_amount: number | string | null }
    | { title: string | null; reward_amount: number | string | null }[]
    | null;
};

function getRelatedTask(relation: WorkerTaskSummary['tasks']) {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: profile },
    { count: availableTaskCount },
    { data: workerTasksData },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name,role').eq('id', user.id).maybeSingle(),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'active').gt('slots_available', 0),
    supabase.from('worker_tasks').select('status,task_id,tasks(title,reward_amount)').eq('worker_id', user.id).order('started_at', { ascending: false }).limit(8),
  ]);

  const workerTasks = (workerTasksData ?? []) as WorkerTaskSummary[];
  const startedCount = workerTasks.filter((item) => item.status === 'started').length;
  const submittedCount = workerTasks.filter((item) => item.status === 'submitted').length;
  const approvedEarnings = workerTasks
    .filter((item) => item.status === 'approved')
    .reduce((total, item) => total + Number(getRelatedTask(item.tasks)?.reward_amount ?? 0), 0);

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Worker';
  const role = profile?.role ?? 'worker';
  const isAdmin = ['super_admin','task_manager','proof_reviewer','finance_admin','support_admin','auditor'].includes(role);

  const stats = [
    { label: 'Approved earnings', value: `₦${approvedEarnings.toLocaleString('en-NG')}`, icon: FiDollarSign },
    { label: 'Available tasks', value: String(availableTaskCount ?? 0), icon: FiArrowUpRight },
    { label: 'Tasks in progress', value: String(startedCount), icon: FiClock },
    { label: 'Pending review', value: String(submittedCount), icon: FiCheckCircle },
  ];

  return (
    <AppShell userName={displayName} userRole={role} isAdmin={isAdmin}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-green-600">Welcome back</p>
            <h1 className="mt-1 text-3xl font-black text-slate-900">Dashboard Overview</h1>
            <p className="mt-2 text-sm text-slate-500">Track your tasks, proof reviews and earnings.</p>
          </div>
          <Link href="/tasks" className="rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-600/20 hover:bg-green-700">
            Browse Tasks
          </Link>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                </div>
                <div className="rounded-2xl bg-green-50 p-3 text-green-600"><Icon className="h-6 w-6" /></div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">Recent Tasks</h2>
              <p className="mt-1 text-sm text-slate-500">Your latest reserved and completed work.</p>
            </div>
            <Link href="/tasks" className="text-sm font-bold text-green-700 hover:text-green-800">Find more tasks</Link>
          </div>

          {workerTasks.length === 0 ? (
            <div className="py-14 text-center text-slate-500">You have not started any task yet.</div>
          ) : (
            <div className="mt-6 divide-y divide-slate-100">
              {workerTasks.map((item) => {
                const task = getRelatedTask(item.tasks);
                return (
                  <Link key={item.task_id} href={`/tasks/${item.task_id}`} className="flex flex-col gap-3 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-3">
                    <div>
                      <p className="font-semibold text-slate-900">{task?.title ?? 'Task'}</p>
                      <p className="mt-1 text-sm capitalize text-slate-500">{item.status.replaceAll('_', ' ')}</p>
                    </div>
                    <p className="font-black text-green-700">₦{Number(task?.reward_amount ?? 0).toLocaleString('en-NG')}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
