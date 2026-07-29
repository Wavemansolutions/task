import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

const adminRoles = [
  "super_admin",
  "task_manager",
  "proof_reviewer",
  "finance_admin",
  "support_admin",
  "auditor",
];

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

  const isAdmin =
    profile?.role &&
    adminRoles.includes(profile.role);

  const formattedRole = profile?.role
    ? profile.role
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase(),
        )
    : "Worker";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Welcome,{" "}
              {profile?.full_name ??
                user.email ??
                "User"}
            </h1>

            <p className="mt-2 text-slate-400">
              Manage your tasks, submissions, and earnings.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Account role:{" "}
              <span className="font-semibold text-emerald-400">
                {formattedRole}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isAdmin ? (
              <Link
                href="/admin"
                className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Admin Dashboard
              </Link>
            ) : null}

            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium transition hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Available balance
            </p>

            <p className="mt-3 text-3xl font-bold">
              ₦
              {Number(
                wallet?.available_balance ?? 0,
              ).toLocaleString("en-NG")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Pending balance
            </p>

            <p className="mt-3 text-3xl font-bold">
              ₦
              {Number(
                wallet?.pending_balance ?? 0,
              ).toLocaleString("en-NG")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Trust score
            </p>

            <p className="mt-3 text-3xl font-bold">
              {profile?.trust_score ?? 100}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
              📋
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Available Tasks
            </h2>

            <p className="mt-2 text-slate-400">
              Browse active tasks, follow the instructions,
              and submit valid proof.
            </p>

            <Link
              href="/tasks"
              className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Browse Tasks
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
              📝
            </div>

            <h2 className="mt-5 text-xl font-bold">
              My Tasks
            </h2>

            <p className="mt-2 text-slate-400">
              View tasks you accepted, completed, or submitted
              for review.
            </p>

            <Link
              href="/my-tasks"
              className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10"
            >
              View My Tasks
            </Link>
          </div>
        </section>

        {isAdmin ? (
          <section className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Administration Access
                </h2>

                <p className="mt-2 text-slate-400">
                  Your role gives you access to administrator
                  tools.
                </p>
              </div>

              <Link
                href="/admin"
                className="w-fit rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Open Admin Dashboard
              </Link>
            </div>

            {profile?.role === "super_admin" ? (
              <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-6">
                <Link
                  href="/admin/tasks/new"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium transition hover:bg-white/10"
                >
                  Create New Task
                </Link>

                <Link
                  href="/admin/tasks"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium transition hover:bg-white/10"
                >
                  Manage Tasks
                </Link>

                <Link
                  href="/admin/users"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium transition hover:bg-white/10"
                >
                  Manage Users and Roles
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}