import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FiCopy, FiGift, FiShare2, FiUsers } from 'react-icons/fi';

export default function ReferralsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Invite and earn"
          title="Referrals"
          description="Share your link and earn bonuses when invited users become active."
        />

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-3xl bg-gradient-to-br from-green-700 to-green-500 p-7 text-white shadow-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <FiGift className="h-7 w-7" />
            </div>
            <h2 className="mt-7 text-3xl font-black">Invite friends. Earn together.</h2>
            <p className="mt-3 max-w-xl text-white/80">
              Share your personal referral link through WhatsApp, Facebook, X, Telegram or any other channel.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value="https://taskmoney.ng/ref/WAVEMAN"
                className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-sm text-slate-900"
              />
              <button className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold">
                <FiCopy /> Copy
              </button>
              <button className="flex items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-3 font-bold">
                <FiShare2 /> Share
              </button>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-7 shadow-sm">
            <FiUsers className="h-8 w-8 text-green-600" />
            <p className="mt-6 text-sm text-slate-500">Total referrals</p>
            <p className="mt-2 text-4xl font-black">24</p>
            <p className="mt-7 text-sm text-slate-500">Referral earnings</p>
            <p className="mt-2 text-3xl font-black text-green-700">₦3,600</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
