import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type TaskRecord = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  instructions?: string | null;
  task_type?: string | null;
  type?: string | null;
  platform?: string | null;
  reward_amount?: number | string | null;
  reward?: number | string | null;
  amount?: number | string | null;
  status?: string | null;
  total_slots?: number | null;
  slots_available?: number | null;
  remaining_slots?: number | null;
  created_at?: string | null;
};

function formatTaskType(value?: string | null) {
  if (!value) return "General task";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTaskReward(task: TaskRecord) {
  return Number(
    task.reward_amount ??
      task.reward ??
      task.amount ??
      0,
  );
}

function getRemainingSlots(task: TaskRecord) {
  return (
    task.slots_available ??
    task.remaining_slots ??
    task.total_slots ??
    null
  );
}

export default async function TasksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please+sign+in+to+browse+tasks.");
  }

const { data, error } = await supabase
  .from("tasks")
  .select("*")
  .eq("status", "active")
  .order("created_at", { ascending: false });

  const tasks = (data ?? []) as TaskRecord[];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Browse Tasks
            </h1>

            <p className="mt-2 text-slate-400">
              Choose an available task, follow its instructions,
              and submit valid proof.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex w-fit rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium transition hover:bg-white/10"
          >
            Back to dashboard
          </Link>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">
              Available tasks
            </p>

            <p className="mt-2 text-3xl font-bold">
              {tasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">
              Daily task limit
            </p>

            <p className="mt-2 text-3xl font-bold">
              20
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">
              Account
            </p>

            <p className="mt-2 truncate text-lg font-semibold">
              {user.email}
            </p>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            <p className="font-semibold">
              Tasks could not be loaded
            </p>

            <p className="mt-2 text-sm">
              {error.message}
            </p>
          </div>
        ) : null}

        {!error && tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-3xl">
              📋
            </div>

            <h2 className="mt-5 text-xl font-bold">
              No active tasks yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-slate-400">
              The page is working correctly. Active tasks created
              by an administrator will appear here.
            </p>
          </div>
        ) : null}

        {!error && tasks.length > 0 ? (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => {
              const reward = getTaskReward(task);
              const slots = getRemainingSlots(task);

              return (
                <article
                  key={task.id}
                  className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-emerald-500/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {formatTaskType(
                        task.task_type ??
                          task.type ??
                          task.platform,
                      )}
                    </span>

                    <span className="text-lg font-bold text-emerald-400">
                      ₦{reward.toLocaleString("en-NG")}
                    </span>
                  </div>

                  <h2 className="mt-5 text-xl font-bold">
                    {task.title ??
                      task.name ??
                      "Untitled task"}
                  </h2>

                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-400">
                    {task.description ??
                      task.instructions ??
                      "Open this task to see its full instructions."}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                    <p className="text-sm text-slate-400">
                      {slots === null
                        ? "Available"
                        : `${slots} slot${
                            slots === 1 ? "" : "s"
                          } left`}
                    </p>

                    <Link
                      href={`/tasks/${task.id}`}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                    >
                      View task
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}
      </div>
    </main>
  );
}
