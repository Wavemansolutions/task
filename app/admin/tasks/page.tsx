import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import { FiEdit2, FiEye, FiMoreVertical, FiPlus } from 'react-icons/fi';

const tasks = [
  ['Like and share Facebook post', 'Facebook', '₦50', 'Active', '20'],
  ['Subscribe to YouTube channel', 'YouTube', '₦100', 'Active', '10'],
  ['Join Telegram channel', 'Telegram', '₦50', 'Paused', '20'],
];

export default function AdminTasksPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Task management"
          title="All Tasks"
          description="Create, edit, pause and review platform tasks."
          action={
            <Link href="/admin/tasks/new" className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white">
              <FiPlus /> Create Task
            </Link>
          }
        />

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Task</th>
                  <th className="px-5 py-4">Platform</th>
                  <th className="px-5 py-4">Reward</th>
                  <th className="px-5 py-4">Slots</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tasks.map(([title, platform, reward, status, slots]) => (
                  <tr key={title}>
                    <td className="px-5 py-4 font-bold">{title}</td>
                    <td className="px-5 py-4">{platform}</td>
                    <td className="px-5 py-4 font-bold">{reward}</td>
                    <td className="px-5 py-4">{slots}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-lg border p-2"><FiEye /></button>
                        <button className="rounded-lg border p-2"><FiEdit2 /></button>
                        <button className="rounded-lg border p-2"><FiMoreVertical /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
