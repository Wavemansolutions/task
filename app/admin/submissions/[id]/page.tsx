import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  approveSubmission,
  rejectSubmission,
} from "@/app/admin/submissions/actions";

type ReviewSubmissionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ReviewSubmissionPage({
  params,
  searchParams,
}: ReviewSubmissionPageProps) {
  const { id } = await params;
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

  const { data: submission } = await supabase
    .from("task_submissions")
    .select(
      "id,status,proof_text,proof_url,proof_image_path,review_notes,submitted_at,worker_id,tasks(title,description,reward_amount,proof_instructions),profiles!task_submissions_worker_id_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!submission) {
    notFound();
  }

  const task = Array.isArray(submission.tasks)
    ? submission.tasks[0]
    : submission.tasks;

  const worker = Array.isArray(submission.profiles)
    ? submission.profiles[0]
    : submission.profiles;

  let signedImageUrl: string | null = null;

  if (submission.proof_image_path) {
    const { data } = await supabase.storage
      .from("task-proofs")
      .createSignedUrl(
        submission.proof_image_path,
        60 * 30,
      );

    signedImageUrl = data?.signedUrl ?? null;
  }

  const canReview =
    submission.status === "pending" &&
    profile?.role !== "auditor";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Review Proof
            </h1>
          </div>

          <Link
            href="/admin/submissions"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10"
          >
            Back to submissions
          </Link>
        </header>

        {query.error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error}
          </div>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Task
              </p>
              <p className="mt-1 font-semibold">
                {task?.title ?? "Task"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Worker
              </p>
              <p className="mt-1 font-semibold">
                {worker?.full_name ??
                  submission.worker_id}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Status
              </p>
              <p className="mt-1 font-semibold capitalize">
                {submission.status}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <h2 className="font-bold">
                Proof description
              </h2>
              <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-900 p-5 text-slate-300">
                {submission.proof_text ||
                  "No proof description supplied."}
              </div>
            </div>

            {submission.proof_url ? (
              <div>
                <h2 className="font-bold">
                  Proof link
                </h2>
                <a
                  href={submission.proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex rounded-xl border border-blue-400/30 bg-blue-500/10 px-5 py-3 font-semibold text-blue-200"
                >
                  Open Proof Link
                </a>
              </div>
            ) : null}

            {signedImageUrl ? (
              <div>
                <h2 className="font-bold">
                  Screenshot
                </h2>
                <a
                  href={signedImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block overflow-hidden rounded-2xl border border-white/10"
                >
                  <img
                    src={signedImageUrl}
                    alt="Worker proof screenshot"
                    className="max-h-[600px] w-full object-contain"
                  />
                </a>
              </div>
            ) : null}
          </div>

          {canReview ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <form
                action={approveSubmission}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"
              >
                <input
                  type="hidden"
                  name="submission_id"
                  value={submission.id}
                />
                <label className="block text-sm font-semibold">
                  Approval note
                </label>
                <textarea
                  name="review_notes"
                  rows={4}
                  placeholder="Optional approval note"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                />
                <button className="mt-4 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400">
                  Approve Proof
                </button>
              </form>

              <form
                action={rejectSubmission}
                className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5"
              >
                <input
                  type="hidden"
                  name="submission_id"
                  value={submission.id}
                />
                <label className="block text-sm font-semibold">
                  Rejection reason
                </label>
                <textarea
                  name="review_notes"
                  rows={4}
                  required
                  placeholder="Explain what the worker must correct"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                />
                <button className="mt-4 w-full rounded-xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-400">
                  Reject Proof
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-white/10 bg-slate-900 p-4 text-slate-300">
              This submission has already been reviewed or
              your role is read-only.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
