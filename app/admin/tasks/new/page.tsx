import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTask } from "@/app/admin/tasks/actions";

type NewTaskPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const allowedAdminRoles = [
  "super_admin",
  "task_manager",
];

export default async function NewTaskPage({
  searchParams,
}: NewTaskPageProps) {
  const params = await searchParams;
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
      "/dashboard?error=You+are+not+authorized+to+create+tasks.",
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Create New Task
            </h1>

            <p className="mt-2 text-slate-400">
              Add a task for workers to complete.
            </p>
          </div>

          <Link
            href="/admin/tasks"
            className="w-fit rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium hover:bg-white/10"
          >
            View all tasks
          </Link>
        </header>

        {params.error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {params.error}
          </div>
        ) : null}

        <form
          action={createTask}
          className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Task title
            </span>

            <input
              name="title"
              required
              placeholder="Follow our Facebook page"
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
              placeholder="Briefly explain what the worker will do."
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
              placeholder="Write each step the worker must follow."
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
                min="1"
                step="0.01"
                required
                placeholder="150"
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
                defaultValue="1"
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
              placeholder="Example: Upload a screenshot showing that you followed the page."
              className="w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Publishing status
            </span>

            <select
              name="status"
              defaultValue="draft"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            >
              <option value="draft">
                Draft — hidden from workers
              </option>

              <option value="active">
                Active — visible immediately
              </option>

              <option value="paused">
                Paused — temporarily hidden
              </option>
            </select>
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-5 py-4 font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Create Task
          </button>
        </form>
      </div>
    </main>
  );
}
