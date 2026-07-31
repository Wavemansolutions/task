import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import { FiArrowLeft, FiSend } from 'react-icons/fi';

export default function NewSupportTicketPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Help centre"
          title="Create Support Ticket"
          description="Explain the problem clearly so the support team can assist."
          action={
            <Link href="/support" className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-bold">
              <FiArrowLeft /> Back
            </Link>
          }
        />

        <form className="space-y-5 rounded-3xl border bg-white p-6 shadow-sm">
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Category</span>
            <select className="w-full rounded-xl border px-4 py-3">
              <option>Task problem</option>
              <option>Proof problem</option>
              <option>Wallet problem</option>
              <option>Withdrawal problem</option>
              <option>Account problem</option>
              <option>General enquiry</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">Subject</span>
            <input className="w-full rounded-xl border px-4 py-3" placeholder="Brief summary of the issue" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">Message</span>
            <textarea rows={7} className="w-full rounded-xl border px-4 py-3" placeholder="Describe what happened..." />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">Attachment</span>
            <input type="file" className="w-full rounded-xl border px-4 py-3" />
          </label>

          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white">
            <FiSend /> Submit Ticket
          </button>
        </form>
      </div>
    </AppShell>
  );
}
