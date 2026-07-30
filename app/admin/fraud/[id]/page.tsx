import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveFraudFlag } from "@/app/admin/fraud/actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function FraudFlagDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !["super_admin", "support_admin", "auditor"].includes(
      profile?.role ?? "",
    )
  ) {
    redirect("/dashboard");
  }

  const { data: flag } = await supabase
    .from("fraud_flags")
    .select(
      "id,user_id,reason,severity,status,evidence,resolution_notes,created_at,resolved_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!flag) notFound();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Fraud Flag</h1>

        {query.error ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error}
          </div>
        ) : null}

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">User</p>
          <p className="mt-1 font-mono text-sm">{flag.user_id}</p>

          <p className="mt-6 text-sm text-slate-400">Reason</p>
          <p className="mt-2 leading-7">{flag.reason}</p>

          <div className="mt-6 flex gap-3">
            <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm capitalize text-red-300">
              {flag.severity}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm capitalize">
              {flag.status}
            </span>
          </div>
        </section>

        <form
          action={resolveFraudFlag}
          className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <input type="hidden" name="flag_id" value={flag.id} />

          <select
            name="status"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          >
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <textarea
            name="resolution_notes"
            rows={5}
            placeholder="Resolution notes"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          />

          <button className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950">
            Update Fraud Flag
          </button>
        </form>
      </div>
    </main>
  );
}
