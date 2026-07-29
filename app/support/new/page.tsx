import Link from "next/link";
import { createSupportTicket } from "@/app/support/actions";

type NewSupportPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewSupportPage({
  searchParams,
}: NewSupportPageProps) {
  const query = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            Create Support Ticket
          </h1>
          <Link href="/support" className="text-emerald-400">
            Back
          </Link>
        </header>

        {query.error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error}
          </div>
        ) : null}

        <form
          action={createSupportTicket}
          className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <input
            name="subject"
            required
            placeholder="Ticket subject"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          />

          <select
            name="category"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          >
            <option value="general">General</option>
            <option value="task">Task</option>
            <option value="proof">Proof</option>
            <option value="wallet">Wallet</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="account">Account</option>
          </select>

          <select
            name="priority"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <textarea
            name="message"
            rows={7}
            required
            placeholder="Describe the issue clearly"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          />

          <button className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950">
            Submit Ticket
          </button>
        </form>
      </div>
    </main>
  );
}
