import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { FiCheck, FiEye, FiX } from 'react-icons/fi';

export default function ProofsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Proof review"
          title="Pending Proofs"
          description="Review evidence submitted by workers."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {[1,2,3,4].map((item) => (
            <article key={item} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="aspect-video rounded-xl bg-gradient-to-br from-slate-200 to-slate-100" />
              <div className="mt-4">
                <p className="text-xs font-bold uppercase text-green-600">Facebook task</p>
                <h2 className="mt-1 font-black">Proof submission #{item}</h2>
                <p className="mt-2 text-sm text-slate-500">Submitted by Worker {item}</p>
              </div>
              <div className="mt-5 flex gap-3">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-bold">
                  <FiEye /> View
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 font-bold text-white">
                  <FiCheck /> Approve
                </button>
                <button className="rounded-xl bg-red-50 px-4 text-red-600"><FiX /></button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
