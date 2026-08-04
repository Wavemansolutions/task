import Image from 'next/image';
import Link from 'next/link';
import {
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiGift,
  FiPlayCircle,
  FiShield,
  FiUser,
  FiCreditCard,
} from 'react-icons/fi';
import {
  FaFacebook,
  FaInstagram,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const taskCategories = [
  {
    name: 'Facebook Tasks',
    description: 'Like pages, posts, join groups and more.',
    earning: 'Social engagement',
    icon: FaFacebook,
    iconClass: 'bg-blue-100 text-blue-600',
    badgeClass: 'bg-blue-50 text-blue-700',
  },
  {
    name: 'TikTok Tasks',
    description: 'Watch videos, like, follow and share.',
    earning: 'Video engagement',
    icon: FaTiktok,
    iconClass: 'bg-slate-950 text-white',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  {
    name: 'Instagram Tasks',
    description: 'Follow, like, comment and view stories.',
    earning: 'Creator engagement',
    icon: FaInstagram,
    iconClass: 'bg-pink-100 text-pink-600',
    badgeClass: 'bg-pink-50 text-pink-700',
  },
  {
    name: 'WhatsApp Tasks',
    description: 'Join channels, groups, share and invite.',
    earning: 'Community tasks',
    icon: FaWhatsapp,
    iconClass: 'bg-green-100 text-green-600',
    badgeClass: 'bg-green-50 text-green-700',
  },
  {
    name: 'YouTube Tasks',
    description: 'Watch videos, like, subscribe and share.',
    earning: 'Video tasks',
    icon: FaYoutube,
    iconClass: 'bg-red-100 text-red-600',
    badgeClass: 'bg-red-50 text-red-700',
  },
  {
    name: 'Telegram Tasks',
    description: 'Join channels, view posts and invite.',
    earning: 'Channel tasks',
    icon: FaTelegram,
    iconClass: 'bg-sky-100 text-sky-600',
    badgeClass: 'bg-sky-50 text-sky-700',
  },
  {
    name: 'X Tasks',
    description: 'Follow, repost, like and engage.',
    earning: 'Social tasks',
    icon: FaXTwitter,
    iconClass: 'bg-slate-100 text-slate-950',
    badgeClass: 'bg-violet-50 text-violet-700',
  },
];

const steps = [
  {
    title: 'Sign Up',
    description: 'Create your free account with a verified phone number.',
    icon: FiUser,
  },
  {
    title: 'Complete Tasks',
    description: 'Choose available tasks and follow the instructions.',
    icon: FiCheck,
  },
  {
    title: 'Get Paid',
    description: 'Approved rewards are added to your wallet.',
    icon: FiCreditCard,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#061019]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500 text-2xl font-black text-[#061019]">
              ₦
            </div>
            <span className="text-xl font-black">Task Money</span>
          </Link>

          <nav className="ml-auto hidden items-center gap-8 text-sm font-semibold text-slate-200 lg:flex">
            <a href="#home" className="border-b-2 border-green-400 py-7 text-white">Home</a>
            <a href="#how-it-works" className="transition hover:text-green-400">How It Works</a>
            <a href="#tasks" className="transition hover:text-green-400">Tasks</a>
            <a href="#security" className="transition hover:text-green-400">Security</a>
            <a href="#contact" className="transition hover:text-green-400">Contact</a>
          </nav>

          <div className="ml-auto flex items-center gap-3 lg:ml-8">
            <Link href="/login" className="hidden rounded-xl border border-white/30 px-5 py-2.5 text-sm font-bold transition hover:bg-white/10 sm:inline-flex">
              Log In
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-bold text-[#061019] transition hover:bg-green-400">
              Sign Up <FiArrowRight />
            </Link>
          </div>
        </div>
      </header>

      <section id="home" className="relative overflow-hidden bg-[#061019] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(34,197,94,.28),transparent_32rem)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300">
              <FiCheckCircle /> Verified task platform
            </div>
            <h1 className="mt-7 text-5xl font-black leading-[1.08] sm:text-6xl">
              Complete Simple Tasks.
              <span className="block text-green-400">Earn Real Money.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Join Task Money, complete approved online tasks, submit valid proof and track your earnings securely from one dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-7 py-3.5 font-black text-[#061019] transition hover:bg-green-400">
                Get Started Free <FiArrowRight />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 font-bold transition hover:bg-white/10">
                How It Works <FiPlayCircle />
              </a>
            </div>

            <div className="mt-10 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Free to join', 'No registration fee'],
                ['Secure wallet', 'Track every reward'],
                ['Verified tasks', 'Clear instructions'],
                ['Support', 'Help when needed'],
              ].map(([title, text]) => (
                <div key={title} className="flex gap-3">
                  <FiShield className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="mt-1 text-xs text-slate-400">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute h-80 w-80 rounded-full bg-green-500/20 blur-3xl" />
            <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-green-950/30">
              <Image
                src="/task-money-landing-showcase.png"
                alt="Task Money platform preview"
                width={1536}
                height={1024}
                priority
                className="h-auto w-full rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="tasks" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-black sm:text-4xl">Popular Task Categories</h2>
            <p className="mt-3 text-slate-600">Choose from different social and digital task types.</p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {taskCategories.map((task) => {
              const Icon = task.icon;
              return (
                <article key={task.name} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${task.iconClass}`}>
                    <Icon />
                  </div>
                  <h3 className="mt-4 font-black">{task.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{task.description}</p>
                  <span className={`mt-4 inline-flex rounded-lg px-3 py-1 text-[11px] font-bold ${task.badgeClass}`}>
                    {task.earning}
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-black sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-slate-600">Start earning in three clear steps.</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <span className="absolute right-5 top-4 text-5xl font-black text-slate-100">0{index + 1}</span>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 text-xl font-black">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="security" className="bg-green-50 py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-7 rounded-3xl border border-green-100 bg-white px-7 py-8 shadow-sm sm:px-10 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <FiGift className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Ready to Start Earning?</h2>
              <p className="mt-2 text-slate-600">Create your verified Task Money account and browse available tasks.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700">
              Sign Up Now <FiArrowRight />
            </Link>
            <a href="#tasks" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50">
              Learn More
            </a>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-[#061019] py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-lg font-black text-[#061019]">₦</div>
            <span className="font-black">Task Money</span>
          </div>
          <div className="flex items-center gap-4 text-xl text-slate-300">
            <FaFacebook />
            <FaXTwitter />
            <FaInstagram />
            <FaYoutube />
            <FaTiktok />
            <FaTelegram />
            <FaWhatsapp />
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Task Money. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
