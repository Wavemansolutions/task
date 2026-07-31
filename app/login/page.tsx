'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { normalizeNigerianPhone } from '@/lib/phone';
import { createClient } from '@/utils/supabase/client';

type LoginStage = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [stage, setStage] =
    useState<LoginStage>('phone');

  const [phoneInput, setPhoneInput] = useState('');
  const [normalizedPhone, setNormalizedPhone] =
    useState('');

  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function sendOtp(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const phone = normalizeNigerianPhone(phoneInput);

      const { error: otpError } =
        await supabase.auth.signInWithOtp({
          phone,
          options: {
            shouldCreateUser: true,
            data: {
              full_name: fullName.trim() || null,
            },
          },
        });

      if (otpError) {
        throw otpError;
      }

      setNormalizedPhone(phone);
      setStage('otp');

      setMessage(
        `A verification code was sent to ${phone}.`,
      );
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Unable to send the verification code.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (!/^\d{6}$/.test(otp)) {
        throw new Error(
          'Enter the six-digit verification code.',
        );
      }

      const { data, error: verifyError } =
        await supabase.auth.verifyOtp({
          phone: normalizedPhone,
          token: otp,
          type: 'sms',
        });

      if (verifyError) {
        throw verifyError;
      }

      const user = data.user;

      if (!user) {
        throw new Error(
          'Phone verification succeeded, but the account could not be loaded.',
        );
      }

      const nameFromMetadata =
        typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name.trim()
          : '';

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            full_name:
              fullName.trim() ||
              nameFromMetadata ||
              null,
            phone: normalizedPhone,
            phone_verified: true,
          },
          {
            onConflict: 'id',
          },
        );

      if (profileError) {
        throw profileError;
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : 'The verification code could not be confirmed.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error: resendError } =
        await supabase.auth.signInWithOtp({
          phone: normalizedPhone,
          options: {
            shouldCreateUser: true,
          },
        });

      if (resendError) {
        throw resendError;
      }

      setMessage('A new verification code was sent.');
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : 'Unable to resend the code.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-2xl font-black text-white">
            ₦
          </div>

          <h1 className="mt-5 text-3xl font-black text-slate-950">
            Task Money
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {stage === 'phone'
              ? 'Enter your phone number to continue.'
              : 'Enter the SMS verification code.'}
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        {stage === 'phone' ? (
          <form
            onSubmit={sendOtp}
            className="mt-7 space-y-5"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Full name
              </span>

              <input
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Your full name"
                autoComplete="name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Phone number
              </span>

              <input
                value={phoneInput}
                onChange={(event) =>
                  setPhoneInput(event.target.value)
                }
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                placeholder="08012345678"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-600 px-5 py-3.5 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Sending code...'
                : 'Continue with phone'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={verifyOtp}
            className="mt-7 space-y-5"
          >
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">
                Code sent to
              </p>

              <p className="mt-1 font-bold text-slate-900">
                {normalizedPhone}
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Six-digit OTP
              </span>

              <input
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6),
                  )
                }
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-2xl font-black tracking-[0.45em] outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
              />
            </label>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-xl bg-green-600 px-5 py-3.5 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Verifying...'
                : 'Verify and sign in'}
            </button>

            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStage('phone');
                  setOtp('');
                  setError('');
                  setMessage('');
                }}
                className="text-sm font-semibold text-slate-600 hover:text-slate-950"
              >
                Change number
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={resendOtp}
                className="text-sm font-semibold text-green-700 hover:text-green-800 disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        <p className="mt-7 text-center text-xs leading-5 text-slate-500">
          Your phone number must be verified before you can
          access tasks or withdrawals.
        </p>
      </section>
    </main>
  );
}