"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const taskAdminRoles = ["super_admin", "admin", "task_manager"];

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

  const taskId = String(formData.get("task_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const platform = String(formData.get("platform") ?? "general").trim();
  const type = String(formData.get("taskType") ?? formData.get("type") ?? "general").trim();
  const taskUrl = String(formData.get("taskUrl") ?? formData.get("task_url") ?? "").trim();
  const rewardAmount = Number(formData.get("rewardAmount") ?? formData.get("reward_amount") ?? 0);
  const totalSlots = Number(formData.get("totalSlots") ?? formData.get("total_slots") ?? 1);
  const proofInstructions = String(formData.get("proofInstructions") ?? formData.get("proof_instructions") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();

  if (!taskId || !title || !description || !instructions) {
    redirect(`/admin/tasks/${taskId}/edit?error=${encodeURIComponent("Title, description, and instructions are required.")}`);
  }
  if (!Number.isFinite(rewardAmount) || rewardAmount <= 0) {
    redirect(`/admin/tasks/${taskId}/edit?error=${encodeURIComponent("Enter a valid reward amount.")}`);
  }
  if (!Number.isInteger(totalSlots) || totalSlots < 1) {
    redirect(`/admin/tasks/${taskId}/edit?error=${encodeURIComponent("Worker slots must be at least 1.")}`);
  }

  const { data: current } = await supabase
    .from("tasks")
    .select("total_slots,slots_available")
    .eq("id", taskId)
    .maybeSingle();

  const previousTotal = Number(current?.total_slots ?? totalSlots);
  const previousAvailable = Number(current?.slots_available ?? previousTotal);
  const alreadyUsed = Math.max(previousTotal - previousAvailable, 0);
  const slotsAvailable = Math.max(totalSlots - alreadyUsed, 0);

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description,
      instructions,
      platform: platform || "general",
      type: type || "general",
      task_url: taskUrl || null,
      reward_amount: rewardAmount,
      total_slots: totalSlots,
      slots_available: slotsAvailable,
      proof_instructions: proofInstructions || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    redirect(`/admin/tasks/${taskId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tasks");
  revalidatePath(`/admin/tasks/${taskId}/edit`);
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
  redirect(`/admin/tasks?message=${encodeURIComponent("Task updated successfully.")}`);
}

export async function setTaskStatus(formData: FormData) {
  const { supabase } = await requireTaskAdmin();
  const taskId = String(formData.get("task_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!taskId || !["active", "paused"].includes(status)) {
    redirect(`/admin/tasks?error=${encodeURIComponent("Invalid task or status.")}`);
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) {
    redirect(`/admin/tasks?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
  redirect(`/admin/tasks?message=${encodeURIComponent(status === "active" ? "Task resumed successfully." : "Task suspended successfully.")}`);
}

export async function deleteTask(formData: FormData) {
  const { supabase } = await requireTaskAdmin();
  const taskId = String(formData.get("task_id") ?? "").trim();

  if (!taskId) {
    redirect(`/admin/tasks?error=${encodeURIComponent("Task ID is required.")}`);
  }

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    const message = /foreign key|violates/i.test(error.message)
      ? "This task already has worker activity and cannot be permanently deleted. Suspend it instead."
      : error.message;
    redirect(`/admin/tasks?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect(`/admin/tasks?message=${encodeURIComponent("Task deleted successfully.")}`);
}
