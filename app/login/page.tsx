'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiUser,
} from 'react-icons/fi';

import { createClient } from '@/utils/supabase/client';

type AuthMode = 'login' | 'register';

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;

    for (const key of ['message', 'error', 'error_description']) {
      const value = record[key];

      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
  }

  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setMessage('');
    setPassword('');
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !password) {
        throw new Error('Enter your email and password.');
      }

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (signInError) {
        throw new Error(signInError.message);
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (loginError: unknown) {
      setError(
        errorMessage(
          loginError,
          'Unable to sign in. Check your email and password.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
        requiresEmailConfirmation?: boolean;
      };

      if (!response.ok) {
        throw new Error(
          result.error || 'Registration could not be completed.',
        );
      }

      setMessage(
        result.message ||
          'Account created. Check your email to confirm your account.',
      );

      if (!result.requiresEmailConfirmation) {
        router.replace('/dashboard');
        router.refresh();
        return;
      }

      setMode('login');
      setPassword('');
    } catch (registrationError: unknown) {
      setError(
        errorMessage(
          registrationError,
          'Registration could not be completed.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-green-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"
          >
            <FiArrowLeft />
            Back to home
          </Link>

          <div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 text-3xl font-black">
              ₦
            </div>

            <h1 className="mt-8 max-w-xl text-5xl font-black leading-tight">
              Complete verified tasks and manage your earnings.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
              Register with your email, password and a unique Nigerian
              phone number. Phone SMS verification can be added back
              after the gateway is ready.
            </p>
          </div>

          <p className="text-xs text-white/50">
            Task Money may record login and device information for
            account protection and fraud prevention.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950 lg:hidden"
            >
              <FiArrowLeft />
              Back to home
            </Link>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-2xl font-black text-white">
                ₦
              </div>

              <h2 className="mt-5 text-3xl font-black text-slate-950">
                Task Money
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {mode === 'login'
                  ? 'Sign in to your account.'
                  : 'Create a new verified account.'}
              </p>
            </div>

            <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold ${
                  mode === 'login'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold ${
                  mode === 'register'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Create account
              </button>
            </div>

            {error ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {message}
              </div>
            ) : null}

            <form
              onSubmit={mode === 'login' ? handleLogin : handleRegister}
              className="mt-6 space-y-5"
            >
              {mode === 'register' ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Full name
                    </span>

                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                      <input
                        value={fullName}
                        onChange={(event) =>
                          setFullName(event.target.value)
                        }
                        required
                        minLength={2}
                        autoComplete="name"
                        placeholder="Your full name"
                        className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone number
                    </span>

                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                      <input
                        value={phone}
                        onChange={(event) =>
                          setPhone(event.target.value)
                        }
                        type="tel"
                        required
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="08136963037"
                        className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Each phone number can be connected to only one account.
                    </p>
                  </label>
                </>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Email address
                </span>

                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </span>

                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete={
                      mode === 'login'
                        ? 'current-password'
                        : 'new-password'
                    }
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-12 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((visible) => !visible)
                    }
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-green-600 px-5 py-3.5 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? mode === 'login'
                    ? 'Signing in...'
                    : 'Creating account...'
                  : mode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
            </form>

            {mode === 'login' ? (
              <p className="mt-5 text-center text-sm text-slate-500">
                Forgot your password? Use the password reset page once it
                is connected.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}