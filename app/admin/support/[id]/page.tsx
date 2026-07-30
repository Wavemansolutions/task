import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  assignTicket,
  replyTicket,
  updateTicketStatus,
} from "@/app/admin/support/actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminSupportTicketPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const query = await searchParams;
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

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select(
      "id,user_id,subject,category,priority,status,assigned_to,created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!ticket) notFound();

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id,message,is_staff,sender_id,created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">{ticket.subject}</h1>
        <p className="mt-2 capitalize text-slate-400">
          {ticket.category} · {ticket.priority} ·{" "}
          {ticket.status.replace("_", " ")}
        </p>

        {query.error ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <form action={assignTicket}>
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <button className="rounded-xl bg-blue-500 px-4 py-2 font-semibold text-white">
              Assign to Me
            </button>
          </form>

          {["open", "in_progress", "resolved", "closed"].map(
            (status) => (
              <form key={status} action={updateTicketStatus}>
                <input
                  type="hidden"
                  name="ticket_id"
                  value={ticket.id}
                />
                <input
                  type="hidden"
                  name="status"
                  value={status}
                />
                <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm capitalize hover:bg-white/10">
                  {status.replace("_", " ")}
                </button>
              </form>
            ),
          )}
        </div>

        <section className="mt-8 space-y-4">
          {(messages ?? []).map((message) => (
            <article
              key={message.id}
              className={
                "rounded-2xl border p-5 " +
                (message.is_staff
                  ? "border-blue-500/30 bg-blue-500/10"
                  : "border-white/10 bg-white/5")
              }
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {message.is_staff ? "Staff" : "User"}
              </p>
              <p className="mt-2 leading-7">{message.message}</p>
              <p className="mt-3 text-xs text-slate-500">
                {new Date(
                  message.created_at,
                ).toLocaleString("en-NG")}
              </p>
            </article>
          ))}
        </section>

        {profile?.role !== "auditor" ? (
          <form
            action={replyTicket}
            className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <textarea
              name="message"
              rows={5}
              required
              placeholder="Write support reply"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
            />
            <button className="mt-4 rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950">
              Send Reply
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
