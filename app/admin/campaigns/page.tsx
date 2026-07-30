import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

function money(value: number | string | null) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default async function CampaignsPage() {
  const supabase = await createClient();

  const { data: campaigns, error } = await supabase
    .from('admin_campaign_summary')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Task operations</p>
          <h1 className="text-3xl font-bold">Campaigns</h1>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="rounded-lg bg-black px-4 py-3 text-center font-medium text-white"
        >
          Create campaign
        </Link>
      </header>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {error.message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <Metric title="Campaigns" value={campaigns?.length || 0} />
        <Metric
          title="Active"
          value={campaigns?.filter((item) => item.status === 'active').length || 0}
        />
        <Metric
          title="Total budget"
          value={money(
            campaigns?.reduce(
              (sum, item) => sum + Number(item.total_budget || 0),
              0
            ) || 0
          )}
        />
        <Metric
          title="Spent"
          value={money(
            campaigns?.reduce(
              (sum, item) => sum + Number(item.spent_budget || 0),
              0
            ) || 0
          )}
        />
      </section>

      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4">Campaign</th>
                <th className="p-4">Status</th>
                <th className="p-4">Budget</th>
                <th className="p-4">Spent</th>
                <th className="p-4">Progress</th>
                <th className="p-4">Tasks</th>
              </tr>
            </thead>
            <tbody>
              {campaigns?.map((campaign) => {
                const total = Number(campaign.total_slots || 0);
                const claimed = Number(campaign.claimed_slots || 0);
                const progress = total > 0
                  ? Math.round((claimed / total) * 100)
                  : 0;

                return (
                  <tr key={campaign.id} className="border-t">
                    <td className="p-4">
                      <Link
                        href={`/admin/campaigns/${campaign.id}`}
                        className="font-semibold hover:underline"
                      >
                        {campaign.title}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {campaign.client_name || 'Internal campaign'}
                      </p>
                    </td>
                    <td className="p-4 capitalize">{campaign.status}</td>
                    <td className="p-4">{money(campaign.total_budget)}</td>
                    <td className="p-4">{money(campaign.spent_budget)}</td>
                    <td className="min-w-44 p-4">
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{claimed}/{total} slots</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-black"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-4">{campaign.task_count}</td>
                  </tr>
                );
              })}

              {!campaigns?.length && (
                <tr>
                  <td className="p-8 text-center text-gray-500" colSpan={6}>
                    No campaigns yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
