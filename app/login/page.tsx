'use client';

import {
  FormEvent,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiUser,
} from 'react-icons/fi';

import { normalizeNigerianPhone } from '@/lib/phone';
import { createClient } from '@/utils/supabase/client';

type LoginStage = 'phone' | 'otp';

type UnknownErrorRecord = {
  message?: unknown;
  error?: unknown;
  error_description?: unknown;
  msg?: unknown;
  details?: unknown;
  code?: unknown;
  status?: unknown;
};

function getAuthErrorMessage(
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

    for (const possibleMessage of possibleMessages) {
      if (
        typeof possibleMessage === 'string' &&
        possibleMessage.trim()
      ) {
        return possibleMessage;
      }
    }

    const details = [
      record.code
        ? `Code: ${String(record.code)}`
        : null,

      record.status
        ? `Status: ${String(record.status)}`
        : null,
    ]
      .filter(Boolean)
      .join(' · ');

    if (details) {
      return `Unable to process the OTP request. ${details}`;
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

  const [fullName, setFullName] =
    useState('');

  const [phoneInput, setPhoneInput] =
    useState('');

  const [
    normalizedPhone,
    setNormalizedPhone,
  ] = useState('');

  const [otp, setOtp] =
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
    setMessage('');
    setError('');

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

      console.info(
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

      console.info(
        'PHONE_OTP_REQUEST_RESULT',
        {
          hasData: Boolean(data),

          errorMessage:
            otpError?.message ?? null,

          errorCode:
            otpError?.code ?? null,

          errorStatus:
            otpError?.status ?? null,
        },
      );

      if (otpError) {
        setError(
          getAuthErrorMessage(
            otpError,
            'Unable to send the verification code.',
          ),
        );

        return;
      }

      setNormalizedPhone(phone);
      setOtp('');
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
        getAuthErrorMessage(
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
    setMessage('');
    setError('');

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
          phone:
            normalizedPhone,

          token:
            otp,

          type:
            'sms',
        });

      if (verifyError) {
        throw new Error(
          verifyError.message ||
            'The verification code is invalid or expired.',
        );
      }

      const user =
        data.user;

      if (!user) {
        throw new Error(
          'Verification succeeded, but the user account could not be loaded.',
        );
      }

      const metadataName =
        typeof user.user_metadata
          ?.full_name === 'string'
          ? user.user_metadata.full_name.trim()
          : '';

      const selectedName =
        fullName.trim() ||
        metadataName ||
        'Task Money User';

      const {
        error: profileError,
      } =
        await supabase
          .from('profiles')
          .upsert(
            {
              id:
                user.id,

              full_name:
                selectedName,

              phone:
                normalizedPhone,

              phone_verified:
                true,
            },

            {
              onConflict:
                'id',
            },
          );

      if (profileError) {
        throw new Error(
          profileError.message ||
            'The verified profile could not be saved.',
        );
      }

      router.replace(
        '/dashboard',
      );

      router.refresh();
    } catch (verifyError: unknown) {
      console.error(
        'VERIFY_PHONE_OTP_ERROR',
        verifyError,
      );

      setError(
        getAuthErrorMessage(
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
    setMessage('');
    setError('');

    try {
      const {
        error: resendError,
      } =
        await supabase.auth.signInWithOtp(
          {
            phone:
              normalizedPhone,

            options: {
              shouldCreateUser:
                true,

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
    } catch (resendError: unknown) {
      console.error(
        'RESEND_PHONE_OTP_ERROR',
        resendError,
      );

      setError(
        getAuthErrorMessage(
          resendError,
          'Unable to resend the verification code.',
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
    setMessage('');
    setError('');
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.1fr_.9fr]">
        <section className="hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-green-700 p-10 lg:flex lg:flex-col lg:justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            <FiArrowLeft />
            Back to home
          </Link>

          <div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 text-3xl font-black shadow-xl shadow-green-950/30">
              ₦
            </div>

            <h1 className="mt-8 max-w-lg text-5xl font-black leading-tight">
              Complete verified tasks and earn with Task Money.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
              Register with a verified Nigerian phone number,
              complete approved online tasks and receive your
              earnings through your Task Money wallet.
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="h-5 w-5 text-green-300" />
                <span>Verified phone registration</span>
              </div>

              <div className="flex items-center gap-3">
                <FiCheckCircle className="h-5 w-5 text-green-300" />
                <span>Real task and proof review system</span>
              </div>

              <div className="flex items-center gap-3">
                <FiCheckCircle className="h-5 w-5 text-green-300" />
                <span>Secure wallet and withdrawal management</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/50">
            Your phone and device information may be recorded
            for account security and fraud prevention.
          </p>
        </section>

        <section className="flex items-center justify-center bg-white p-6 text-slate-950 sm:p-10">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950 lg:hidden"
            >
              <FiArrowLeft />
              Back to home
            </Link>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-2xl font-black text-white shadow-lg shadow-green-600/20">
                ₦
              </div>

              <h2 className="mt-5 text-3xl font-black">
                Task Money
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {stage === 'phone'
                  ? 'Enter your phone number to continue.'
                  : 'Enter the SMS verification code.'}
              </p>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-6 break-words rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
              >
                {error}
              </div>
            ) : null}

            {message ? (
              <div
                role="status"
                className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-700"
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

                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

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
                      autoComplete="name"
                      placeholder="Your full name"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
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
                      placeholder="08136963037"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
                    />
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Nigerian formats such as 08136963037 and
                    +2348136963037 are accepted.
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
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">
                    Code sent to
                  </p>

                  <p className="mt-1 font-bold text-slate-950">
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-2xl font-black tracking-[0.45em] outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:bg-slate-100"
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

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={changeNumber}
                    disabled={loading}
                    className="text-sm font-semibold text-slate-600 transition hover:text-slate-950 disabled:opacity-50"
                  >
                    Change number
                  </button>

                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={loading}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800 disabled:opacity-50"
                  >
                    <FiRefreshCw />
                    Resend code
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <FiShield className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

              <p className="text-xs leading-5 text-slate-500">
                Your phone number must be verified before you can
                access tasks, wallet services or withdrawals.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}