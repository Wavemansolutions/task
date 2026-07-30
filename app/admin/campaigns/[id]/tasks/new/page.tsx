import { addCampaignTask } from '../../../advanced-actions';

const taskTypes = [
  'general',
  'follow',
  'like',
  'comment',
  'share',
  'subscribe',
  'join',
  'visit',
  'review',
];

export default async function NewCampaignTaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">Campaign task engine</p>
        <h1 className="text-3xl font-bold">Add campaign task</h1>
      </div>

      {query.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {query.error}
        </div>
      )}

      <form action={addCampaignTask} className="space-y-6">
        <input type="hidden" name="campaign_id" value={id} />

        <section className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-2">
          <Field label="Task title" name="title" required />

          <label className="space-y-2">
            <span className="text-sm font-medium">Task type</span>
            <select
              name="type"
              defaultValue="general"
              className="w-full rounded-lg border px-3 py-2 capitalize"
            >
              {taskTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Reward per worker (NGN)"
            name="reward_amount"
            type="number"
            min="1"
            step="0.01"
            required
          />

          <Field
            label="Number of workers"
            name="total_slots"
            type="number"
            min="1"
            required
          />

          <Field
            label="Daily limit"
            name="daily_limit"
            type="number"
            min="1"
            defaultValue="20"
            required
          />

          <Field
            label="Reservation time (minutes)"
            name="reservation_minutes"
            type="number"
            min="5"
            defaultValue="60"
            required
          />

          <Field
            label="Minimum trust score"
            name="minimum_trust_score"
            type="number"
            min="0"
            max="100"
            defaultValue="0"
            required
          />

          <label className="md:col-span-2 space-y-2">
            <span className="text-sm font-medium">Instructions</span>
            <textarea
              name="description"
              rows={6}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
        </section>

        <button className="rounded-lg bg-black px-5 py-3 font-semibold text-white">
          Add task and commit budget
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  type = 'text',
  ...props
}: {
  label: string;
  name: string;
  type?: string;
  [key: string]: string | boolean | undefined;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        className="w-full rounded-lg border px-3 py-2"
        {...props}
      />
    </label>
  );
}
