import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ message?: string; error?: string }>;
};

export default async function FraudFlagsPage({
  searchParams,
}: Props) {
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

  const { data: flags, error } = await supabase
    .from("fraud_flags")
    .select(
      "id,user_id,reason,severity,status,created_at,resolved_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-red-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Fraud Review
            </h1>
          </div>
          <Link
            href="/admin/fraud/new"
            className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white"
          >
            Create Flag
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

        <div className="space-y-4">
          {(flags ?? []).map((flag) => (
            <Link
              key={flag.id}
              href={"/admin/fraud/" + flag.id}
              className="block rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold">{flag.reason}</h2>
                  <p className="mt-2 font-mono text-xs text-slate-500">
                    User: {flag.user_id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold capitalize text-red-300">
                    {flag.severity}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize">
                    {flag.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
