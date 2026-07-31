import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTelegram, FaTiktok, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { FiClock, FiShield } from 'react-icons/fi';

const config: Record<string, { Icon: React.ComponentType; bg: string; label: string }> = {
  facebook: { Icon: FaFacebook, bg: 'from-blue-800 to-blue-500', label: 'Facebook' },
  instagram: { Icon: FaInstagram, bg: 'from-purple-700 via-pink-600 to-orange-400', label: 'Instagram' },
  x: { Icon: FaXTwitter, bg: 'from-black to-slate-700', label: 'X' },
  youtube: { Icon: FaYoutube, bg: 'from-red-700 to-red-500', label: 'YouTube' },
  tiktok: { Icon: FaTiktok, bg: 'from-slate-950 to-slate-700', label: 'TikTok' },
  telegram: { Icon: FaTelegram, bg: 'from-sky-600 to-blue-400', label: 'Telegram' },
  whatsapp: { Icon: FaWhatsapp, bg: 'from-green-700 to-green-500', label: 'WhatsApp' },
};

export function SocialTaskCard({
  id, platform, title, action, reward, slots, type, time,
}: {
  id: string; platform: string; title: string; action: string; reward: number; slots: number; type?: string; time?: string;
}) {
  const selected = config[platform] ?? config.facebook;
  const Icon = selected.Icon;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className={`relative min-h-44 overflow-hidden bg-gradient-to-br ${selected.bg} p-5 text-white`}>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 right-8 h-32 w-32 rounded-full bg-black/10" />
        <div className="relative flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur"><Icon /></div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">{selected.label}</span>
        </div>
        <div className="relative mt-8">
          <p className="text-2xl font-black uppercase leading-tight">{action}</p>
          <p className="mt-1 text-sm text-white/80">Complete task and earn money</p>
        </div>
      </div>
      <div className="p-5">
        <h3 className="line-clamp-2 min-h-12 font-bold text-slate-900">{title}</h3>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-black">₦{reward.toLocaleString('en-NG')}</span>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{slots} slots left</span>
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs capitalize text-slate-500">
          <span className="flex items-center gap-1"><FiShield /> {type ?? 'general'}</span>
          <span className="flex items-center gap-1"><FiClock /> {time ?? '60 min'}</span>
        </div>
        <Link href={`/tasks/${id}`} className="mt-5 block rounded-xl border border-green-600 px-4 py-2.5 text-center text-sm font-bold text-green-700 transition hover:bg-green-600 hover:text-white">View Task</Link>
      </div>
    </article>
  );
}
