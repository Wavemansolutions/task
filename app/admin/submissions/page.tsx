import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AdminSubmissionsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AdminSubmissionsPage({
  searchParams,
}: AdminSubmissionsPageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    ![
      "super_admin",
      "task_manager",
      "proof_reviewer",
      "auditor",
    ].includes(profile?.role ?? "")
  ) {
    redirect("/dashboard");
  }

  const { data: submissions, error } =
    await supabase
      .from("task_submissions")
      .select(
        "id,status,submitted_at,worker_id,tasks(title,reward_amount),profiles!task_submissions_worker_id_fkey(full_name)",
      )
      .order("submitted_at", {
        ascending: false,
      });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Proof Submissions
            </h1>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10"
          >
            Admin Dashboard
          </Link>
        </header>

        {query.message ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            {query.message}
          </div>
        ) : null}

        {query.error || error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error ?? error?.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-white/10 bg-white/5 text-sm text-slate-400">
                <tr>
                  <th className="px-5 py-4">Task</th>
                  <th className="px-5 py-4">Worker</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Submitted</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {(submissions ?? []).map(
                  (submission: any) => {
                    const task = Array.isArray(
                      submission.tasks,
                    )
                      ? submission.tasks[0]
                      : submission.tasks;

                    const worker = Array.isArray(
                      submission.profiles,
                    )
                      ? submission.profiles[0]
                      : submission.profiles;

                    return (
                      <tr
                        key={submission.id}
                        className="border-b border-white/10 last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">
                            {task?.title ?? "Task"}
                          </p>
                          <p className="mt-1 text-sm text-emerald-400">
                            ₦
                            {Number(
                              task?.reward_amount ?? 0,
                            ).toLocaleString("en-NG")}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {worker?.full_name ??
                            submission.worker_id}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize">
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-400">
                          {new Date(
                            submission.submitted_at,
                          ).toLocaleString("en-NG")}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={
                              "/admin/submissions/" +
                              submission.id
                            }
                            className="font-semibold text-emerald-400 hover:text-emerald-300"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          {(submissions ?? []).length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-400">
              No proof submissions found.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
