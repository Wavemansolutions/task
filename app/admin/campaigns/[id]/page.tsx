import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import {
  recalculateCampaignBudget,
  setCampaignStatus,
} from '../actions';

function money(value: number | string | null) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const [{ data: campaign }, { data: tasks }, { data: events }] =
    await Promise.all([
      supabase
        .from('admin_campaign_summary')
        .select('*')
        .eq('id', id)
        .single(),
      supabase
        .from('tasks')
        .select(
          'id,title,type,status,reward_amount,total_slots,slots_available,daily_limit'
        )
        .eq('campaign_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('campaign_events')
        .select('id,event_type,details,created_at')
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

  if (!campaign) notFound();

  const budgetPercent =
    Number(campaign.total_budget) > 0
      ? Math.round(
          (Number(campaign.spent_budget) /
            Number(campaign.total_budget)) *
            100
        )
      : 0;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <Link href="/admin/campaigns" className="text-sm underline">
        Back to campaigns
      </Link>

      {query.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {query.error}
        </div>
      )}

      <header className="flex flex-col gap-4 rounded-xl border bg-white p-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {campaign.client_name || 'Internal campaign'}
          </p>
          <h1 className="text-3xl font-bold">{campaign.title}</h1>
          <p className="mt-2 capitalize text-gray-600">
            Status: {campaign.status}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {['draft', 'active', 'paused', 'completed', 'cancelled'].map(
            (status) => (
              <form key={status} action={setCampaignStatus}>
                <input type="hidden" name="campaign_id" value={id} />
                <input type="hidden" name="status" value={status} />
                <button
                  className="rounded-lg border px-3 py-2 text-sm capitalize hover:bg-gray-50 disabled:opacity-40"
                  disabled={campaign.status === status}
                >
                  {status}
                </button>
              </form>
            )
          )}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric title="Total budget" value={money(campaign.total_budget)} />
        <Metric title="Reserved" value={money(campaign.reserved_budget)} />
        <Metric title="Spent" value={money(campaign.spent_budget)} />
        <Metric title="Remaining" value={money(campaign.remaining_budget)} />
      </section>

      <section className="rounded-xl border bg-white p-6">
        <div className="mb-3 flex justify-between text-sm">
          <span>Budget usage</span>
          <span>{budgetPercent}%</span>
        </div>
        <div className="h-3 rounded-full bg-gray-200">
          <div
            className="h-3 rounded-full bg-black"
            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
          />
        </div>

        <form action={recalculateCampaignBudget} className="mt-4">
          <input type="hidden" name="campaign_id" value={id} />
          <button className="rounded-lg border px-4 py-2 text-sm">
            Recalculate approved-task spending
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Campaign tasks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">Task</th>
                <th className="p-4">Type</th>
                <th className="p-4">Reward</th>
                <th className="p-4">Claimed</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks?.map((task) => (
                <tr className="border-t" key={task.id}>
                  <td className="p-4 font-medium">{task.title}</td>
                  <td className="p-4 capitalize">{task.type}</td>
                  <td className="p-4">{money(task.reward_amount)}</td>
                  <td className="p-4">
                    {Number(task.total_slots || 0) -
                      Number(task.slots_available || 0)}
                    /{task.total_slots}
                  </td>
                  <td className="p-4 capitalize">{task.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Recent activity</h2>
        <div className="mt-4 space-y-3">
          {events?.map((event) => (
            <div key={event.id} className="rounded-lg border p-4">
              <p className="font-medium">
                {event.event_type.replaceAll('_', ' ')}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(event.created_at).toLocaleString()}
              </p>
              <pre className="mt-2 overflow-x-auto text-xs text-gray-600">
                {JSON.stringify(event.details, null, 2)}
              </pre>
            </div>
          ))}
          {!events?.length && (
            <p className="text-sm text-gray-500">No activity recorded.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
