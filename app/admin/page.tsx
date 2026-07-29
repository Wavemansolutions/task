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

type DashboardCard = {
  title: string;
  description: string;
  href?: string;
  icon: string;
  roles: AdminRole[];
  active?: boolean;
};

const adminRoles: AdminRole[] = [
  "super_admin",
  "task_manager",
  "proof_reviewer",
  "finance_admin",
  "support_admin",
  "auditor",
];

const dashboardCards: DashboardCard[] = [
  {
    title: "Create New Task",
    description:
      "Publish Facebook, Instagram, TikTok, YouTube, WhatsApp and other tasks.",
    href: "/admin/tasks/new",
    icon: "➕",
    roles: ["super_admin", "task_manager"],
    active: true,
  },
  {
    title: "Manage Tasks",
    description:
      "View existing tasks, their status, reward amount and remaining slots.",
    href: "/admin/tasks",
    icon: "📋",
    roles: ["super_admin", "task_manager", "auditor"],
    active: true,
  },
  {
    title: "Manage Users & Roles",
    description:
      "Assign administrator roles and manage worker access.",
    href: "/admin/users",
    icon: "👥",
    roles: ["super_admin"],
    active: true,
  },
  {
    title: "Review Proofs",
    description:
      "Approve or reject screenshots and other task-submission evidence.",
    href: "/admin/submissions",
    icon: "✅",
    roles: ["super_admin", "proof_reviewer"],
    active: false,
  },
  {
    title: "Withdrawals",
    description:
      "Review pending withdrawals and process approved payments.",
    href: "/admin/withdrawals",
    icon: "🏦",
    roles: ["super_admin", "finance_admin"],
    active: false,
  },
  {
    title: "Wallet Management",
    description:
      "View wallet transactions, credits, deductions and pending balances.",
    href: "/admin/wallets",
    icon: "💰",
    roles: ["super_admin", "finance_admin", "auditor"],
    active: false,
  },
  {
    title: "User Support",
    description:
      "Review user complaints, account issues and support requests.",
    href: "/admin/support",
    icon: "🎧",
    roles: ["super_admin", "support_admin"],
    active: false,
  },
  {
    title: "Reports & Audit Logs",
    description:
      "View administrator activity, financial reports and system records.",
    href: "/admin/reports",
    icon: "📊",
    roles: ["super_admin", "auditor"],
    active: false,
  },
];

function formatRole(role: string) {
  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please+sign+in+to+continue.");
  }

  const { data: profile, error: profileError } = await supabase
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

  const visibleCards = dashboardCards.filter(
    (card) =>
      role === "super_admin" ||
      card.roles.includes(role),
  );

  const [
    usersResult,
    tasksResult,
    submissionsResult,
    withdrawalsResult,
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
    supabase
      .from("task_submissions")
      .select("id", {
        count: "exact",
        head: true,
      }),
    supabase
      .from("withdrawal_requests")
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
              Task Submissions
            </p>

            <p className="mt-3 text-3xl font-bold">
              {submissionsResult.count ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Withdrawals
            </p>

            <p className="mt-3 text-3xl font-bold">
              {withdrawalsResult.count ?? 0}
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold">
              Administration Tools
            </h2>

            <p className="mt-2 text-slate-400">
              The tools displayed below are based on your assigned role.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleCards.map((card) => (
              <article
                key={card.title}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
                    {card.icon}
                  </div>

                  {!card.active ? (
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                      Coming Soon
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  {card.title}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                  {card.description}
                </p>

                {card.active && card.href ? (
                  <Link
                    href={card.href}
                    className="mt-6 inline-flex w-fit rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Open
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-6 w-fit cursor-not-allowed rounded-xl bg-white/5 px-5 py-3 font-semibold text-slate-500"
                  >
                    Not Available Yet
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>

        {role === "super_admin" ? (
          <section className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <h2 className="text-xl font-bold">
              Super Admin Quick Actions
            </h2>

            <p className="mt-2 text-slate-400">
              Create tasks or assign administrator roles.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/admin/tasks/new"
                className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400"
              >
                Create New Task
              </Link>

              <Link
                href="/admin/users"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold hover:bg-white/10"
              >
                Manage Users and Roles
              </Link>

              <Link
                href="/admin/tasks"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold hover:bg-white/10"
              >
                Manage Tasks
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
