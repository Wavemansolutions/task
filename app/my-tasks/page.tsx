import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FiCheckCircle, FiClock, FiEye, FiUpload } from 'react-icons/fi';

const rows = [
  { title: 'Like and share Facebook post', status: 'reserved', reward: 50, due: '2h 14m' },
  { title: 'Follow Instagram account', status: 'submitted', reward: 50, due: 'Under review' },
  { title: 'Join Telegram channel', status: 'approved', reward: 50, due: 'Completed' },
];

export default function MyTasksPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Your work"
          title="My Tasks"
          description="Track reserved, submitted and completed tasks."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Reserved', '1', <FiClock key="1" className="h-6 w-6" />],
            ['Submitted', '1', <FiUpload key="2" className="h-6 w-6" />],
            ['Approved', '1', <FiCheckCircle key="3" className="h-6 w-6" />],
          ].map(([label, value, icon]) => (
            <div key={String(label)} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-black">{value}</p>
                </div>
                <div className="rounded-xl bg-green-50 p-3 text-green-600">{icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-black">Task activity</h2>
          </div>
          <div className="divide-y">
            {rows.map((row) => (
              <div key={row.title} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold">{row.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{row.due}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize">{row.status}</span>
                  <span className="font-black">₦{row.reward}</span>
                  <button className="rounded-lg border p-2"><FiEye /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
