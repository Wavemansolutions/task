import Link from "next/link";
import { createFraudFlag } from "@/app/admin/fraud/actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewFraudFlagPage({
  searchParams,
}: Props) {
  const query = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            Create Fraud Flag
          </h1>
          <Link href="/admin/fraud" className="text-emerald-400">
            Back
          </Link>
        </header>

        {query.error ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {query.error}
          </div>
        ) : null}

        <form
          action={createFraudFlag}
          className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <input
            name="user_id"
            required
            placeholder="User UUID"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          />

          <select
            name="severity"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <textarea
            name="reason"
            rows={6}
            required
            placeholder="Explain the suspicious activity"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
          />

          <button className="w-full rounded-xl bg-red-500 px-5 py-3 font-bold text-white">
            Create Flag
          </button>
        </form>
      </div>
    </main>
  );
}
