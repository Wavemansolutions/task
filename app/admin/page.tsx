import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { FiBriefcase, FiDollarSign, FiFileText, FiUsers } from 'react-icons/fi';

export default function AdminOverviewPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Administration"
          title="Admin Overview"
          description="Monitor users, tasks, proofs and withdrawals."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Registered users" value="1,248" icon={<FiUsers className="h-6 w-6" />} />
          <StatCard label="Active tasks" value="34" icon={<FiBriefcase className="h-6 w-6" />} />
          <StatCard label="Proofs pending" value="82" icon={<FiFileText className="h-6 w-6" />} />
          <StatCard label="Withdrawals pending" value="₦286,500" icon={<FiDollarSign className="h-6 w-6" />} />
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          {['Recent user registrations', 'Latest task activity'].map((title) => (
            <div key={title} className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="font-black">{title}</h2>
              <div className="mt-5 space-y-3">
                {[1,2,3,4].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <div>
                      <p className="font-semibold">Activity item {item}</p>
                      <p className="text-xs text-slate-500">A few minutes ago</p>
                    </div>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Active</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
