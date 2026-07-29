import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AdminWithdrawalsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AdminWithdrawalsPage({
  searchParams,
}: AdminWithdrawalsPageProps) {
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
      "finance_admin",
      "auditor",
    ].includes(profile?.role ?? "")
  ) {
    redirect("/dashboard");
  }

  const { data: requests, error } =
    await supabase
      .from("withdrawal_requests")
      .select(
        "id,worker_id,amount,bank_name,account_name,account_number,status,created_at",
      )
      .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Withdrawal Requests
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
                  <th className="px-5 py-4">Worker</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Bank</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {(requests ?? []).map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-white/10 last:border-b-0"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-slate-300">
                      {request.worker_id}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-400">
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
                        {request.account_name} ·{" "}
                        {request.account_number}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize">
                        {request.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={
                          "/admin/withdrawals/" +
                          request.id
                        }
                        className="font-semibold text-emerald-400 hover:text-emerald-300"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(requests ?? []).length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-400">
              No withdrawal requests found.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
