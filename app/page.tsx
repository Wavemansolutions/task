import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center text-center">
        <p className="mb-4 text-sm font-bold tracking-[0.3em] text-emerald-400">
          WAVEMAN TASKS
        </p>

        <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
          Complete Simple Online Tasks and Earn Rewards
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Join Waveman Tasks, complete approved promotional tasks,
          submit your proof, and receive rewards in your wallet.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/register"
            className="rounded-xl bg-emerald-500 px-7 py-4 font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Create Account
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-white/15 bg-white/5 px-7 py-4 font-bold transition hover:bg-white/10"
          >
            Sign In
          </Link>
        </div>

        <section className="mt-20 grid w-full gap-5 text-left md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-3xl">📋</div>
            <h2 className="mt-4 text-xl font-bold">
              Choose Tasks
            </h2>
            <p className="mt-2 text-slate-400">
              Browse available tasks that match your account.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-3xl">📸</div>
            <h2 className="mt-4 text-xl font-bold">
              Submit Proof
            </h2>
            <p className="mt-2 text-slate-400">
              Follow the instructions and submit valid evidence.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-3xl">💰</div>
            <h2 className="mt-4 text-xl font-bold">
              Earn Rewards
            </h2>
            <p className="mt-2 text-slate-400">
              Approved task rewards are added to your wallet.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
