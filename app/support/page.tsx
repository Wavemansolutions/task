import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SupportPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export default async function SupportPage({
  searchParams,
}: SupportPageProps) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select(
      "id,subject,category,priority,status,last_message_at,created_at",
    )
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wider text-emerald-400">
              WAVEMAN TASKS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Support
            </h1>
          </div>

          <Link
            href="/support/new"
            className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950"
          >
            New Ticket
          </Link>
        </header>

        {query.message ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
            {query.message}
          </div>
        ) : null}

        {query.error || error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error ?? error?.message}
          </div>
        ) : null}

        <section className="space-y-4">
          {(tickets ?? []).map((ticket) => (
            <Link
              key={ticket.id}
              href={"/support/" + ticket.id}
              className="block rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold">
                    {ticket.subject}
                  </h2>
                  <p className="mt-2 text-sm capitalize text-slate-400">
                    {ticket.category} · {ticket.priority}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize">
                  {ticket.status.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </section>

        {(tickets ?? []).length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-slate-400">
            You have not created any support tickets.
          </div>
        ) : null}
      </div>
    </main>
  );
}
