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
        "Task started successfully.",
      ),
  );
}

export async function submitTaskProof(
  formData: FormData,
) {
  const taskId = String(
    formData.get("task_id") ?? "",
  ).trim();

  const workerTaskId = String(
    formData.get("worker_task_id") ?? "",
  ).trim();

  const proofText = String(
    formData.get("proof_text") ?? "",
  ).trim();

  const proofUrl = String(
    formData.get("proof_url") ?? "",
  ).trim();

  const proofImage = formData.get("proof_image");

  if (!taskId || !workerTaskId) {
    redirect(
      "/tasks?error=" +
        encodeURIComponent(
          "Task information is missing.",
        ),
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let proofImagePath = "";

  if (
    proofImage instanceof File &&
    proofImage.size > 0
  ) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(proofImage.type)) {
      redirect(
        "/tasks/" +
          taskId +
          "/submit?error=" +
          encodeURIComponent(
            "Only JPG, PNG, and WebP images are allowed.",
          ),
      );
    }

    if (proofImage.size > 5 * 1024 * 1024) {
      redirect(
        "/tasks/" +
          taskId +
          "/submit?error=" +
          encodeURIComponent(
            "Screenshot must be 5 MB or smaller.",
          ),
      );
    }

    const extension =
      proofImage.name.split(".").pop() || "jpg";

    proofImagePath =
      user.id +
      "/" +
      workerTaskId +
      "-" +
      Date.now() +
      "." +
      extension;

    const { error: uploadError } =
      await supabase.storage
        .from("task-proofs")
        .upload(proofImagePath, proofImage, {
          cacheControl: "3600",
          upsert: false,
          contentType: proofImage.type,
        });

    if (uploadError) {
      redirect(
        "/tasks/" +
          taskId +
          "/submit?error=" +
          encodeURIComponent(uploadError.message),
      );
    }
  }

  const { error } = await supabase.rpc(
    "submit_task_proof",
    {
      p_worker_task_id: workerTaskId,
      p_proof_text: proofText || null,
      p_proof_url: proofUrl || null,
      p_proof_image_path:
        proofImagePath || null,
    },
  );

  if (error) {
    if (proofImagePath) {
      await supabase.storage
        .from("task-proofs")
        .remove([proofImagePath]);
    }

    redirect(
      "/tasks/" +
        taskId +
        "/submit?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks/" + taskId);
  revalidatePath("/admin/submissions");

  redirect(
    "/dashboard?message=" +
      encodeURIComponent(
        "Proof submitted successfully and is awaiting review.",
      ),
  );
}
