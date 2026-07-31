import { redirect } from 'next/navigation';
import { FiArrowDownLeft, FiArrowUpRight, FiCreditCard, FiDollarSign, FiPlusCircle } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { requestWithdrawal, savePayoutAccount } from './actions';

type WalletSummary = {
  available_balance?: number | string | null;
  pending_balance?: number | string | null;
  lifetime_earned?: number | string | null;
  lifetime_withdrawn?: number | string | null;
};

type PayoutAccount = {
  id: string;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  is_default: boolean | null;
};

type Withdrawal = {
  id: string;
  amount: number | string;
  fee_amount: number | string | null;
  net_amount: number | string | null;
  status: string;
  requested_at: string;
  paid_at: string | null;
};

type LedgerEntry = {
  id: string;
  entry_type: string;
  amount: number | string;
  balance_after: number | string | null;
  description: string | null;
  created_at: string;
};

function money(value: unknown) {
  return `₦${Number(value ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (['paid', 'approved', 'completed'].includes(normalized)) return 'bg-green-50 text-green-700 ring-green-600/20';
  if (['rejected', 'failed', 'cancelled'].includes(normalized)) return 'bg-red-50 text-red-700 ring-red-600/20';
  return 'bg-amber-50 text-amber-700 ring-amber-600/20';
}

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; account?: string; withdrawal?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: wallet },
    { data: accounts },
    { data: withdrawals },
    { data: ledger },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name,role').eq('id', user.id).maybeSingle(),
    supabase.from('worker_wallet_summary').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('payout_accounts').select('*').eq('worker_id', user.id).order('is_default', { ascending: false }),
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

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Worker';
  const role = profile?.role ?? 'worker';
  const isAdmin = ['super_admin', 'task_manager', 'proof_reviewer', 'finance_admin', 'support_admin', 'auditor'].includes(role);
  const walletData = (wallet ?? {}) as WalletSummary;
  const payoutAccounts = (accounts ?? []) as PayoutAccount[];
  const withdrawalRows = (withdrawals ?? []) as Withdrawal[];
  const ledgerRows = (ledger ?? []) as LedgerEntry[];

  return (
    <AppShell userName={displayName} userRole={role} isAdmin={isAdmin}>
      <div className="mx-auto max-w-7xl space-y-7">
        <header>
          <p className="text-sm font-bold text-green-600">Earnings and payouts</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">My wallet</h1>
          <p className="mt-2 text-sm text-slate-500">Your balances, payout accounts, withdrawals and ledger entries are loaded from Supabase.</p>
        </header>

        {query.error ? <Notice kind="error">{query.error}</Notice> : null}
        {query.account ? <Notice kind="success">Payout account saved.</Notice> : null}
        {query.withdrawal ? <Notice kind="success">Withdrawal request submitted.</Notice> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Available balance" value={money(walletData.available_balance)} icon={<FiCreditCard />} />
          <Stat label="Pending balance" value={money(walletData.pending_balance)} icon={<FiArrowDownLeft />} />
          <Stat label="Lifetime earned" value={money(walletData.lifetime_earned)} icon={<FiDollarSign />} />
          <Stat label="Lifetime withdrawn" value={money(walletData.lifetime_withdrawn)} icon={<FiArrowUpRight />} />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <form action={savePayoutAccount} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-xl text-green-700"><FiPlusCircle /></span>
              <div>
                <h2 className="text-xl font-black text-slate-950">Add payout account</h2>
                <p className="mt-1 text-sm text-slate-500">The saved account will be available for withdrawal requests.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field name="account_name" label="Account name" placeholder="Name on the account" required />
              <Field name="account_number" label="Account number" placeholder="10-digit account number" required inputMode="numeric" />
              <Field name="bank_name" label="Bank name" placeholder="Bank name" required />
              <Field name="bank_code" label="Bank code" placeholder="Optional bank code" />
            </div>

            <button className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
              Save payout account
            </button>
          </form>

          <form action={requestWithdrawal} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-xl text-green-700"><FiArrowUpRight /></span>
              <div>
                <h2 className="text-xl font-black text-slate-950">Request withdrawal</h2>
                <p className="mt-1 text-sm text-slate-500">Minimum withdrawal is ₦1,000. Validation remains handled by your database function.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Payout account</span>
                <select name="payout_account_id" required className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100">
                  <option value="">Select payout account</option>
                  {payoutAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} — {account.account_number}
                    </option>
                  ))}
                </select>
              </label>

              <Field name="amount" label="Amount" placeholder="Minimum ₦1,000" required type="number" min="1000" step="0.01" />
            </div>

            <button disabled={payoutAccounts.length === 0} className="mt-5 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              Request withdrawal
            </button>
            {payoutAccounts.length === 0 ? <p className="mt-3 text-center text-xs text-slate-500">Save a payout account before requesting a withdrawal.</p> : null}
          </form>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-black text-slate-950">Payout accounts</h2>
              <p className="mt-1 text-sm text-slate-500">Accounts currently saved to your profile.</p>
            </div>
            {payoutAccounts.length === 0 ? (
              <EmptyState title="No payout account" text="Add your first bank account using the form above." />
            ) : (
              <div className="divide-y divide-slate-100">
                {payoutAccounts.map((account) => (
                  <div key={account.id} className="flex items-center gap-4 px-6 py-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><FiCreditCard /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900">{account.bank_name || 'Bank account'}</p>
                      <p className="mt-1 text-xs text-slate-500">{account.account_name || 'Account holder'} · {account.account_number || 'No number'}</p>
                    </div>
                    {account.is_default ? <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">Default</span> : null}
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-black text-slate-950">Withdrawal history</h2>
              <p className="mt-1 text-sm text-slate-500">Your latest withdrawal requests and their current status.</p>
            </div>
            {withdrawalRows.length === 0 ? (
              <EmptyState title="No withdrawals yet" text="Submitted withdrawal requests will appear here." />
            ) : (
              <div className="divide-y divide-slate-100">
                {withdrawalRows.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-slate-950">{money(item.amount)}</p>
                      <p className="mt-1 text-xs text-slate-500">Requested {formatDate(item.requested_at)}</p>
                      {item.net_amount != null ? <p className="mt-1 text-xs text-slate-500">Net: {money(item.net_amount)}</p> : null}
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ring-inset ${statusClass(item.status)}`}>
                      {item.status.replaceAll('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-black text-slate-950">Wallet transactions</h2>
            <p className="mt-1 text-sm text-slate-500">The latest entries from your wallet ledger.</p>
          </div>
          {ledgerRows.length === 0 ? (
            <EmptyState title="No wallet transactions" text="Credits, debits and adjustments will appear here." />
          ) : (
            <div className="divide-y divide-slate-100">
              {ledgerRows.map((item) => {
                const amount = Number(item.amount ?? 0);
                return (
                  <div key={item.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${amount >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {amount >= 0 ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{item.description || item.entry_type.replaceAll('_', ' ')}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(item.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={`font-black ${amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>{amount >= 0 ? '+' : ''}{money(amount)}</p>
                      <p className="mt-1 text-xs text-slate-500">Balance: {money(item.balance_after)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-lg text-green-700">{icon}</span>
      </div>
      <p className="mt-5 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <input {...props} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100" />
    </label>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <FiCreditCard className="mx-auto h-9 w-9 text-slate-300" />
      <h3 className="mt-3 font-black text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function Notice({ children, kind }: { children: React.ReactNode; kind: 'error' | 'success' }) {
  return (
    <div className={`rounded-2xl border p-4 text-sm font-medium ${kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
      {children}
    </div>
  );
}
