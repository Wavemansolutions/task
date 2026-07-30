import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { claimReview } from './actions';

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    approved?: string;
    rejected?: string;
  }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();

  const { data: queue } = await supabase
    .from('admin_review_queue')
    .select('*')
    .in('status', ['pending', 'in_review'])
    .order('submitted_at', { ascending: true });

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">Proof operations</p>
        <h1 className="text-3xl font-bold">Review queue</h1>
      </div>

      {query.error && (
        <Notice kind="error">{query.error}</Notice>
      )}
      {query.approved && (
        <Notice kind="success">Submission approved and wallet credited.</Notice>
      )}
      {query.rejected && (
        <Notice kind="success">Submission rejected.</Notice>
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Worker</th>
              <th className="p-4">Task</th>
              <th className="p-4">Reward</th>
              <th className="p-4">Status</th>
              <th className="p-4">Submitted</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {queue?.map((item: any) => (
              <tr key={item.id} className="border-t">
                <td className="p-4">
                  <div className="font-medium">
                    {item.worker_name || 'Worker'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Trust: {item.trust_score ?? 0}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-medium">{item.task_title}</div>
                  <div className="text-xs text-gray-500">
                    {item.campaign_title}
                  </div>
                </td>
                <td className="p-4">
                  ₦{Number(item.reward_amount || 0).toLocaleString()}
                </td>
                <td className="p-4 capitalize">{item.status}</td>
                <td className="p-4">
                  {new Date(item.submitted_at).toLocaleString()}
                </td>
                <td className="p-4">
                  {item.status === 'pending' ? (
                    <form action={claimReview}>
                      <input
                        type="hidden"
                        name="submission_id"
                        value={item.id}
                      />
                      <button className="rounded-lg bg-black px-3 py-2 text-white">
                        Claim
                      </button>
                    </form>
                  ) : (
                    <Link
                      href={`/admin/reviews/${item.id}`}
                      className="font-medium underline"
                    >
                      Open
                    </Link>
                  )}
                </td>
              </tr>
            ))}

            {!queue?.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  The review queue is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Notice({
  children,
  kind,
}: {
  children: React.ReactNode;
  kind: 'error' | 'success';
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        kind === 'error'
          ? 'border-red-300 bg-red-50 text-red-700'
          : 'border-green-300 bg-green-50 text-green-700'
      }`}
    >
      {children}
    </div>
  );
}
