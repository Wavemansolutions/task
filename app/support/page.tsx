import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { FiMessageCircle, FiPlus } from 'react-icons/fi';

type SupportPageProps = {
  searchParams: Promise<{ message?: string; error?: string }>;
};

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: tickets, error }] = await Promise.all([
    supabase.from('profiles').select('full_name,role').eq('id', user.id).maybeSingle(),
    supabase
      .from('support_tickets')
      .select('id,subject,category,priority,status,last_message_at,created_at')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false }),
  ]);

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Worker';
  const role = profile?.role ?? 'worker';
  const isAdmin = ['super_admin','task_manager','proof_reviewer','finance_admin','support_admin','auditor'].includes(role);

  return (
    <AppShell userName={displayName} userRole={role} isAdmin={isAdmin}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-green-600">Help centre</p>
            <h1 className="mt-1 text-3xl font-black">Support</h1>
            <p className="mt-2 text-sm text-slate-500">We are here to help with tasks, proofs, wallets and withdrawals.</p>
          </div>
          <Link href="/support/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-600/20 hover:bg-green-700">
            <FiPlus /> New Ticket
          </Link>
        </div>

        {query.message ? <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{query.message}</div> : null}
        {query.error || error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{query.error ?? error?.message}</div> : null}

        {(tickets ?? []).length === 0 ? (
          <div className="flex min-h-[460px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-green-50 text-green-600">
              <FiMessageCircle className="h-16 w-16" />
              <span className="absolute -right-1 top-4 h-4 w-4 rounded-full bg-yellow-400" />
              <span className="absolute -left-2 bottom-8 h-3 w-3 rounded-full bg-blue-400" />
            </div>
            <h2 className="mt-8 text-2xl font-black">You have not created any support tickets.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Create a ticket and our support team will respond from your dashboard.</p>
            <Link href="/support/new" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700"><FiPlus /> Create Support Ticket</Link>
          </div>
        ) : (
          <section className="space-y-4">
            {tickets?.map((ticket) => (
              <Link key={ticket.id} href={`/support/${ticket.id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-green-300 hover:shadow-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-bold text-slate-900">{ticket.subject}</h2>
                    <p className="mt-2 text-sm capitalize text-slate-500">{ticket.category} · {ticket.priority}</p>
                  </div>
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{ticket.status.replaceAll('_', ' ')}</span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
