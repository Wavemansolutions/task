"use client";

import { useFormStatus } from "react-dom";
import { deleteTask } from "@/app/admin/tasks/actions";

type DeleteTaskButtonProps = {
  taskId: string;
  taskTitle: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}

export default function DeleteTaskButton({
  taskId,
  taskTitle,
}: DeleteTaskButtonProps) {
  return (
    <form
      action={deleteTask}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          'Delete "' +
            taskTitle +
            '"? This action cannot be undone.',
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input
        type="hidden"
        name="task_id"
        value={taskId}
      />

      <SubmitButton />
    </form>
  );
}
