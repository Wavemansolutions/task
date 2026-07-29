import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminActivityPage() {
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

  const allowedRoles = [
    "super_admin",
    "task_manager",
    "proof_reviewer",
    "finance_admin",
    "support_admin",
    "auditor",
  ];

  if (!allowedRoles.includes(profile?.role ?? "")) {
    redirect("/dashboard");
  }

  const { data: logs, error } = await supabase
    .from("activity_logs")
    .select(
      "id,actor_id,action,entity_type,entity_id,description,metadata,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Activity Logs
            </h1>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10"
          >
            Admin Dashboard
          </Link>
        </header>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-white/10 bg-white/5 text-sm text-slate-400">
                <tr>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Actor</th>
                  <th className="px-5 py-4">Entity</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-white/10 last:border-b-0"
                  >
                    <td className="px-5 py-4 font-semibold">
                      {log.action}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      {log.actor_id ?? "System"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">
                      <p>{log.entity_type ?? "—"}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {log.entity_id ?? ""}
                      </p>
                    </td>
                    <td className="max-w-md px-5 py-4 text-sm text-slate-300">
                      {log.description ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {new Date(
                        log.created_at,
                      ).toLocaleString("en-NG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(logs ?? []).length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-400">
              No activity logs found.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
