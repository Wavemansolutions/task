import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { updateTask } from '@/app/admin/tasks/actions';
import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';

type EditTaskPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

type TaskRecord = {
  id: string;
  title: string | null;
  description: string | null;
  instructions: string | null;
  platform: string | null;
  type: string | null;
  task_url: string | null;
  reward_amount: number | string | null;
  total_slots: number | null;
  proof_instructions: string | null;
  status: string | null;
};

type ProfileRecord = {
  full_name: string | null;
  role: string | null;
};

const allowedAdminRoles = ['super_admin', 'task_manager'];

const supportedPlatforms = new Set([
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'whatsapp',
  'telegram',
  'x',
  'linkedin',
  'google',
  'trustpilot',
  'website',
  'general',
]);

function getPlatformThumbnail(platform: string | null) {
  const normalizedPlatform = platform?.toLowerCase().trim() || 'general';

  const safePlatform = supportedPlatforms.has(normalizedPlatform)
    ? normalizedPlatform
    : 'general';

  return `/task-thumbnails/${safePlatform}.svg`;
}

export default async function EditTaskPage({
  params,
  searchParams,
}: EditTaskPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=Please+sign+in+to+continue.');
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('full_name,role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    redirect(
      `/dashboard?error=${encodeURIComponent(
        'Unable to verify your administrator profile.',
      )}`,
    );
  }

  const profile = profileData as ProfileRecord | null;
  const userRole = profile?.role ?? 'worker';

  if (!allowedAdminRoles.includes(userRole)) {
    redirect(
      '/dashboard?error=You+are+not+authorized+to+manage+tasks.',
    );
  }

  const { data, error } = await supabase
    .from('tasks')
    .select(
      [
        'id',
        'title',
        'description',
        'instructions',
        'platform',
        'type',
        'task_url',
        'reward_amount',
        'total_slots',
        'proof_instructions',
        'status',
      ].join(','),
    )
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const task = data as TaskRecord;
  const thumbnail = getPlatformThumbnail(task.platform);

  return (
    <AppShell
      userName={
        profile?.full_name ||
        user.email?.split('@')[0] ||
        'Administrator'
      }
      userRole={userRole}
      isAdmin
    >
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-green-600">
                Task Money Admin
              </p>

              <h1 className="mt-2 text-3xl font-extrabold text-slate-950">
                Edit Task
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Update the task information, reward, proof
                requirements and publishing status.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/tasks/${task.id}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-green-300 hover:text-green-700"
              >
                View public task
              </Link>

              <Link
                href="/admin/tasks"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to tasks
              </Link>
            </div>
          </header>

          {query.error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {query.error}
            </div>
          ) : null}

          {query.success ? (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              {query.success}
            </div>
          ) : null}

          <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="grid md:grid-cols-[320px_1fr]">
              <div className="bg-slate-100 p-5">
                <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <img
                    src={thumbnail}
                    alt={`${task.platform ?? 'General'} task thumbnail`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-green-600">
                  {task.platform ?? 'General'} task
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  {task.title || 'Untitled task'}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {task.description ||
                    'This task does not have a description yet.'}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold capitalize text-green-700">
                    {task.status ?? 'draft'}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                    {task.type ?? 'general'}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    ₦
                    {Number(task.reward_amount ?? 0).toLocaleString(
                      'en-NG',
                      {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <form
            action={updateTask}
            className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <input type="hidden" name="task_id" value={task.id} />

            <section>
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-950">
                  Basic information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Edit the title, description and worker instructions.
                </p>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Task title
                  </span>

                  <input
                    name="title"
                    required
                    defaultValue={task.title ?? ''}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Short description
                  </span>

                  <textarea
                    name="description"
                    required
                    rows={3}
                    defaultValue={task.description ?? ''}
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Full instructions
                  </span>

                  <textarea
                    name="instructions"
                    required
                    rows={7}
                    defaultValue={task.instructions ?? ''}
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </label>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-950">
                  Platform and action
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select where the task happens and what the worker
                  must do.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Platform
                  </span>

                  <select
                    name="platform"
                    defaultValue={task.platform ?? 'general'}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="x">X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="google">Google</option>
                    <option value="trustpilot">Trustpilot</option>
                    <option value="website">Website</option>
                    <option value="general">General</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Task type
                  </span>

                  <select
                    name="taskType"
                    defaultValue={task.type ?? 'general'}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  >
                    <option value="follow">Follow account</option>
                    <option value="like">Like post</option>
                    <option value="comment">Comment</option>
                    <option value="share">Share post</option>
                    <option value="subscribe">Subscribe</option>
                    <option value="join">Join group</option>
                    <option value="visit">Visit website</option>
                    <option value="review">Submit review</option>
                    <option value="general">General task</option>
                  </select>
                </label>
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Task URL
                </span>

                <input
                  name="taskUrl"
                  type="url"
                  defaultValue={task.task_url ?? ''}
                  placeholder="https://example.com/task"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </label>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-950">
                  Reward and worker slots
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure how much workers earn and how many can
                  complete this task.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Reward amount
                  </span>

                  <input
                    name="rewardAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    defaultValue={Number(task.reward_amount ?? 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Number of worker slots
                  </span>

                  <input
                    name="totalSlots"
                    type="number"
                    min="1"
                    step="1"
                    required
                    defaultValue={task.total_slots ?? 1}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </label>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-950">
                  Proof and publishing
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Define the required evidence and current task
                  availability.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Required proof
                </span>

                <textarea
                  name="proofInstructions"
                  rows={4}
                  defaultValue={task.proof_instructions ?? ''}
                  placeholder="Describe the screenshot, URL or other evidence the worker must submit."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </span>

                <select
                  name="status"
                  defaultValue={task.status ?? 'draft'}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/admin/tasks"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </AppShell>
  );
}