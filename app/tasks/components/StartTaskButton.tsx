"use client";

import { useFormStatus } from "react-dom";
import { startTask } from "@/app/tasks/actions";

type StartTaskButtonProps = {
  taskId: string;
  disabled?: boolean;
  alreadyStarted?: boolean;
};

function SubmitButton({
  disabled,
  alreadyStarted,
}: {
  disabled: boolean;
  alreadyStarted: boolean;
}) {
  const { pending } = useFormStatus();

  const isDisabled =
    disabled || alreadyStarted || pending;

  let label = "Start Task";

  if (alreadyStarted) {
    label = "Task Started";
  } else if (pending) {
    label = "Starting...";
  } else if (disabled) {
    label = "No Slots Available";
  }

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
    >
      {label}
    </button>
  );
}

export default function StartTaskButton({
  taskId,
  disabled = false,
  alreadyStarted = false,
}: StartTaskButtonProps) {
  return (
    <form action={startTask}>
      <input
        type="hidden"
        name="task_id"
        value={taskId}
      />

      <SubmitButton
        disabled={disabled}
        alreadyStarted={alreadyStarted}
      />
    </form>
  );
}
