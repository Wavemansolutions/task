import Link from "next/link";

type DashboardNavigationProps = {
  role?: string | null;
  unreadNotifications?: number;
};

export default function DashboardNavigation({
  role,
  unreadNotifications = 0,
}: DashboardNavigationProps) {
  const adminRoles = [
    "super_admin",
    "task_manager",
    "proof_reviewer",
    "finance_admin",
    "support_admin",
    "auditor",
  ];

  const isAdmin = adminRoles.includes(role ?? "");

  return (
    <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Link
        href="/tasks"
        className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
      >
        <p className="text-sm text-slate-400">
          Worker
        </p>
        <h3 className="mt-2 text-lg font-bold">
          Browse Tasks
        </h3>
      </Link>

      <Link
        href="/wallet"
        className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
      >
        <p className="text-sm text-slate-400">
          Earnings
        </p>
        <h3 className="mt-2 text-lg font-bold">
          My Wallet
        </h3>
      </Link>

      <Link
        href="/wallet/withdraw"
        className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
      >
        <p className="text-sm text-slate-400">
          Payments
        </p>
        <h3 className="mt-2 text-lg font-bold">
          Withdraw Earnings
        </h3>
      </Link>

      <Link
        href="/notifications"
        className="relative rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
      >
        {unreadNotifications > 0 ? (
          <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-2 py-1 text-xs font-bold text-slate-950">
            {unreadNotifications}
          </span>
        ) : null}
        <p className="text-sm text-slate-400">
          Updates
        </p>
        <h3 className="mt-2 text-lg font-bold">
          Notifications
        </h3>
      </Link>

      {isAdmin ? (
        <Link
          href="/admin"
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 hover:bg-emerald-500/20"
        >
          <p className="text-sm text-emerald-300">
            Staff
          </p>
          <h3 className="mt-2 text-lg font-bold">
            Admin Dashboard
          </h3>
        </Link>
      ) : null}

      {isAdmin ? (
        <Link
          href="/admin/submissions"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
        >
          <p className="text-sm text-slate-400">
            Review
          </p>
          <h3 className="mt-2 text-lg font-bold">
            Proof Submissions
          </h3>
        </Link>
      ) : null}

      {["super_admin", "finance_admin", "auditor"].includes(
        role ?? "",
      ) ? (
        <Link
          href="/admin/withdrawals"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
        >
          <p className="text-sm text-slate-400">
            Finance
          </p>
          <h3 className="mt-2 text-lg font-bold">
            Withdrawals
          </h3>
        </Link>
      ) : null}

      {isAdmin ? (
        <Link
          href="/admin/activity"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
        >
          <p className="text-sm text-slate-400">
            Security
          </p>
          <h3 className="mt-2 text-lg font-bold">
            Activity Logs
          </h3>
        </Link>
      ) : null}
    </nav>
  );
}
