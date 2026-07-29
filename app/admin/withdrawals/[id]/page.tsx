import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  approveWithdrawal,
  markWithdrawalPaid,
  rejectWithdrawal,
} from "@/app/admin/withdrawals/actions";

type AdminWithdrawalDetailsProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminWithdrawalDetails({
  params,
  searchParams,
}: AdminWithdrawalDetailsProps) {
  const { id } = await params;
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

  const { data: request } = await supabase
    .from("withdrawal_requests")
    .select(
      "id,worker_id,amount,bank_name,account_name,account_number,status,review_notes,created_at,reviewed_at,paid_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!request) {
    notFound();
  }

  const canAct = profile?.role !== "auditor";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Review Withdrawal
            </h1>
          </div>

          <Link
            href="/admin/withdrawals"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10"
          >
            Back
          </Link>
        </header>

        {query.error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error}
          </div>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Worker ID
              </p>
              <p className="mt-1 break-all font-mono text-sm">
                {request.worker_id}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Amount
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                ₦
                {Number(
                  request.amount,
                ).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Bank
              </p>
              <p className="mt-1 font-semibold">
                {request.bank_name}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Account Name
              </p>
              <p className="mt-1 font-semibold">
                {request.account_name}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Account Number
              </p>
              <p className="mt-1 font-mono text-lg font-bold">
                {request.account_number}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Status
              </p>
              <p className="mt-1 font-semibold capitalize">
                {request.status}
              </p>
            </div>
          </div>

          {canAct && request.status === "pending" ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <form
                action={approveWithdrawal}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"
              >
                <input
                  type="hidden"
                  name="request_id"
                  value={request.id}
                />
                <textarea
                  name="review_notes"
                  rows={4}
                  placeholder="Optional approval note"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                />
                <button className="mt-4 w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950">
                  Approve and Debit Wallet
                </button>
              </form>

              <form
                action={rejectWithdrawal}
                className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5"
              >
                <input
                  type="hidden"
                  name="request_id"
                  value={request.id}
                />
                <textarea
                  name="review_notes"
                  rows={4}
                  required
                  placeholder="Required rejection reason"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                />
                <button className="mt-4 w-full rounded-xl bg-red-500 px-5 py-3 font-bold text-white">
                  Reject Request
                </button>
              </form>
            </div>
          ) : null}

          {canAct && request.status === "approved" ? (
            <form
              action={markWithdrawalPaid}
              className="mt-8 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5"
            >
              <input
                type="hidden"
                name="request_id"
                value={request.id}
              />
              <textarea
                name="review_notes"
                rows={3}
                placeholder="Optional payment reference or note"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
              />
              <button className="mt-4 w-full rounded-xl bg-blue-500 px-5 py-3 font-bold text-white">
                Mark as Paid
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  );
}
