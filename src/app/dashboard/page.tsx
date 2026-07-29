import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
        full_name,
        role,
        status,
        daily_task_limit,
        trust_score,
        total_approved_tasks,
        total_rejected_tasks
      `,
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login?error=Profile not found");
  }

  if (profile.role !== "worker") {
    redirect("/admin");
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select(
      `
        pending_balance,
        available_balance,
        total_earned,
        total_withdrawn
      `,
    )
    .eq("user_id", user.id)
    .single();

  const { count: completedToday } = await supabase
    .from("task_assignments")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", user.id)
    .gte(
      "accepted_at",
      new Date(
        new Date().setHours(0, 0, 0, 0),
      ).toISOString(),
    );

  const remainingTasks = Math.max(
    0,
    profile.daily_task_limit - (completedToday ?? 0),
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              WAVEMAN TASKS
            </p>

            <h1 className="text-xl font-bold">
              Worker Dashboard
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

          <p className="mt-2 text-slate-400">
            Complete approved tasks and upload valid evidence.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Available balance"
            value={`₦${Number(
              wallet?.available_balance ?? 0,
            ).toLocaleString("en-NG")}`}
          />

          <StatCard
            title="Pending balance"
            value={`₦${Number(
              wallet?.pending_balance ?? 0,
            ).toLocaleString("en-NG")}`}
          />

          <StatCard
            title="Tasks remaining"
            value={`${remainingTasks}/${profile.daily_task_limit}`}
          />

          <StatCard
            title="Trust score"
            value={`${profile.trust_score}%`}
          />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">
                Available tasks
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Active tasks will appear here.
              </p>
            </div>

            <a
              href="/dashboard/tasks"
              className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Browse tasks
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </article>
  );
}