import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FiCheck, FiEye, FiX } from 'react-icons/fi';

const rows = [
  ['John Worker', 'GTBank • 0123456789', '₦15,000', 'Pending'],
  ['Ada Worker', 'OPay • 9087654321', '₦8,500', 'Under review'],
  ['Peter Worker', 'Access • 1122334455', '₦22,000', 'Approved'],
];

export default function WithdrawalsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Finance"
          title="Withdrawal Requests"
          description="Review and process worker payouts."
        />

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Worker</th>
                  <th className="px-5 py-4">Bank account</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(([worker, bank, amount, status]) => (
                  <tr key={worker}>
                    <td className="px-5 py-4 font-bold">{worker}</td>
                    <td className="px-5 py-4">{bank}</td>
                    <td className="px-5 py-4 font-black">{amount}</td>
                    <td className="px-5 py-4">{status}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-lg border p-2"><FiEye /></button>
                        <button className="rounded-lg bg-green-50 p-2 text-green-700"><FiCheck /></button>
                        <button className="rounded-lg bg-red-50 p-2 text-red-700"><FiX /></button>
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
