import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminAnalyticsPage() {
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
      "task_manager",
      "finance_admin",
      "auditor",
    ].includes(profile?.role ?? "")
  ) {
    redirect("/dashboard");
  }

  const [
    users,
    tasks,
    submissions,
    withdrawals,
    tickets,
    flags,
  ] = await Promise.all([
    supabase.from("profiles").select("id", {
      count: "exact",
      head: true,
    }),
    supabase.from("tasks").select("id", {
      count: "exact",
      head: true,
    }),
    supabase.from("task_submissions").select("id", {
      count: "exact",
      head: true,
    }),
    supabase.from("withdrawal_requests").select("id", {
      count: "exact",
      head: true,
    }),
    supabase.from("support_tickets").select("id", {
      count: "exact",
      head: true,
    }),
    supabase
      .from("fraud_flags")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "open"),
  ]);

  const cards = [
    ["Users", users.count ?? 0],
    ["Tasks", tasks.count ?? 0],
    ["Submissions", submissions.count ?? 0],
    ["Withdrawals", withdrawals.count ?? 0],
    ["Support Tickets", tickets.count ?? 0],
    ["Open Fraud Flags", flags.count ?? 0],
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Platform Analytics
            </h1>
          </div>

          <Link href="/admin" className="text-emerald-400">
            Admin Dashboard
          </Link>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm text-slate-400">
                {label}
              </p>
              <p className="mt-3 text-4xl font-bold">
                {value}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
