import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminWalletsPage() {
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

  const { data: wallets, error } =
    await supabase
      .from("worker_wallets")
      .select(
        "id,worker_id,balance,total_earned,total_withdrawn,updated_at",
      )
      .order("total_earned", {
        ascending: false,
      });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Worker Wallets
            </h1>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10"
          >
            Admin Dashboard
          </Link>
        </header>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-white/10 bg-white/5 text-sm text-slate-400">
                <tr>
                  <th className="px-5 py-4">
                    Worker ID
                  </th>
                  <th className="px-5 py-4">
                    Balance
                  </th>
                  <th className="px-5 py-4">
                    Total Earned
                  </th>
                  <th className="px-5 py-4">
                    Total Withdrawn
                  </th>
                  <th className="px-5 py-4">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {(wallets ?? []).map((wallet) => (
                  <tr
                    key={wallet.id}
                    className="border-b border-white/10 last:border-b-0"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-slate-300">
                      {wallet.worker_id}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-400">
                      ₦
                      {Number(
                        wallet.balance,
                      ).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-4">
                      ₦
                      {Number(
                        wallet.total_earned,
                      ).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-4">
                      ₦
                      {Number(
                        wallet.total_withdrawn,
                      ).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {new Date(
                        wallet.updated_at,
                      ).toLocaleString("en-NG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(wallets ?? []).length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-400">
              No worker wallets found.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
