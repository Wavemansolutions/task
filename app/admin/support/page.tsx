import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSupportPage() {
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

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select(
      "id,user_id,subject,category,priority,status,assigned_to,last_message_at,created_at",
    )
    .order("last_message_at", { ascending: false })
    .limit(200);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Support Inbox
            </h1>
          </div>
          <Link href="/admin" className="text-emerald-400">
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
                  <th className="px-5 py-4">Subject</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Last Message</th>
                </tr>
              </thead>
              <tbody>
                {(tickets ?? []).map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-white/10 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={"/admin/support/" + ticket.id}
                        className="font-semibold hover:text-emerald-400"
                      >
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-300">
                      {ticket.category}
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-300">
                      {ticket.priority}
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-300">
                      {ticket.status.replace("_", " ")}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {new Date(
                        ticket.last_message_at,
                      ).toLocaleString("en-NG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(tickets ?? []).length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-400">
              No support tickets found.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
