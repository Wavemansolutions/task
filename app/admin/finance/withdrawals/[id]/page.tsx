import { createClient } from '@/utils/supabase/server';
import {
  approveWithdrawal,
  markWithdrawalPaid,
  rejectWithdrawal,
} from '../actions';

export default async function WithdrawalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; approved?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from('admin_withdrawal_queue')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!request) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border bg-white p-6">
          Withdrawal not found.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">Withdrawal review</p>
        <h1 className="text-3xl font-bold">
          ₦{Number(request.amount).toLocaleString()}
        </h1>
      </div>

      {query.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {query.error}
        </div>
      )}
      {query.approved && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
          Withdrawal approved.
        </div>
      )}

      <section className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-2">
        <Info label="Worker" value={request.worker_name || 'Worker'} />
        <Info label="Phone" value={request.phone || 'Not supplied'} />
        <Info label="Bank" value={request.bank_name} />
        <Info label="Account name" value={request.account_name} />
        <Info label="Account number" value={request.account_number} />
        <Info label="Status" value={request.status.replaceAll('_', ' ')} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <form action={approveWithdrawal} className="space-y-4 rounded-xl border bg-white p-6">
          <input type="hidden" name="withdrawal_id" value={id} />
          <h2 className="text-xl font-semibold">Approve</h2>
          <textarea
            name="review_note"
            rows={4}
            placeholder="Optional note"
            className="w-full rounded-lg border px-3 py-2"
          />
          <button className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white">
            Approve withdrawal
          </button>
        </form>

        <form action={markWithdrawalPaid} className="space-y-4 rounded-xl border bg-white p-6">
          <input type="hidden" name="withdrawal_id" value={id} />
          <h2 className="text-xl font-semibold">Mark paid</h2>
          <input
            name="payment_reference"
            required
            placeholder="Bank or Paystack reference"
            className="w-full rounded-lg border px-3 py-2"
          />
          <button className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white">
            Confirm payment
          </button>
        </form>

        <form action={rejectWithdrawal} className="space-y-4 rounded-xl border bg-white p-6">
          <input type="hidden" name="withdrawal_id" value={id} />
          <h2 className="text-xl font-semibold">Reject</h2>
          <textarea
            name="reason"
            rows={4}
            required
            placeholder="Reason for rejection"
            className="w-full rounded-lg border px-3 py-2"
          />
          <button className="w-full rounded-lg border border-red-400 px-4 py-3 font-semibold text-red-700">
            Reject and refund
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
