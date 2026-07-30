"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const taskAdminRoles = ["super_admin", "task_manager"];

async function requireTaskAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please+sign+in+to+continue.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !taskAdminRoles.includes(profile.role)) {
    redirect(
      "/dashboard?error=" +
        encodeURIComponent(
          "You are not authorized to manage tasks.",
        ),
    );
  }

  return { supabase, user };
}

export async function createTask(formData: FormData) {
  const { supabase, user } = await requireTaskAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(
    formData.get("description") ?? "",
  ).trim();
  const instructions = String(
    formData.get("instructions") ?? "",
  ).trim();
  const platform = String(
    formData.get("platform") ?? "general",
  ).trim();
  const type = String(
    formData.get("type") ?? "general",
  ).trim();
  const taskUrl = String(
    formData.get("taskUrl") ??
      formData.get("task_url") ??
      "",
  ).trim();
  const rewardAmount = Number(
    formData.get("rewardAmount") ?? 0,
  );
  const totalSlots = Number(
    formData.get("totalSlots") ?? 1,
  );
  const proofInstructions = String(
    formData.get("proofInstructions") ?? "",
  ).trim();
  const status = String(
    formData.get("status") ?? "draft",
  ).trim();

  if (!title || !description || !instructions) {
    redirect(
      "/admin/tasks/new?error=" +
        encodeURIComponent(
          "Title, description, and instructions are required.",
        ),
    );
  }

  if (
    !Number.isFinite(rewardAmount) ||
    rewardAmount <= 0
  ) {
    redirect(
      "/admin/tasks/new?error=" +
        encodeURIComponent(
          "Enter a valid reward amount.",
        ),
    );
  }

  if (
    !Number.isInteger(totalSlots) ||
    totalSlots < 1
  ) {
    redirect(
      "/admin/tasks/new?error=" +
        encodeURIComponent(
          "Worker slots must be at least 1.",
        ),
    );
  }

  const { error } = await supabase.from("tasks").insert({
    title,
    description,
    instructions,
    platform: platform || "general",
    type: type || "general",
    task_url: taskUrl || null,
    reward_amount: rewardAmount,
    total_slots: totalSlots,
    slots_available: totalSlots,
    proof_instructions: proofInstructions || null,
    status,
    created_by: user.id,
  });

  if (error) {
    redirect(
      "/admin/tasks/new?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  redirect(
    "/admin/tasks?message=" +
      encodeURIComponent(
        "Task created successfully.",
      ),
  );
}

export async function updateTask(formData: FormData) {
  const { supabase } = await requireTaskAdmin();

  const taskId = String(
    formData.get("task_id") ?? "",
  ).trim();
  const title = String(
    formData.get("title") ?? "",
  ).trim();
  const description = String(
    formData.get("description") ?? "",
  ).trim();
  const rewardAmount = Number(
    formData.get("reward_amount") ??
      formData.get("reward") ??
      0,
  );
  const status = String(
    formData.get("status") ?? "draft",
  ).trim();

  if (!taskId || !title || !description) {
    redirect(
      "/admin/tasks?error=" +
        encodeURIComponent(
          "Task ID, title, and description are required.",
        ),
    );
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description,
      reward_amount: rewardAmount,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    redirect(
      "/admin/tasks/" +
        taskId +
        "/edit?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/tasks");
  redirect(
    "/admin/tasks?message=" +
      encodeURIComponent(
        "Task updated successfully.",
      ),
  );
}

export async function deleteTask(formData: FormData) {
  const { supabase } = await requireTaskAdmin();
  const taskId = String(
    formData.get("task_id") ?? "",
  ).trim();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    redirect(
      "/admin/tasks?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/tasks");
  redirect(
    "/admin/tasks?message=" +
      encodeURIComponent(
        "Task deleted successfully.",
      ),
  );
}
