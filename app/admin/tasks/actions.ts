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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !taskAdminRoles.includes(profile.role)
  ) {
    redirect(
      "/dashboard?error=You+are+not+authorized+to+manage+tasks.",
    );
  }

  return supabase;
}

function getText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function getPositiveNumber(formData: FormData, name: string) {
  return Number(formData.get(name) ?? 0);
}

function taskErrorRedirect(path: string, message: string): never {
  redirect(path + "?error=" + encodeURIComponent(message));
}

export async function createTask(formData: FormData) {
  const supabase = await requireTaskAdmin();

  const title = getText(formData, "title");
  const description = getText(formData, "description");
  const instructions = getText(formData, "instructions");
  const platform = getText(formData, "platform") || "general";
  const taskType = getText(formData, "taskType") || "general";
  const taskUrl = getText(formData, "taskUrl");
  const rewardAmount = getPositiveNumber(formData, "rewardAmount");
  const totalSlots = getPositiveNumber(formData, "totalSlots");
  const proofInstructions = getText(formData, "proofInstructions");
  const status = getText(formData, "status") || "draft";

  if (!title || !description || !instructions) {
    taskErrorRedirect(
      "/admin/tasks/new",
      "Title, description, and instructions are required.",
    );
  }

  if (!Number.isFinite(rewardAmount) || rewardAmount <= 0) {
    taskErrorRedirect(
      "/admin/tasks/new",
      "Reward amount must be greater than zero.",
    );
  }

  if (
    !Number.isInteger(totalSlots) ||
    totalSlots <= 0
  ) {
    taskErrorRedirect(
      "/admin/tasks/new",
      "Worker slots must be a whole number greater than zero.",
    );
  }

  const allowedStatuses = ["draft", "active", "paused"];

  if (!allowedStatuses.includes(status)) {
    taskErrorRedirect(
      "/admin/tasks/new",
      "Invalid publishing status.",
    );
  }

  const { error } = await supabase.from("tasks").insert({
    title,
    description,
    instructions,
    platform,
    type: taskType,
    task_url: taskUrl || null,
    reward_amount: rewardAmount,
    total_slots: totalSlots,
    slots_available: totalSlots,
    proof_instructions: proofInstructions || null,
    status,
    campaign_id: null,
  });

  if (error) {
    taskErrorRedirect("/admin/tasks/new", error.message);
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  redirect(
    "/admin/tasks?message=" +
      encodeURIComponent("Task created successfully."),
  );
}

export async function updateTask(formData: FormData) {
  const supabase = await requireTaskAdmin();

  const taskId = getText(formData, "task_id");
  const title = getText(formData, "title");
  const description = getText(formData, "description");
  const instructions = getText(formData, "instructions");
  const platform = getText(formData, "platform") || "general";
  const taskType = getText(formData, "taskType") || "general";
  const taskUrl = getText(formData, "taskUrl");
  const rewardAmount = getPositiveNumber(formData, "rewardAmount");
  const totalSlots = getPositiveNumber(formData, "totalSlots");
  const proofInstructions = getText(formData, "proofInstructions");
  const status = getText(formData, "status") || "draft";

  if (!taskId) {
    taskErrorRedirect(
      "/admin/tasks",
      "Task ID is required.",
    );
  }

  const editPath = "/admin/tasks/" + taskId + "/edit";

  if (!title || !description || !instructions) {
    taskErrorRedirect(
      editPath,
      "Title, description, and instructions are required.",
    );
  }

  if (!Number.isFinite(rewardAmount) || rewardAmount <= 0) {
    taskErrorRedirect(
      editPath,
      "Reward amount must be greater than zero.",
    );
  }

  if (
    !Number.isInteger(totalSlots) ||
    totalSlots <= 0
  ) {
    taskErrorRedirect(
      editPath,
      "Worker slots must be a whole number greater than zero.",
    );
  }

  const allowedStatuses = [
    "draft",
    "active",
    "paused",
    "completed",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    taskErrorRedirect(editPath, "Invalid task status.");
  }

  const { data: existingTask, error: existingTaskError } =
    await supabase
      .from("tasks")
      .select("total_slots,slots_available")
      .eq("id", taskId)
      .maybeSingle();

  if (existingTaskError || !existingTask) {
    taskErrorRedirect(
      editPath,
      existingTaskError?.message ?? "Task not found.",
    );
  }

  const previousTotal = Number(existingTask.total_slots ?? 0);
  const previousAvailable = Number(
    existingTask.slots_available ?? 0,
  );
  const occupiedSlots = Math.max(
    0,
    previousTotal - previousAvailable,
  );

  if (totalSlots < occupiedSlots) {
    taskErrorRedirect(
      editPath,
      "Total slots cannot be lower than the number of occupied slots.",
    );
  }

  const newAvailableSlots = Math.max(
    0,
    totalSlots - occupiedSlots,
  );

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description,
      instructions,
      platform,
      type: taskType,
      task_url: taskUrl || null,
      reward_amount: rewardAmount,
      total_slots: totalSlots,
      slots_available: newAvailableSlots,
      proof_instructions: proofInstructions || null,
      status,
    })
    .eq("id", taskId);

  if (error) {
    taskErrorRedirect(editPath, error.message);
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath(editPath);

  redirect(
    "/admin/tasks?message=" +
      encodeURIComponent("Task updated successfully."),
  );
}

export async function deleteTask(formData: FormData) {
  const supabase = await requireTaskAdmin();

  const taskId = getText(formData, "task_id");

  if (!taskId) {
    taskErrorRedirect(
      "/admin/tasks",
      "Task ID is required.",
    );
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    taskErrorRedirect("/admin/tasks", error.message);
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  redirect(
    "/admin/tasks?message=" +
      encodeURIComponent("Task deleted successfully."),
  );
}
