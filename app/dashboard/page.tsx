import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please+sign+in+to+continue.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, trust_score")
    .eq("id", user.id)
    .maybeSingle();

  const { data: wallet } = await supabase
    .from("wallets")
    .select("available_balance, pending_balance")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              WAVEMAN TASKS
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Welcome, {profile?.full_name ?? user.email}
            </h1>

            <p className="mt-2 text-slate-400">
              Manage your tasks, submissions, and earnings.
            </p>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium hover:bg-white/10"
            >
              Sign out
            </button>
          </form>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Available balance</p>
            <p className="mt-3 text-3xl font-bold">
              ₦{Number(wallet?.available_balance ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Pending balance</p>
            <p className="mt-3 text-3xl font-bold">
              ₦{Number(wallet?.pending_balance ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Trust score</p>
            <p className="mt-3 text-3xl font-bold">
              {profile?.trust_score ?? 100}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Available tasks</h2>

          <p className="mt-2 text-slate-400">
            Your approved tasks will appear here.
          </p>

          <Link
  href="/tasks"
  className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
>
  Browse tasks
</Link>        </section>
      </div>
    </main>
  );
}
