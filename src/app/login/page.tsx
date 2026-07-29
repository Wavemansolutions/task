import Link from "next/link";
import { signIn } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-emerald-400">
            WAVEMAN TASKS
          </p>

          <h1 className="text-3xl font-bold">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your tasks and wallet.
          </p>
        </div>

        {params.error ? (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {params.error}
          </div>
        ) : null}

        {params.message ? (
          <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {params.message}
          </div>
        ) : null}

        <form action={signIn} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Email address
            </span>

            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Password
            </span>

            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          No account yet?{" "}
          <Link
            href="/register"
            className="font-semibold text-emerald-400"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}