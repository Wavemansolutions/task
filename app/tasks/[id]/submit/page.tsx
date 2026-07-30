import { createClient } from '@/utils/supabase/server';
import { submitProof } from './actions';

export default async function SubmitTaskProofPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reservation?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const reservationId = query.reservation;

  const supabase = await createClient();

  const { data: reservation } = reservationId
    ? await supabase
        .from('task_reservations')
        .select(`
          id,
          status,
          expires_at,
          reward_amount,
          task_id,
          tasks (
            title,
            description,
            type
          )
        `)
        .eq('id', reservationId)
        .eq('task_id', id)
        .maybeSingle()
    : { data: null };

  if (!reservation) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border bg-white p-6">
          Reservation not found.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">Proof submission</p>
        <h1 className="text-3xl font-bold">
          {(reservation.tasks as any)?.title}
        </h1>
      </div>

      {query.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {query.error}
        </div>
      )}

      <section className="rounded-xl border bg-white p-6">
        <p className="text-sm text-gray-600">
          {(reservation.tasks as any)?.description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <Info label="Status" value={reservation.status} />
          <Info
            label="Reward"
            value={`₦${Number(reservation.reward_amount || 0).toLocaleString()}`}
          />
        </div>
      </section>

      <form action={submitProof} className="space-y-5 rounded-xl border bg-white p-6">
        <input type="hidden" name="reservation_id" value={reservation.id} />
        <input type="hidden" name="task_id" value={id} />

        <label className="space-y-2">
          <span className="text-sm font-medium">Proof type</span>
          <select
            name="proof_type"
            className="w-full rounded-lg border px-3 py-2"
            defaultValue="image"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="url">URL</option>
            <option value="text">Text</option>
            <option value="document">Document</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Proof file URL</span>
          <input
            name="proof_url"
            type="url"
            placeholder="https://..."
            className="w-full rounded-lg border px-3 py-2"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Proof explanation</span>
          <textarea
            name="proof_text"
            rows={5}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Explain what you completed."
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">View count, when required</span>
          <input
            name="view_count"
            type="number"
            min="0"
            className="w-full rounded-lg border px-3 py-2"
          />
        </label>

        <button className="w-full rounded-lg bg-black px-4 py-3 font-semibold text-white">
          Submit proof
        </button>
      </form>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-semibold capitalize">{value}</p>
    </div>
  );
}
