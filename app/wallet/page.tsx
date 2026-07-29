import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type WalletPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function WalletPage({
  searchParams,
}: WalletPageProps) {
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
    { data: transactions, error },
  ] = await Promise.all([
    supabase
      .from("worker_wallets")
      .select(
        "id,balance,total_earned,total_withdrawn,updated_at",
      )
      .eq("worker_id", user.id)
      .maybeSingle(),
    supabase
      .from("wallet_transactions")
      .select(
        "id,transaction_type,direction,amount,description,reference,created_at",
      )
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              My Wallet
            </h1>
            <p className="mt-2 text-slate-400">
              View your approved earnings and wallet history.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium hover:bg-white/10"
          >
            Worker Dashboard
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

        <section className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Available Balance
            </p>
            <p className="mt-3 text-3xl font-bold text-emerald-400">
              ₦
              {Number(
                wallet?.balance ?? 0,
              ).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Total Earned
            </p>
            <p className="mt-3 text-3xl font-bold">
              ₦
              {Number(
                wallet?.total_earned ?? 0,
              ).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Total Withdrawn
            </p>
            <p className="mt-3 text-3xl font-bold">
              ₦
              {Number(
                wallet?.total_withdrawn ?? 0,
              ).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-xl font-bold">
              Transaction History
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-white/10 bg-white/5 text-sm text-slate-400">
                <tr>
                  <th className="px-5 py-4">
                    Description
                  </th>
                  <th className="px-5 py-4">
                    Type
                  </th>
                  <th className="px-5 py-4">
                    Amount
                  </th>
                  <th className="px-5 py-4">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {(transactions ?? []).map(
                  (transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-white/10 last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {transaction.description ??
                            "Wallet transaction"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {transaction.reference}
                        </p>
                      </td>
                      <td className="px-5 py-4 capitalize text-slate-300">
                        {transaction.transaction_type.replace(
                          "_",
                          " ",
                        )}
                      </td>
                      <td
                        className={
                          "px-5 py-4 font-bold " +
                          (transaction.direction === "credit"
                            ? "text-emerald-400"
                            : "text-red-400")
                        }
                      >
                        {transaction.direction === "credit"
                          ? "+"
                          : "-"}
                        ₦
                        {Number(
                          transaction.amount,
                        ).toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {new Date(
                          transaction.created_at,
                        ).toLocaleString("en-NG")}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {(transactions ?? []).length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-400">
              No wallet transactions yet.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
