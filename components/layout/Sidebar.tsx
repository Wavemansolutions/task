'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiActivity,
  FiBarChart2,
  FiBriefcase,
  FiCheckSquare,
  FiDollarSign,
  FiGrid,
  FiHeadphones,
  FiHome,
  FiPlusCircle,
  FiShield,
  FiUsers,
  FiCreditCard,
  FiX,
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

const mainLinks = [
  ['/dashboard', 'Dashboard', FiHome],
  ['/tasks', 'Tasks', FiBriefcase],
  ['/my-tasks', 'My Tasks', FiCheckSquare],
  ['/earnings', 'Earnings', FiDollarSign],
  ['/wallet', 'Wallet', FiCreditCard],
  ['/referrals', 'Referrals', FiUsers],
  ['/support', 'Support', FiHeadphones],
] as const;

const adminLinks = [
  ['/admin', 'Overview', FiGrid],
  ['/admin/users', 'Users', FiUsers],
  ['/admin/tasks', 'Tasks', FiBriefcase],
  ['/admin/tasks/new', 'Create Task', FiPlusCircle],
  ['/admin/proofs', 'Proofs', FiShield],
  ['/admin/finance/withdrawals', 'Withdrawals', FiDollarSign],
  ['/admin/analytics', 'Analytics', FiBarChart2],
  ['/admin/activity', 'Activity', FiActivity],
] as const;

export function Sidebar({
  open,
  onClose,
  userName,
  userRole,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  userName: string;
  userRole: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  const renderLink = (item: readonly [string, string, React.ComponentType<{ className?: string }>]) => {
    const [href, label, Icon] = item;
    const active = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));

    return (
      <Link
        key={href}
        href={href}
        onClick={onClose}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active
            ? 'bg-green-600 text-white shadow-sm shadow-green-950/20'
            : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/45 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#071421] text-white shadow-2xl transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-green-300 to-green-600 text-xl font-black shadow-lg shadow-green-900/30">
              ₦
            </div>
            <div>
              <div className="text-lg font-extrabold">Task Money</div>
              <div className="text-[11px] text-slate-400">Complete tasks. Earn.</div>
            </div>
          </Link>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10 lg:hidden">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="tm-scrollbar flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Main</p>
          <nav className="space-y-1">{mainLinks.map(renderLink)}</nav>

          {isAdmin ? (
            <>
              <p className="mb-2 mt-7 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Admin</p>
              <nav className="space-y-1">{adminLinks.map(renderLink)}</nav>
            </>
          ) : null}
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-black text-slate-700">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{userName}</p>
              <p className="truncate text-xs capitalize text-slate-400">{userRole.replaceAll('_', ' ')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-lg text-slate-300">
            <FaFacebook /><FaXTwitter /><FaInstagram /><FaYoutube /><FaTiktok /><FaTelegram /><FaWhatsapp /><FaLinkedin />
          </div>
        </div>
      </aside>
    </>
  );
}
