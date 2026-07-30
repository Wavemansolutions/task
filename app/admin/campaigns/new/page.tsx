import { createCampaign } from '../actions';

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

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">Campaign engine</p>
        <h1 className="text-3xl font-bold">Create campaign</h1>
      </div>

      {params.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {params.error}
        </div>
      )}

      <form action={createCampaign} className="space-y-6">
        <section className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-2">
          <h2 className="md:col-span-2 text-xl font-semibold">
            Campaign details
          </h2>

          <Field label="Campaign title" name="title" required />
          <Field label="Client name" name="client_name" />
          <Field
            label="Total budget (NGN)"
            name="total_budget"
            type="number"
            min="1"
            step="0.01"
            required
          />
          <div />

          <Field
            label="Start date"
            name="starts_at"
            type="datetime-local"
          />
          <Field
            label="End date"
            name="ends_at"
            type="datetime-local"
          />

          <label className="md:col-span-2 space-y-2">
            <span className="text-sm font-medium">Description</span>
            <textarea
              name="description"
              rows={4}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
        </section>

        <section className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-2">
          <h2 className="md:col-span-2 text-xl font-semibold">
            First task
          </h2>

          <Field label="Task title" name="task_title" required />

          <label className="space-y-2">
            <span className="text-sm font-medium">Task type</span>
            <select
              name="task_type"
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
            label="Daily limit per worker"
            name="daily_limit"
            type="number"
            min="1"
            defaultValue="20"
            required
          />

          <label className="md:col-span-2 space-y-2">
            <span className="text-sm font-medium">Task instructions</span>
            <textarea
              name="task_description"
              rows={5}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
        </section>

        <button
          type="submit"
          className="rounded-lg bg-black px-5 py-3 font-semibold text-white"
        >
          Create draft campaign
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
