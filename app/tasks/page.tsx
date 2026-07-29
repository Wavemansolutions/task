import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type TasksPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

type TaskRecord = {
  id: string;
  title: string | null;
  description: string | null;
  platform: string | null;
  type: string | null;
  reward_amount: number | string | null;
  total_slots: number | null;
  slots_available: number | null;
  status: string | null;
};

type WorkerTaskRecord = {
  task_id: string;
  status: string;
};

export default async function TasksPage({
  searchParams,
}: TasksPageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Please sign in to view available tasks.",
        ),
    );
  }

  const [
    { data: tasksData, error: tasksError },
    { data: workerTasksData },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "id,title,description,platform,type,reward_amount,total_slots,slots_available,status",
      )
      .eq("status", "active")
      .gt("slots_available", 0)
      .order("created_at", { ascending: false }),
    supabase
      .from("worker_tasks")
      .select("task_id,status")
      .eq("worker_id", user.id),
  ]);

  const tasks = (tasksData ?? []) as TaskRecord[];
  const workerTasks =
    (workerTasksData ?? []) as WorkerTaskRecord[];

  const startedTaskIds = new Set(
    workerTasks.map((item) => item.task_id),
  );

  const availableTasks = tasks.filter(
    (task) => !startedTaskIds.has(task.id),
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Available Tasks
            </h1>

            <p className="mt-2 text-slate-400">
              Choose a task, follow its instructions,
              and submit valid proof.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium hover:bg-white/10"
          >
            Worker Dashboard
          </Link>
        </header>

        {query.message ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            {query.message}
          </div>
        ) : null}

        {query.error || tasksError ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error ?? tasksError?.message}
          </div>
        ) : null}

        {availableTasks.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
            <h2 className="text-xl font-bold">
              No new tasks available
            </h2>

            <p className="mt-2 text-slate-400">
              Check again when administrators publish more
              worker tasks.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {availableTasks.map((task) => (
              <article
                key={task.id}
                className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-slate-300">
                    {task.platform ?? "general"}
                  </span>

                  <span className="text-lg font-bold text-emerald-400">
                    ₦
                    {Number(
                      task.reward_amount ?? 0,
                    ).toLocaleString("en-NG")}
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  {task.title ?? "Untitled task"}
                </h2>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                  {task.description ??
                    "Open this task to view its instructions."}
                </p>

                <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
                  <span className="capitalize">
                    {task.type ?? "general"} task
                  </span>

                  <span>
                    {task.slots_available ?? 0} slots left
                  </span>
                </div>

                <Link
                  href={"/tasks/" + task.id}
                  className="mt-6 block rounded-xl bg-emerald-500 px-5 py-3 text-center font-bold text-slate-950 hover:bg-emerald-400"
                >
                  View Task
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
