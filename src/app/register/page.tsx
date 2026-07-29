import Link from "next/link";
import { signUp } from "@/app/auth/actions";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-emerald-400">
            WAVEMAN TASKS
          </p>

          <h1 className="text-3xl font-bold">
            Create worker account
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Register to complete approved promotional tasks and
            receive wallet credit.
          </p>
        </div>

        {params.error ? (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {params.error}
          </div>
        ) : null}

        <form action={signUp} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Full name
            </span>

            <input
              name="fullName"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

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
              Phone number
            </span>

            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+234..."
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              WhatsApp number
            </span>

            <input
              name="whatsappNumber"
              type="tel"
              placeholder="+234..."
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
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-500"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}