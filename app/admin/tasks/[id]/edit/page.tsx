import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTask } from "@/app/admin/tasks/actions";

type EditTaskPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
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

const allowedAdminRoles = [
  "super_admin",
  "task_manager",
];

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
    redirect("/login?error=Please+sign+in+to+continue.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    !allowedAdminRoles.includes(profile.role)
  ) {
    redirect(
      "/dashboard?error=You+are+not+authorized+to+manage+tasks.",
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id,title,description,instructions,platform,type,task_url,reward_amount,total_slots,proof_instructions,status",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const task = data as TaskRecord;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Edit Task
            </h1>

            <p className="mt-2 text-slate-400">
              Update the task information below.
            </p>
          </div>

          <Link
            href="/admin/tasks"
            className="w-fit rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium hover:bg-white/10"
          >
            Back to tasks
          </Link>
        </header>

        {query.error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error}
          </div>
        ) : null}

        <form
          action={updateTask}
          className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8"
        >
          <input
            type="hidden"
            name="task_id"
            value={task.id}
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Task title
            </span>

            <input
              name="title"
              required
              defaultValue={task.title ?? ""}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Short description
            </span>

            <textarea
              name="description"
              required
              rows={3}
              defaultValue={task.description ?? ""}
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Full instructions
            </span>

            <textarea
              name="instructions"
              required
              rows={6}
              defaultValue={task.instructions ?? ""}
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Platform
              </span>

              <select
                name="platform"
                defaultValue={task.platform ?? "general"}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="x">X</option>
                <option value="website">Website</option>
                <option value="google">Google</option>
                <option value="general">General</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Task type
              </span>

              <select
                name="taskType"
                defaultValue={task.type ?? "general"}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
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

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Task URL
            </span>

            <input
              name="taskUrl"
              type="url"
              defaultValue={task.task_url ?? ""}
              placeholder="https://example.com/task"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Reward amount
              </span>

              <input
                name="rewardAmount"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={Number(
                  task.reward_amount ?? 0,
                )}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Number of worker slots
              </span>

              <input
                name="totalSlots"
                type="number"
                min="1"
                step="1"
                required
                defaultValue={task.total_slots ?? 1}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Required proof
            </span>

            <textarea
              name="proofInstructions"
              rows={3}
              defaultValue={
                task.proof_instructions ?? ""
              }
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Status
            </span>

            <select
              name="status"
              defaultValue={task.status ?? "draft"}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-5 py-4 font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Save Changes
          </button>
        </form>
      </div>
    </main>
  );
}
