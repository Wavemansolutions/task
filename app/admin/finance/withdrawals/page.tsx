import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { claimWithdrawal } from './actions';

export default async function WithdrawalQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; rejected?: string; paid?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from('admin_withdrawal_queue')
    .select('*')
    .in('status', ['pending','under_review','approved','processing'])
    .order('requested_at', { ascending: true });

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">Finance operations</p>
        <h1 className="text-3xl font-bold">Withdrawal queue</h1>
      </div>

      {query.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {query.error}
        </div>
      )}
      {query.rejected && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
          Withdrawal rejected and wallet refunded.
        </div>
      )}
      {query.paid && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
          Withdrawal marked as paid.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Worker</th>
              <th className="p-4">Bank</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Requested</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests?.map((item: any) => (
              <tr key={item.id} className="border-t">
                <td className="p-4">
                  <div className="font-medium">{item.worker_name || 'Worker'}</div>
                  <div className="text-xs text-gray-500">{item.phone}</div>
                </td>
                <td className="p-4">
                  <div>{item.bank_name}</div>
                  <div className="text-xs text-gray-500">{item.account_number}</div>
                </td>
                <td className="p-4">
                  ₦{Number(item.amount).toLocaleString()}
                </td>
                <td className="p-4 capitalize">{item.status.replaceAll('_', ' ')}</td>
                <td className="p-4">
                  {new Date(item.requested_at).toLocaleString()}
                </td>
                <td className="p-4">
                  {item.status === 'pending' ? (
                    <form action={claimWithdrawal}>
                      <input type="hidden" name="withdrawal_id" value={item.id} />
                      <button className="rounded-lg bg-black px-3 py-2 text-white">
                        Claim
                      </button>
                    </form>
                  ) : (
                    <Link
                      href={`/admin/finance/withdrawals/${item.id}`}
                      className="font-medium underline"
                    >
                      Open
                    </Link>
                  )}
                </td>
              </tr>
            ))}

            {!requests?.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No active withdrawal requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
