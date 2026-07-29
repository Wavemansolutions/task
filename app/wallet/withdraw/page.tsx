import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requestWithdrawal } from "@/app/wallet/actions";

type WithdrawPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function WithdrawPage({
  searchParams,
}: WithdrawPageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase.rpc("ensure_worker_wallet", {
    p_worker_id: user.id,
  });

  const [
    { data: wallet },
    { data: requests },
  ] = await Promise.all([
    supabase
      .from("worker_wallets")
      .select("balance,total_earned,total_withdrawn")
      .eq("worker_id", user.id)
      .maybeSingle(),
    supabase
      .from("withdrawal_requests")
      .select(
        "id,amount,bank_name,account_name,account_number,status,review_notes,created_at,paid_at",
      )
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const hasActiveRequest = (requests ?? []).some(
    (request) =>
      request.status === "pending" ||
      request.status === "approved",
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Withdraw Earnings
            </h1>
          </div>

          <Link
            href="/wallet"
            className="w-fit rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium hover:bg-white/10"
          >
            Back to Wallet
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

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Available Balance
            </p>
            <p className="mt-3 text-4xl font-bold text-emerald-400">
              ₦
              {Number(
                wallet?.balance ?? 0,
              ).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm leading-6 text-slate-400">
              Minimum withdrawal is ₦1,000.
              You can only have one pending or approved
              withdrawal at a time.
            </div>
          </div>

          <form
            action={requestWithdrawal}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-xl font-bold">
              Bank Details
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-semibold"
                >
                  Amount
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1000"
                  step="0.01"
                  required
                  disabled={hasActiveRequest}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="bank_name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Bank Name
                </label>
                <input
                  id="bank_name"
                  name="bank_name"
                  required
                  disabled={hasActiveRequest}
                  placeholder="Example: Access Bank"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="account_name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Account Name
                </label>
                <input
                  id="account_name"
                  name="account_name"
                  required
                  disabled={hasActiveRequest}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="account_number"
                  className="mb-2 block text-sm font-semibold"
                >
                  Account Number
                </label>
                <input
                  id="account_number"
                  name="account_number"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                  disabled={hasActiveRequest}
                  placeholder="10-digit account number"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={hasActiveRequest}
                className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {hasActiveRequest
                  ? "Active Request Exists"
                  : "Request Withdrawal"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-xl font-bold">
              Withdrawal History
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-white/10 bg-white/5 text-sm text-slate-400">
                <tr>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Bank</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {(requests ?? []).map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-white/10 last:border-b-0"
                  >
                    <td className="px-5 py-4 font-bold">
                      ₦
                      {Number(
                        request.amount,
                      ).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      <p>{request.bank_name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {request.account_number}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize">
                        {request.status}
                      </span>
                      {request.review_notes ? (
                        <p className="mt-2 max-w-xs text-xs text-slate-500">
                          {request.review_notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {new Date(
                        request.created_at,
                      ).toLocaleString("en-NG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(requests ?? []).length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-400">
              No withdrawal requests yet.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
