"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function startTask(formData: FormData) {
  const taskId = String(
    formData.get("task_id") ?? "",
  ).trim();

  if (!taskId) {
    redirect(
      "/tasks?error=" +
        encodeURIComponent("Task ID is required."),
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Please sign in before starting a task.",
        ),
    );
  }

  const { error } = await supabase.rpc(
    "start_worker_task",
    {
      p_task_id: taskId,
    },
  );

  if (error) {
    redirect(
      "/tasks/" +
        taskId +
        "?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/tasks");
  revalidatePath("/tasks/" + taskId);
  revalidatePath("/dashboard");

  redirect(
    "/tasks/" +
      taskId +
      "?message=" +
      encodeURIComponent(
        "Task started successfully. Complete the instructions and submit your proof.",
      ),
  );
}
