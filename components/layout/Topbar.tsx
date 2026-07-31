'use client';

import Link from 'next/link';
import { FiBell, FiMenu, FiMoon, FiSearch } from 'react-icons/fi';

export function Topbar({
  onMenu,
  userName,
  userRole,
}: {
  onMenu: () => void;
  userName: string;
  userRole: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} className="rounded-xl border border-slate-200 p-2.5 lg:hidden">
          <FiMenu className="h-5 w-5" />
        </button>

        <div className="relative hidden max-w-sm flex-1 md:block">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search tasks, tickets or activity"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-green-500 focus:bg-white"
          />
        </div>

        <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold text-slate-600 xl:flex">
          <Link href="/dashboard" className="hover:text-green-600">Dashboard</Link>
          <Link href="/tasks" className="hover:text-green-600">Tasks</Link>
          <Link href="/earnings" className="hover:text-green-600">Earnings</Link>
          <Link href="/wallet" className="hover:text-green-600">Wallet</Link>
          <Link href="/referrals" className="hover:text-green-600">Referrals</Link>
          <Link href="/support" className="hover:text-green-600">Support</Link>
        </nav>

        <button type="button" className="ml-auto rounded-xl p-2.5 hover:bg-slate-100 xl:ml-2">
          <FiMoon className="h-5 w-5" />
        </button>
        <Link href="/notifications" className="relative rounded-xl p-2.5 hover:bg-slate-100">
          <FiBell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-500 text-xs font-black text-slate-800">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="max-w-32 truncate text-sm font-semibold">{userName}</p>
            <p className="text-xs capitalize text-slate-500">{userRole.replaceAll('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
