import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

type AdminRole =
  | "super_admin"
  | "task_manager"
  | "proof_reviewer"
  | "finance_admin"
  | "support_admin"
  | "auditor";

const adminRoles: AdminRole[] = [
  "super_admin",
  "task_manager",
  "proof_reviewer",
  "finance_admin",
  "support_admin",
  "auditor",
];

function formatRole(role: string) {
  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please+sign+in+to+continue.");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

  if (
    profileError ||
    !profile ||
    !adminRoles.includes(profile.role as AdminRole)
  ) {
    redirect(
      "/dashboard?error=You+are+not+authorized+to+access+the+admin+dashboard.",
    );
  }

  const role = profile.role as AdminRole;

  const canManageTasks =
    role === "super_admin" ||
    role === "task_manager";

  const canAssignRoles =
    role === "super_admin";

  const canReviewProofs =
    role === "super_admin" ||
    role === "proof_reviewer";

  const canManageFinance =
    role === "super_admin" ||
    role === "finance_admin";

  const canManageSupport =
    role === "super_admin" ||
    role === "support_admin";

  const canViewReports =
    role === "super_admin" ||
    role === "auditor";

  const [
    usersResult,
    tasksResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("tasks")
      .select("id", {
        count: "exact",
        head: true,
      }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-emerald-400">
              WAVEMAN TASKS ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Welcome,{" "}
              {profile.full_name ??
                user.email ??
                "Administrator"}
            </h1>

            <p className="mt-2 text-slate-400">
              Role:{" "}
              <span className="font-semibold text-emerald-400">
                {formatRole(role)}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium transition hover:bg-white/10"
            >
              Worker Dashboard
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 font-medium text-red-300 transition hover:bg-red-500/20"
              >
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Registered Users
            </p>

            <p className="mt-3 text-3xl font-bold">
              {usersResult.count ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Total Tasks
            </p>

            <p className="mt-3 text-3xl font-bold">
              {tasksResult.count ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Your Role
            </p>

            <p className="mt-3 text-xl font-bold text-emerald-400">
              {formatRole(role)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Admin Status
            </p>

            <p className="mt-3 text-xl font-bold">
              Active
            </p>
          </div>
        </section>

        {role === "super_admin" ? (
          <section className="mt-10 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 sm:p-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                Super Admin Tools
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Quick Administration
              </h2>

              <p className="mt-2 text-slate-400">
                Create tasks, manage existing tasks, and assign
                administrator roles.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/admin/tasks/new"
                className="rounded-2xl bg-emerald-500 p-6 text-slate-950 transition hover:bg-emerald-400"
              >
                <p className="text-3xl">➕</p>

                <h3 className="mt-4 text-xl font-bold">
                  New Task
                </h3>

                <p className="mt-2 text-sm font-medium">
                  Create and publish a new worker task.
                </p>
              </Link>

              <Link
                href="/admin/tasks"
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
              >
                <p className="text-3xl">📋</p>

                <h3 className="mt-4 text-xl font-bold">
                  Manage Tasks
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  View, edit, pause, or monitor tasks.
                </p>
              </Link>

              <Link
                href="/admin/users"
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
              >
                <p className="text-3xl">👥</p>

                <h3 className="mt-4 text-xl font-bold">
                  Assign Roles
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Make users admins or change staff roles.
                </p>
              </Link>
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="text-2xl font-bold">
            Role-Based Admin Tools
          </h2>

          <p className="mt-2 text-slate-400">
            You only see the tools allowed for your role.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {canManageTasks ? (
              <>
                <Link
                  href="/admin/tasks/new"
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-500/40 hover:bg-white/10"
                >
                  <p className="text-3xl">➕</p>

                  <h3 className="mt-4 text-xl font-bold">
                    Create New Task
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Add a new task, reward, instructions,
                    platform, and worker slots.
                  </p>
                </Link>

                <Link
                  href="/admin/tasks"
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-500/40 hover:bg-white/10"
                >
                  <p className="text-3xl">📋</p>

                  <h3 className="mt-4 text-xl font-bold">
                    Task Management
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    View and manage all available worker tasks.
                  </p>
                </Link>
              </>
            ) : null}

            {canAssignRoles ? (
              <Link
                href="/admin/users"
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-500/40 hover:bg-white/10"
              >
                <p className="text-3xl">👥</p>

                <h3 className="mt-4 text-xl font-bold">
                  Users and Roles
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Assign Super Admin and other administrator
                  roles.
                </p>
              </Link>
            ) : null}

            {canReviewProofs ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-3xl">✅</p>

                <h3 className="mt-4 text-xl font-bold">
                  Review Proofs
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Proof review page will be added next.
                </p>

                <span className="mt-5 inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  Coming Soon
                </span>
              </div>
            ) : null}

            {canManageFinance ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-3xl">💰</p>

                <h3 className="mt-4 text-xl font-bold">
                  Finance Management
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Wallet and withdrawal tools will be added next.
                </p>

                <span className="mt-5 inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  Coming Soon
                </span>
              </div>
            ) : null}

            {canManageSupport ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-3xl">🎧</p>

                <h3 className="mt-4 text-xl font-bold">
                  User Support
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Account complaints and support tools will be
                  added next.
                </p>

                <span className="mt-5 inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  Coming Soon
                </span>
              </div>
            ) : null}

            {canViewReports ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-3xl">📊</p>

                <h3 className="mt-4 text-xl font-bold">
                  Reports and Audit
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  System reports and activity logs will be added
                  next.
                </p>

                <span className="mt-5 inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  Coming Soon
                </span>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}