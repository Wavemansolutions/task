import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import {
  FiArrowRight,
  FiBell,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiTrendingUp,
} from 'react-icons/fi';

type RelatedTask = {
  title: string | null;
  reward_amount: number | string | null;
  type?: string | null;
};

type WorkerTask = {
  status: string;
  task_id: string;
  started_at: string | null;
  tasks: RelatedTask | RelatedTask[] | null;
};

type AvailableTask = {
  id: string;
  title: string | null;
  type: string | null;
  reward_amount: number | string | null;
  slots_available: number | null;
  reservation_minutes: number | null;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

function relatedTask(relation: WorkerTask['tasks']) {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function money(value: number | string | null | undefined) {
  return `₦${Number(value ?? 0).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function readableStatus(status: string) {
  return status.replaceAll('_', ' ');
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusClasses(status: string) {
  if (status === 'approved' || status === 'completed') {
    return 'bg-green-50 text-green-700 ring-green-600/20';
  }
  if (status === 'submitted' || status === 'pending_review') {
    return 'bg-amber-50 text-amber-700 ring-amber-600/20';
  }
  if (status === 'rejected' || status === 'cancelled' || status === 'expired') {
    return 'bg-red-50 text-red-700 ring-red-600/20';
  }
  return 'bg-blue-50 text-blue-700 ring-blue-600/20';
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [
    profileResult,
    walletResult,
    availableCountResult,
    workerTasksResult,
    availableTasksResult,
    notificationsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name,role')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('worker_wallet_summary')
      .select('available_balance,pending_balance,lifetime_earned,lifetime_withdrawn')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gt('slots_available', 0),
    supabase
      .from('worker_tasks')
      .select('status,task_id,started_at,tasks(title,reward_amount,type)')
      .eq('worker_id', user.id)
      .order('started_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('id,title,type,reward_amount,slots_available,reservation_minutes')
      .eq('status', 'active')
      .gt('slots_available', 0)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('notifications')
      .select('id,title,message,type,link,is_read,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const profile = profileResult.data;
  const wallet = walletResult.data;
  const workerTasks = (workerTasksResult.data ?? []) as WorkerTask[];
  const availableTasks = (availableTasksResult.data ?? []) as AvailableTask[];
  const notifications = (notificationsResult.data ?? []) as NotificationItem[];

  const completedCount = workerTasks.filter((item) =>
    ['approved', 'completed'].includes(item.status),
  ).length;
  const pendingCount = workerTasks.filter((item) =>
    ['submitted', 'pending_review'].includes(item.status),
  ).length;
  const inProgressCount = workerTasks.filter((item) =>
    ['started', 'reserved', 'in_progress'].includes(item.status),
  ).length;
  const unreadNotifications = notifications.filter((item) => !item.is_read).length;

  const displayName =
    profile?.full_name || user.email?.split('@')[0] || 'Worker';
  const role = profile?.role ?? 'worker';
  const isAdmin = [
    'super_admin',
    'task_manager',
    'proof_reviewer',
    'finance_admin',
    'support_admin',
    'auditor',
  ].includes(role);

  const stats = [
    {
      label: 'Available balance',
      value: money(wallet?.available_balance),
      hint: `${money(wallet?.pending_balance)} pending`,
      href: '/wallet',
      icon: FiCreditCard,
    },
    {
      label: 'Lifetime earnings',
      value: money(wallet?.lifetime_earned),
      hint: `${money(wallet?.lifetime_withdrawn)} withdrawn`,
      href: '/earnings',
      icon: FiDollarSign,
    },
    {
      label: 'Completed tasks',
      value: completedCount.toLocaleString('en-NG'),
      hint: `${inProgressCount.toLocaleString('en-NG')} in progress`,
      href: '/my-tasks',
      icon: FiCheckCircle,
    },
    {
      label: 'Pending reviews',
      value: pendingCount.toLocaleString('en-NG'),
      hint: `${(availableCountResult.count ?? 0).toLocaleString('en-NG')} tasks available`,
      href: '/my-tasks',
      icon: FiClock,
    },
  ];

  const queryErrors = [
    walletResult.error,
    availableCountResult.error,
    workerTasksResult.error,
    availableTasksResult.error,
    notificationsResult.error,
  ].filter(Boolean);

  return (
    <AppShell userName={displayName} userRole={role} isAdmin={isAdmin}>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-green-600">Welcome back, {displayName}</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Your Task Money dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Every figure below comes from your Task Money account and Supabase records.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-green-200 hover:text-green-700"
            >
              <FiCreditCard className="h-4 w-4" />
              Open wallet
            </Link>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
            >
              Browse tasks
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {queryErrors.length > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Some dashboard records could not be loaded. Empty values are shown as zero rather than replaced with sample data.
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, hint, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-2 truncate text-2xl font-black text-slate-950 sm:text-3xl">
                    {value}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-500">{hint}</p>
                </div>
                <div className="rounded-2xl bg-green-50 p-3 text-green-600 transition group-hover:bg-green-600 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <FiBriefcase className="h-5 w-5 text-green-600" />
                  <h2 className="text-xl font-black text-slate-950">Recent task activity</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">Your latest task records.</p>
              </div>
              <Link href="/my-tasks" className="text-sm font-bold text-green-700 hover:text-green-800">
                View all
              </Link>
            </div>

            {workerTasks.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <FiBriefcase className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 font-bold text-slate-900">No task activity yet</h3>
                <p className="mt-1 text-sm text-slate-500">Reserve a task to begin building your history.</p>
                <Link href="/tasks" className="mt-5 inline-flex rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700">
                  Find a task
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {workerTasks.slice(0, 8).map((item, index) => {
                  const task = relatedTask(item.tasks);
                  return (
                    <Link
                      key={`${item.task_id}-${index}`}
                      href={`/tasks/${item.task_id}`}
                      className="flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{task?.title ?? 'Task'}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(item.started_at)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${statusClasses(item.status)}`}>
                          {readableStatus(item.status)}
                        </span>
                        <span className="min-w-20 text-right font-black text-green-700">
                          {money(task?.reward_amount)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <FiBell className="h-5 w-5 text-green-600" />
                  <h2 className="text-xl font-black text-slate-950">Notifications</h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">{unreadNotifications} unread</p>
              </div>
              <Link href="/notifications" className="text-sm font-bold text-green-700 hover:text-green-800">
                View all
              </Link>
            </div>

            {notifications.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <FiBell className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 font-bold text-slate-900">No notifications</h3>
                <p className="mt-1 text-sm text-slate-500">Account updates will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.link || '/notifications'}
                    className="block px-6 py-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.is_read ? 'bg-slate-300' : 'bg-green-500'}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{notification.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</p>
                        <p className="mt-2 text-[11px] text-slate-400">{formatDate(notification.created_at)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FiTrendingUp className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-black text-slate-950">Available tasks</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {(availableCountResult.count ?? 0).toLocaleString('en-NG')} active task{availableCountResult.count === 1 ? '' : 's'} with open slots.
              </p>
            </div>
            <Link href="/tasks" className="text-sm font-bold text-green-700 hover:text-green-800">
              Browse all tasks
            </Link>
          </div>

          {availableTasks.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500">
              No tasks are currently available.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {availableTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="grid gap-3 px-6 py-4 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">{task.title ?? 'Untitled task'}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">{readableStatus(task.type ?? 'general')}</p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {Number(task.slots_available ?? 0).toLocaleString('en-NG')} slots
                  </div>
                  <div className="text-sm text-slate-500">
                    {Number(task.reservation_minutes ?? 60).toLocaleString('en-NG')} min
                  </div>
                  <div className="font-black text-green-700">{money(task.reward_amount)}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
