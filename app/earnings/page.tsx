import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { FiArrowDownLeft, FiArrowUpRight, FiDollarSign, FiTrendingUp } from 'react-icons/fi';

export default function EarningsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Income"
          title="Earnings"
          description="Review your approved task income and payment history."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total earned" value="₦18,450" icon={<FiDollarSign className="h-6 w-6" />} />
          <StatCard label="This month" value="₦6,900" icon={<FiTrendingUp className="h-6 w-6" />} />
          <StatCard label="Pending" value="₦350" icon={<FiArrowDownLeft className="h-6 w-6" />} />
          <StatCard label="Withdrawn" value="₦12,000" icon={<FiArrowUpRight className="h-6 w-6" />} />
        </div>

        <div className="mt-7 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black">Recent earnings</h2>
          <div className="mt-5 space-y-4">
            {[
              ['YouTube subscription task', '+₦100', 'Approved'],
              ['Facebook like and share', '+₦50', 'Approved'],
              ['Instagram follow task', '+₦50', 'Pending'],
            ].map(([title, amount, status]) => (
              <div key={title} className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-xs text-slate-500">{status}</p>
                </div>
                <span className="font-black text-green-700">{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
