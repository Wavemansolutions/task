'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiEdit2, FiPause, FiPlay, FiTrash2 } from 'react-icons/fi';
import { deleteTask, setTaskStatus } from '@/app/admin/tasks/actions';

export function AdminTaskActions({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const [deleting, setDeleting] = useState(false);
  const isPaused = status === 'paused';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/admin/tasks/${taskId}/edit`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-green-500 hover:text-green-700"
      >
        <FiEdit2 /> Edit
      </Link>

      <form action={setTaskStatus}>
        <input type="hidden" name="task_id" value={taskId} />
        <input type="hidden" name="status" value={isPaused ? 'active' : 'paused'} />
        <button
          type="submit"
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
            isPaused
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          {isPaused ? <FiPlay /> : <FiPause />}
          {isPaused ? 'Resume' : 'Suspend'}
        </button>
      </form>

      {deleting ? (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-1.5">
          <span className="px-1 text-xs font-semibold text-red-700">Delete permanently?</span>
          <form action={deleteTask}>
            <input type="hidden" name="task_id" value={taskId} />
            <button
              type="submit"
              className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-700"
            >
              Yes, delete
            </button>
          </form>
          <button
            type="button"
            onClick={() => setDeleting(false)}
            className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDeleting(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
        >
          <FiTrash2 /> Delete
        </button>
      )}
    </div>
  );
}
