import Link from 'next/link';
import { FiClock, FiEye, FiShield } from 'react-icons/fi';
import { generatedTaskThumbnail } from '@/lib/task-platform';

export function SocialTaskCard({
  id,
  platform,
  title,
  action,
  reward,
  slots,
  type,
  time,
  thumbnailUrl,
}: {
  id: string;
  platform: string;
  title: string;
  action: string;
  reward: number;
  slots: number;
  type?: string;
  time?: string;
  thumbnailUrl?: string | null;
}) {
  const src = thumbnailUrl || generatedTaskThumbnail(platform);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/tasks/${id}`} className="relative block aspect-[16/9] overflow-hidden bg-slate-900">
        <img
          src={src}
          alt={`${platform} task thumbnail`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold capitalize text-white backdrop-blur">
          {platform}
        </span>
      </Link>

      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-green-600">{action}</p>
        <h3 className="mt-2 line-clamp-2 min-h-12 font-bold text-slate-900">{title}</h3>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-black">₦{reward.toLocaleString('en-NG')}</span>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{slots} slots left</span>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs capitalize text-slate-500">
          <span className="flex items-center gap-1"><FiShield /> {type ?? 'general'}</span>
          <span className="flex items-center gap-1"><FiClock /> {time ?? '60 min'}</span>
        </div>

        <Link href={`/tasks/${id}`} className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-green-600 px-4 py-2.5 text-center text-sm font-bold text-green-700 transition hover:bg-green-600 hover:text-white">
          <FiEye /> View task
        </Link>
      </div>
    </article>
  );
}
