import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StartTaskButton from "@/app/tasks/components/StartTaskButton";

type TaskDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function TaskDetailsPage({
  params,
  searchParams,
}: TaskDetailsPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: task },
    { data: workerTask },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "id,title,description,instructions,platform,type,task_url,reward_amount,total_slots,slots_available,proof_instructions,status",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("worker_tasks")
      .select("id,status,started_at")
      .eq("task_id", id)
      .eq("worker_id", user.id)
      .maybeSingle(),
  ]);

  if (!task) {
    notFound();
  }

  const alreadyStarted = Boolean(workerTask);
  const canSubmit =
    workerTask &&
    ["started", "rejected"].includes(
      workerTask.status,
    );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Task Details
            </h1>
          </div>

          <Link
            href="/tasks"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10"
          >
            Back to tasks
          </Link>
        </header>

        {query.message ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            {query.message}
          </div>
        ) : null}

        {query.error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error}
          </div>
        ) : null}

        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold capitalize text-slate-300">
              {task.platform ?? "general"}
            </span>
            <span className="text-2xl font-bold text-emerald-400">
              ₦{Number(task.reward_amount ?? 0).toLocaleString("en-NG")}
            </span>
          </div>

          <h2 className="mt-6 text-3xl font-bold">
            {task.title ?? "Untitled task"}
          </h2>

          <p className="mt-4 leading-7 text-slate-300">
            {task.description ?? "No description supplied."}
          </p>

          <section className="mt-8">
            <h3 className="text-lg font-bold">
              Instructions
            </h3>
            <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-900/70 p-5 leading-7 text-slate-300">
              {task.instructions ?? "No instructions supplied."}
            </div>
          </section>

          {task.task_url ? (
            <a
              href={task.task_url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-xl border border-blue-400/30 bg-blue-500/10 px-5 py-3 font-semibold text-blue-200 hover:bg-blue-500/20"
            >
              Open Task Website
            </a>
          ) : null}

          <section className="mt-8">
            <h3 className="text-lg font-bold">
              Required Proof
            </h3>
            <p className="mt-3 rounded-2xl border border-white/10 bg-slate-900/70 p-5 leading-7 text-slate-300">
              {task.proof_instructions ??
                "Submit clear proof that you completed the task."}
            </p>
          </section>

          <div className="mt-8">
            {!alreadyStarted ? (
              <StartTaskButton
                taskId={task.id}
                disabled={
                  Number(task.slots_available ?? 0) <= 0 ||
                  task.status !== "active"
                }
              />
            ) : canSubmit ? (
              <Link
                href={"/tasks/" + id + "/submit"}
                className="block w-full rounded-xl bg-emerald-500 px-5 py-3 text-center font-bold text-slate-950 hover:bg-emerald-400"
              >
                {workerTask.status === "rejected"
                  ? "Resubmit Proof"
                  : "Submit Proof"}
              </Link>
            ) : (
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-center font-semibold capitalize text-slate-300">
                Task status: {workerTask?.status}
              </div>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
