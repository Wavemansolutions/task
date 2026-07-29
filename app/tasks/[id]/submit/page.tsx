import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { submitTaskProof } from "@/app/tasks/actions";

type SubmitProofPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SubmitProofPage({
  params,
  searchParams,
}: SubmitProofPageProps) {
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
        "id,title,proof_instructions,reward_amount",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("worker_tasks")
      .select("id,status")
      .eq("task_id", id)
      .eq("worker_id", user.id)
      .maybeSingle(),
  ]);

  if (!task || !workerTask) {
    notFound();
  }

  if (
    !["started", "rejected"].includes(
      workerTask.status,
    )
  ) {
    redirect(
      "/tasks/" +
        id +
        "?error=" +
        encodeURIComponent(
          "This task is not currently accepting proof.",
        ),
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Submit Proof
            </h1>
          </div>

          <Link
            href={"/tasks/" + id}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10"
          >
            Back to task
          </Link>
        </header>

        {query.error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error}
          </div>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">
              Task
            </p>
            <h2 className="mt-1 text-xl font-bold">
              {task.title}
            </h2>

            <p className="mt-4 text-sm text-slate-400">
              Required proof
            </p>
            <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-300">
              {task.proof_instructions ||
                "Provide clear proof that you completed the task."}
            </p>
          </div>

          <form
            action={submitTaskProof}
            className="mt-6 space-y-6"
          >
            <input
              type="hidden"
              name="task_id"
              value={id}
            />
            <input
              type="hidden"
              name="worker_task_id"
              value={workerTask.id}
            />

            <div>
              <label
                htmlFor="proof_text"
                className="mb-2 block text-sm font-semibold"
              >
                Proof description
              </label>
              <textarea
                id="proof_text"
                name="proof_text"
                rows={5}
                placeholder="Explain what you completed and include any useful details."
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="proof_url"
                className="mb-2 block text-sm font-semibold"
              >
                Proof link
              </label>
              <input
                id="proof_url"
                name="proof_url"
                type="url"
                placeholder="https://example.com/your-proof"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="proof_image"
                className="mb-2 block text-sm font-semibold"
              >
                Screenshot
              </label>
              <input
                id="proof_image"
                name="proof_image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
              />
              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG, or WebP. Maximum 5 MB.
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400"
            >
              Submit Proof
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
