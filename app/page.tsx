import Link from 'next/link';
import {
  FiArrowRight,
  FiCheckCircle,
  FiDollarSign,
  FiFileText,
  FiMenu,
  FiShield,
  FiSmartphone,
  FiUsers,
  FiWallet,
} from 'react-icons/fi';
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const steps = [
  {
    title: 'Verify your phone',
    description:
      'Create your Task Money account using a valid Nigerian phone number and SMS verification.',
    icon: FiSmartphone,
  },
  {
    title: 'Complete available tasks',
    description:
      'Choose approved social, review, website and community tasks that match your account.',
    icon: FiFileText,
  },
  {
    title: 'Submit valid proof',
    description:
      'Upload the required screenshot, link, video or other evidence for administrator review.',
    icon: FiCheckCircle,
  },
  {
    title: 'Receive your earnings',
    description:
      'Approved rewards are recorded in your Task Money wallet and can be withdrawn.',
    icon: FiWallet,
  },
];

const features = [
  {
    title: 'Verified accounts',
    description:
      'Phone verification, device tracking and security controls help reduce duplicate and fraudulent accounts.',
    icon: FiShield,
  },
  {
    title: 'Real task rewards',
    description:
      'Every active task clearly displays its reward, requirements, remaining slots and proof instructions.',
    icon: FiDollarSign,
  },
  {
    title: 'Transparent review',
    description:
      'Workers can track reserved, submitted, approved and rejected tasks from their dashboard.',
    icon: FiCheckCircle,
  },
  {
    title: 'Wallet management',
    description:
      'View available balance, pending earnings, transaction records and withdrawal requests.',
    icon: FiWallet,
  },
  {
    title: 'Multiple task platforms',
    description:
      'Support for Facebook, Instagram, WhatsApp, Telegram, YouTube, TikTok, X and more.',
    icon: FiSmartphone,
  },
  {
    title: 'Administrator oversight',
    description:
      'Task creation, proof moderation, user controls, finance review and audit tools are managed securely.',
    icon: FiUsers,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-xl font-black text-white shadow-lg shadow-green-600/20">
              ₦
            </div>

            <div>
              <p className="text-lg font-black">
                Task Money
              </p>

              <p className="text-[11px] text-slate-500">
                Complete tasks. Earn.
              </p>
            </div>
          </Link>

          <nav className="ml-auto hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a
              href="#how-it-works"
              className="transition hover:text-green-700"
            >
              How it works
            </a>

            <a
              href="#features"
              className="transition hover:text-green-700"
            >
              Features
            </a>

            <a
              href="#security"
              className="transition hover:text-green-700"
            >
              Security
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-3 md:ml-8">
            <Link
              href="/login"
              className="hidden rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-green-600 hover:text-green-700 sm:inline-flex"
            >
              Sign in
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
            >
              Get started
              <FiArrowRight />
            </Link>

            <button
              type="button"
              aria-label="Open navigation"
              className="rounded-xl border border-slate-200 p-2.5 md:hidden"
            >
              <FiMenu />
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.3),transparent_30rem)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-sm font-semibold text-green-300">
              <FiShield />
              Verified task and earning platform
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.05] sm:text-6xl lg:text-7xl">
              Complete online tasks.
              <span className="block text-green-400">
                Earn real rewards.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              Task Money connects verified workers with approved
              digital tasks. Complete the instructions, submit
              valid proof and track your earnings from one secure
              dashboard.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-green-400"
              >
                Create verified account
                <FiArrowRight />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-bold text-white transition hover:bg-white/10"
              >
                See how it works
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <FiCheckCircle className="text-green-400" />
                Verified phone registration
              </span>

              <span className="flex items-center gap-2">
                <FiCheckCircle className="text-green-400" />
                Transparent task rewards
              </span>

              <span className="flex items-center gap-2">
                <FiCheckCircle className="text-green-400" />
                Secure wallet records
              </span>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute h-80 w-80 rounded-full bg-green-500/20 blur-3xl" />

            <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
              <div className="rounded-2xl bg-white p-5 text-slate-950">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Task Money
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      Worker dashboard
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-xl font-black text-green-700">
                    ₦
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-950 p-4 text-white">
                    <p className="text-xs text-slate-400">
                      Wallet balance
                    </p>

                    <p className="mt-2 text-xl font-black">
                      Live account value
                    </p>
                  </div>

                  <div className="rounded-2xl bg-green-50 p-4">
                    <p className="text-xs text-green-700">
                      Available tasks
                    </p>

                    <p className="mt-2 text-xl font-black text-green-950">
                      Updated from database
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <FaFacebook />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        Social engagement task
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Instructions, reward and proof requirements
                      </p>
                    </div>

                    <FiArrowRight className="text-slate-400" />
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-700">
                      <FaYoutube />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        Video platform task
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Complete the action and upload valid proof
                      </p>
                    </div>

                    <FiArrowRight className="text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-4 text-2xl text-white/80">
                <FaFacebook />
                <FaXTwitter />
                <FaInstagram />
                <FaYoutube />
                <FaTiktok />
                <FaTelegram />
                <FaWhatsapp />
                <FaLinkedin />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-slate-50 py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-600">
              How it works
            </p>

            <h2 className="mt-4 text-4xl font-black">
              Start earning in four steps
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Task Money provides a structured process for
              account verification, task completion, proof review
              and wallet payment.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="text-3xl font-black text-slate-100">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-black">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-600">
              Platform features
            </p>

            <h2 className="mt-4 text-4xl font-black">
              Everything needed to manage tasks and earnings
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              The platform combines task discovery, proof review,
              wallet records, withdrawals and account security.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-6 text-xl font-black">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="security"
        className="bg-slate-950 py-20 text-white"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-400">
              Security
            </p>

            <h2 className="mt-4 text-4xl font-black">
              Built around verified users and accountable activity
            </h2>

            <p className="mt-5 max-w-xl leading-8 text-slate-300">
              Task Money verifies phone ownership and can record
              device, login and network information for fraud
              prevention, account protection and administrative
              review.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-green-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-green-400"
            >
              Verify your account
              <FiArrowRight />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              'SMS phone verification',
              'Duplicate phone prevention',
              'Device fingerprint monitoring',
              'IP and login history',
              'Administrator account controls',
              'Proof and withdrawal review',
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />

                <span className="text-sm leading-6 text-slate-200">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-green-600 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <h2 className="text-3xl font-black">
              Ready to start completing tasks?
            </h2>

            <p className="mt-3 text-green-50">
              Create a verified account and access the Task Money
              worker dashboard.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 font-bold text-white transition hover:bg-slate-900"
          >
            Create account
            <FiArrowRight />
          </Link>
        </div>
      </section>

      <footer className="bg-[#071421] py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-lg font-black">
              ₦
            </div>

            <div>
              <p className="font-black">
                Task Money
              </p>

              <p className="text-xs text-slate-400">
                Complete tasks. Earn.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xl text-slate-300">
            <FaFacebook />
            <FaXTwitter />
            <FaInstagram />
            <FaYoutube />
            <FaTiktok />
            <FaTelegram />
            <FaWhatsapp />
            <FaLinkedin />
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Task Money. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}