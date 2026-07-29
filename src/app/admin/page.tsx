import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

const allowedAdminRoles = [
  "super_admin",
  "task_manager",
  "proof_reviewer",
  "finance_admin",
  "support_admin",
  "auditor",
];

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, status")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !allowedAdminRoles.includes(profile.role)
  ) {
    redirect("/dashboard");
  }

  const [
    usersResult,
    tasksResult,
    pendingSubmissionsResult,
    withdrawalsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("task_submissions")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "under_review"]),

    supabase
      .from("withdrawal_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["requested", "under_review"]),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-amber-400">
              WAVEMAN TASKS
            </p>

            <h1 className="text-xl font-bold">
              Admin Dashboard
            </h1>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Welcome, {profile.full_name}
          </h2>

          <p className="mt-2 capitalize text-slate-400">
            Role: {profile.role.replaceAll("_", " ")}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            title="Registered users"
            value={usersResult.count ?? 0}
          />

          <AdminStatCard
            title="All tasks"
            value={tasksResult.count ?? 0}
          />

          <AdminStatCard
            title="Pending reviews"
            value={pendingSubmissionsResult.count ?? 0}
          />

          <AdminStatCard
            title="Pending withdrawals"
            value={withdrawalsResult.count ?? 0}
          />
        </div>
      </section>
    </main>
  );
}

function AdminStatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </article>
  );
}