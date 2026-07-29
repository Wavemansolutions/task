import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type WorkerTaskSummary = {
  status: string;
  task_id: string;
  tasks:
    | {
        title: string | null;
        reward_amount: number | string | null;
      }
    | {
        title: string | null;
        reward_amount: number | string | null;
      }[]
    | null;
};

function getRelatedTask(
  relation: WorkerTaskSummary["tasks"],
) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: profile },
    { count: availableTaskCount },
    { data: workerTasksData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active")
      .gt("slots_available", 0),
    supabase
      .from("worker_tasks")
      .select(
        "status,task_id,tasks(title,reward_amount)",
      )
      .eq("worker_id", user.id)
      .order("started_at", { ascending: false })
      .limit(8),
  ]);

  const workerTasks =
    (workerTasksData ?? []) as WorkerTaskSummary[];

  const startedCount = workerTasks.filter(
    (item) => item.status === "started",
  ).length;

  const submittedCount = workerTasks.filter(
    (item) => item.status === "submitted",
  ).length;

  const approvedTasks = workerTasks.filter(
    (item) => item.status === "approved",
  );

  const approvedEarnings = approvedTasks.reduce(
    (total, item) => {
      const task = getRelatedTask(item.tasks);

      return (
        total +
        Number(task?.reward_amount ?? 0)
      );
    },
    0,
  );

  const displayName =
    profile?.full_name ||
    user.email?.split("@")[0] ||
    "Worker";

  const isAdmin = [
    "super_admin",
    "task_manager",
    "proof_reviewer",
    "finance_admin",
    "support_admin",
    "auditor",
  ].includes(profile?.role ?? "");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Welcome, {displayName}
            </h1>

            <p className="mt-2 text-slate-400">
              Track your tasks and earnings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/tasks"
              className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400"
            >
              Browse Tasks
            </Link>

            {isAdmin ? (
              <Link
                href="/admin"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium hover:bg-white/10"
              >
                Admin Dashboard
              </Link>
            ) : null}
          </div>
        </header>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">
              Approved Earnings
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              ₦{approvedEarnings.toLocaleString("en-NG")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">
              Available Tasks
            </p>
            <p className="mt-2 text-3xl font-bold">
              {availableTaskCount ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">
              Tasks In Progress
            </p>
            <p className="mt-2 text-3xl font-bold">
              {startedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">
              Pending Review
            </p>
            <p className="mt-2 text-3xl font-bold">
              {submittedCount}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Recent Tasks
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Your latest reserved and completed work.
              </p>
            </div>

            <Link
              href="/tasks"
              className="text-sm font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Find more tasks
            </Link>
          </div>

          {workerTasks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400">
                You have not started any task yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {workerTasks.map((item) => {
                const task = getRelatedTask(item.tasks);

                return (
                  <Link
                    key={item.task_id}
                    href={"/tasks/" + item.task_id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition hover:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">
                        {task?.title ?? "Task"}
                      </p>
                      <p className="mt-1 text-sm capitalize text-slate-400">
                        {item.status}
                      </p>
                    </div>

                    <p className="font-bold text-emerald-400">
                      ₦
                      {Number(
                        task?.reward_amount ?? 0,
                      ).toLocaleString("en-NG")}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
