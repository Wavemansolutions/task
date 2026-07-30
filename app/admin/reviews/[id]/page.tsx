import { createClient } from '@/utils/supabase/server';
import { approveReview, rejectReview } from '../actions';

export default async function ReviewDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: submission } = await supabase
    .from('admin_review_queue')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!submission) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border bg-white p-6">
          Submission not found.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">{submission.campaign_title}</p>
        <h1 className="text-3xl font-bold">{submission.task_title}</h1>
      </div>

      {query.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {query.error}
        </div>
      )}

      <section className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-2">
        <Info label="Worker" value={submission.worker_name || 'Worker'} />
        <Info label="Trust score" value={String(submission.trust_score ?? 0)} />
        <Info label="Reward" value={`₦${Number(submission.reward_amount || 0).toLocaleString()}`} />
        <Info label="Status" value={submission.status} />
        <Info label="Proof type" value={submission.proof_type} />
        <Info label="View count" value={String(submission.view_count ?? 'Not supplied')} />
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Submitted proof</h2>

        {submission.proof_url && (
          <a
            href={submission.proof_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block break-all text-blue-700 underline"
          >
            {submission.proof_url}
          </a>
        )}

        {submission.proof_text && (
          <p className="mt-4 whitespace-pre-wrap text-gray-700">
            {submission.proof_text}
          </p>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <form action={approveReview} className="space-y-4 rounded-xl border bg-white p-6">
          <input type="hidden" name="submission_id" value={id} />
          <h2 className="text-xl font-semibold">Approve proof</h2>

          <textarea
            name="review_note"
            rows={4}
            placeholder="Optional approval note"
            className="w-full rounded-lg border px-3 py-2"
          />

          <button className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white">
            Approve and credit wallet
          </button>
        </form>

        <form action={rejectReview} className="space-y-4 rounded-xl border bg-white p-6">
          <input type="hidden" name="submission_id" value={id} />
          <h2 className="text-xl font-semibold">Reject proof</h2>

          <textarea
            name="rejection_reason"
            rows={4}
            required
            placeholder="Reason for rejection"
            className="w-full rounded-lg border px-3 py-2"
          />

          <label className="flex items-center gap-3">
            <input type="checkbox" name="restore_slot" />
            <span className="text-sm">Restore the task slot</span>
          </label>

          <button className="w-full rounded-lg border border-red-400 px-4 py-3 font-semibold text-red-700">
            Reject submission
          </button>
        </form>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-semibold capitalize">{value}</p>
    </div>
  );
}
