import { createClient } from '@/utils/supabase/server';
import { reserveTaskAction } from './reservation-actions';

function money(value: number | string | null) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    reserved?: string;
  }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      type,
      reward_amount,
      slots_available,
      total_slots,
      reservation_minutes,
      minimum_trust_score,
      campaign_id,
      campaigns!inner (
        title,
        status
      )
    `)
    .eq('status', 'active')
    .eq('campaigns.status', 'active')
    .gt('slots_available', 0)
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">Available work</p>
        <h1 className="text-3xl font-bold">Tasks</h1>
      </div>

      {query.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {query.error}
        </div>
      )}

      {query.reserved && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
          Task reserved successfully.
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-2">
        {tasks?.map((task: any) => (
          <article key={task.id} className="rounded-xl border bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {task.campaigns?.title}
                </p>
                <h2 className="mt-1 text-xl font-semibold">{task.title}</h2>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs capitalize">
                {task.type}
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              {task.description || 'Follow the task instructions carefully.'}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <Stat label="Reward" value={money(task.reward_amount)} />
              <Stat
                label="Slots"
                value={`${task.slots_available}/${task.total_slots}`}
              />
              <Stat
                label="Time"
                value={`${task.reservation_minutes || 60} min`}
              />
            </div>

            <form action={reserveTaskAction} className="mt-5 space-y-3">
              <input type="hidden" name="task_id" value={task.id} />
              <input
                type="hidden"
                name="device_fingerprint"
                value=""
              />
              <input
                type="hidden"
                name="country_code"
                value="NG"
              />
              <input type="hidden" name="is_vpn" value="false" />

              <button className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white">
                Reserve task
              </button>
            </form>

            <p className="mt-2 text-xs text-gray-500">
              Minimum trust score: {task.minimum_trust_score || 0}
            </p>
          </article>
        ))}

        {!tasks?.length && (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500 md:col-span-2">
            No tasks are currently available.
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
