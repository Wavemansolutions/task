'use client';

import {
  FormEvent,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import { normalizeNigerianPhone } from '@/lib/phone';
import { createClient } from '@/utils/supabase/client';

type LoginStage = 'phone' | 'otp';

type UnknownErrorRecord = {
  message?: unknown;
  error?: unknown;
  error_description?: unknown;
  msg?: unknown;
  details?: unknown;
  status?: unknown;
  code?: unknown;
};

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string') {
    return error || fallback;
  }

  if (
    typeof error === 'object' &&
    error !== null
  ) {
    const record =
      error as UnknownErrorRecord;

    const possibleMessages = [
      record.message,
      record.error_description,
      record.error,
      record.msg,
      record.details,
    ];

    for (const value of possibleMessages) {
      if (
        typeof value === 'string' &&
        value.trim()
      ) {
        return value;
      }
    }

    try {
      const serialized =
        JSON.stringify(error);

      if (
        serialized &&
        serialized !== '{}'
      ) {
        return serialized;
      }
    } catch {
      // Ignore serialization failure.
    }
  }

  return fallback;
}

export default function LoginPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [stage, setStage] =
    useState<LoginStage>('phone');

  const [phoneInput, setPhoneInput] =
    useState('');

  const [
    normalizedPhone,
    setNormalizedPhone,
  ] = useState('');

  const [otp, setOtp] = useState('');
  const [fullName, setFullName] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  async function sendOtp(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const trimmedName =
        fullName.trim();

      if (trimmedName.length < 2) {
        throw new Error(
          'Enter your full name.',
        );
      }

      const phone =
        normalizeNigerianPhone(
          phoneInput,
        );

      console.log(
        'REQUESTING_PHONE_OTP',
        {
          phoneLastFour:
            phone.slice(-4),
        },
      );

      const {
        data,
        error: otpError,
      } =
        await supabase.auth.signInWithOtp(
          {
            phone,
            options: {
              shouldCreateUser: true,
              data: {
                full_name:
                  trimmedName,
              },
            },
          },
        );

      console.log(
        'PHONE_OTP_RESULT',
        {
          hasData: Boolean(data),
          errorMessage:
            otpError?.message ?? null,
          errorStatus:
            otpError?.status ?? null,
          errorCode:
            otpError?.code ?? null,
        },
      );

      if (otpError) {
        throw new Error(
          otpError.message ||
            'Supabase could not send the verification code.',
        );
      }

      setNormalizedPhone(phone);
      setStage('otp');

      setMessage(
        `A verification code was sent to ${phone}.`,
      );
    } catch (sendError: unknown) {
      console.error(
        'SEND_PHONE_OTP_ERROR',
        sendError,
      );

      setError(
        getErrorMessage(
          sendError,
          'Unable to send the verification code. Check the SMS gateway and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (!normalizedPhone) {
        throw new Error(
          'Enter your phone number again.',
        );
      }

      if (!/^\d{6}$/.test(otp)) {
        throw new Error(
          'Enter the six-digit verification code.',
        );
      }

      const {
        data,
        error: verifyError,
      } =
        await supabase.auth.verifyOtp({
          phone: normalizedPhone,
          token: otp,
          type: 'sms',
        });

      if (verifyError) {
        throw new Error(
          verifyError.message ||
            'The verification code is invalid or expired.',
        );
      }

      const user = data.user;

      if (!user) {
        throw new Error(
          'Phone verification succeeded, but the account could not be loaded.',
        );
      }

      const nameFromMetadata =
        typeof user.user_metadata
          ?.full_name === 'string'
          ? user.user_metadata.full_name.trim()
          : '';

      const selectedName =
        fullName.trim() ||
        nameFromMetadata ||
        'Task Money User';

      const {
        error: profileError,
      } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            full_name: selectedName,
            phone: normalizedPhone,
            phone_verified: true,
          },
          {
            onConflict: 'id',
          },
        );

      if (profileError) {
        throw new Error(
          profileError.message ||
            'The verified profile could not be saved.',
        );
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (
      verifyError: unknown
    ) {
      console.error(
        'VERIFY_PHONE_OTP_ERROR',
        verifyError,
      );

      setError(
        getErrorMessage(
          verifyError,
          'The verification code could not be confirmed.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!normalizedPhone) {
      setStage('phone');
      setError(
        'Enter your phone number again.',
      );
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const {
        error: resendError,
      } =
        await supabase.auth.signInWithOtp(
          {
            phone:
              normalizedPhone,
            options: {
              shouldCreateUser: true,
              data: {
                full_name:
                  fullName.trim() ||
                  null,
              },
            },
          },
        );

      if (resendError) {
        throw new Error(
          resendError.message ||
            'Unable to resend the verification code.',
        );
      }

      setOtp('');

      setMessage(
        'A new verification code was sent.',
      );
    } catch (
      resendError: unknown
    ) {
      console.error(
        'RESEND_PHONE_OTP_ERROR',
        resendError,
      );

      setError(
        getErrorMessage(
          resendError,
          'Unable to resend the code. Check the SMS gateway and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function changeNumber() {
    setStage('phone');
    setOtp('');
    setNormalizedPhone('');
    setError('');
    setMessage('');
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
          <div
            role="alert"
            className="mt-6 break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
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
                  setFullName(
                    event.target.value,
                  )
                }
                type="text"
                required
                minLength={2}
                placeholder="Your full name"
                autoComplete="name"
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Phone number
              </span>

              <input
                value={phoneInput}
                onChange={(event) =>
                  setPhoneInput(
                    event.target.value,
                  )
                }
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                placeholder="08012345678"
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Nigerian formats such as
                08012345678 and
                +2348012345678 are accepted.
              </p>
            </label>

            <button
              type="submit"
              disabled={
                loading ||
                !fullName.trim() ||
                !phoneInput.trim()
              }
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
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-2xl font-black tracking-[0.45em] outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>

            <button
              type="submit"
              disabled={
                loading ||
                otp.length !== 6
              }
              className="w-full rounded-xl bg-green-600 px-5 py-3.5 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Verifying...'
                : 'Verify and sign in'}
            </button>

            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={changeNumber}
                disabled={loading}
                className="text-sm font-semibold text-slate-600 hover:text-slate-950 disabled:opacity-50"
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
          Your phone number must be
          verified before you can access
          tasks or withdrawals.
        </p>
      </section>
    </main>
  );
}