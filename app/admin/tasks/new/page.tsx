import Link from 'next/link';
import { createTaskAction } from './actions';

export default function CreateTaskPage({
  searchParams,
}: {
  searchParams?: {
    error?: string;
    success?: string;
  };
}) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Task management</p>
          <h1 className="text-3xl font-bold">Create Task</h1>
        </div>

        <Link
          href="/admin/tasks"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Back to Tasks
        </Link>
      </div>

      {searchParams?.error && (
        <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {searchParams?.success && (
        <div className="mb-5 rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
          Task created successfully.
        </div>
      )}

      <form
        action={createTaskAction}
        className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Task title
          </label>

          <input
            name="title"
            type="text"
            required
            minLength={3}
            placeholder="Example: Like and share our Facebook post"
            className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Description
          </label>

          <textarea
            name="description"
            required
            rows={5}
            placeholder="Explain exactly what the worker must do."
            className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Task instructions
          </label>

          <textarea
            name="instructions"
            rows={5}
            placeholder="Step 1: Open the link. Step 2: Like the post. Step 3: Upload proof."
            className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Task type
          </label>

          <select
            name="type"
            required
            defaultValue="general"
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="general">General</option>
            <option value="like">Like</option>
            <option value="follow">Follow</option>
            <option value="comment">Comment</option>
            <option value="share">Share</option>
            <option value="subscribe">Subscribe</option>
            <option value="join">Join Group</option>
            <option value="visit">Visit Website</option>
            <option value="review">Review</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Task link
          </label>

          <input
            name="task_url"
            type="url"
            placeholder="https://example.com/post"
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Reward per worker
            </label>

            <input
              name="reward_amount"
              type="number"
              required
              min="1"
              step="0.01"
              defaultValue="50"
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Number of workers
            </label>

            <input
              name="total_slots"
              type="number"
              required
              min="1"
              defaultValue="20"
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Proof required
          </label>

          <select
            name="proof_type"
            defaultValue="screenshot"
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="screenshot">Screenshot</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="text">Text response</option>
            <option value="link">Proof link</option>
          </select>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Start date
            </label>

            <input
              name="starts_at"
              type="datetime-local"
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              End date
            </label>

            <input
              name="ends_at"
              type="datetime-local"
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Status
          </label>

          <select
            name="status"
            defaultValue="active"
            className="w-full rounded-lg border px-4 py-3"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
        >
          Create Task
        </button>
      </form>
    </main>
  );
}