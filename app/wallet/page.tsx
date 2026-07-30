import { createClient } from '@/utils/supabase/server';
import { requestWithdrawal, savePayoutAccount } from './actions';

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    account?: string;
    withdrawal?: string;
  }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: wallet }, { data: accounts }, { data: withdrawals }, { data: ledger }] =
    await Promise.all([
      supabase
        .from('worker_wallet_summary')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('payout_accounts')
        .select('*')
        .eq('worker_id', user.id)
        .order('is_default', { ascending: false }),
      supabase
        .from('withdrawal_requests')
        .select('id, amount, fee_amount, net_amount, status, requested_at, paid_at')
        .eq('worker_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(20),
      supabase
        .from('wallet_ledger')
        .select('id, entry_type, amount, balance_after, description, created_at')
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <p className="text-sm text-gray-500">Earnings and payouts</p>
        <h1 className="text-3xl font-bold">My wallet</h1>
      </div>

      {query.error && <Notice kind="error">{query.error}</Notice>}
      {query.account && <Notice kind="success">Payout account saved.</Notice>}
      {query.withdrawal && (
        <Notice kind="success">Withdrawal request submitted.</Notice>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <Stat
          label="Available"
          value={`₦${Number(wallet?.available_balance || 0).toLocaleString()}`}
        />
        <Stat
          label="Pending"
          value={`₦${Number(wallet?.pending_balance || 0).toLocaleString()}`}
        />
        <Stat
          label="Lifetime earned"
          value={`₦${Number(wallet?.lifetime_earned || 0).toLocaleString()}`}
        />
        <Stat
          label="Withdrawn"
          value={`₦${Number(wallet?.lifetime_withdrawn || 0).toLocaleString()}`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form action={savePayoutAccount} className="space-y-4 rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Payout account</h2>

          <input
            name="account_name"
            placeholder="Account name"
            required
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            name="account_number"
            placeholder="Account number"
            required
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            name="bank_name"
            placeholder="Bank name"
            required
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            name="bank_code"
            placeholder="Bank code, optional"
            className="w-full rounded-lg border px-3 py-2"
          />

          <button className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white">
            Save payout account
          </button>
        </form>

        <form action={requestWithdrawal} className="space-y-4 rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Request withdrawal</h2>

          <select
            name="payout_account_id"
            required
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Select payout account</option>
            {accounts?.map((account: any) => (
              <option key={account.id} value={account.id}>
                {account.bank_name} — {account.account_number}
              </option>
            ))}
          </select>

          <input
            name="amount"
            type="number"
            min="1000"
            step="0.01"
            placeholder="Minimum ₦1,000"
            required
            className="w-full rounded-lg border px-3 py-2"
          />

          <button className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white">
            Request withdrawal
          </button>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Withdrawal history</h2>
        <div className="mt-4 space-y-3">
          {withdrawals?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div>
                <p className="font-medium">
                  ₦{Number(item.amount).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(item.requested_at).toLocaleString()}
                </p>
              </div>
              <span className="capitalize">{item.status.replaceAll('_', ' ')}</span>
            </div>
          ))}

          {!withdrawals?.length && (
            <p className="text-sm text-gray-500">No withdrawals yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Wallet transactions</h2>
        <div className="mt-4 space-y-3">
          {ledger?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {Number(item.amount) >= 0 ? '+' : ''}
                  ₦{Number(item.amount).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Balance: ₦{Number(item.balance_after || 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}

          {!ledger?.length && (
            <p className="text-sm text-gray-500">No wallet transactions yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
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
