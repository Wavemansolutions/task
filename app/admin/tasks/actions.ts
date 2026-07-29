"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedAdminRoles = [
  "super_admin",
  "task_manager",
];

const allowedStatuses = [
  "draft",
  "active",
  "paused",
];

const allowedTaskTypes = [
  "follow",
  "like",
  "comment",
  "share",
  "subscribe",
  "join",
  "visit",
  "review",
  "general",
];

export async function createTask(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please+sign+in+to+continue.");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

  if (
    profileError ||
    !profile ||
    !allowedAdminRoles.includes(profile.role)
  ) {
    redirect(
      "/dashboard?error=You+are+not+authorized+to+create+tasks.",
    );
  }

  const title = String(
    formData.get("title") ?? "",
  ).trim();

  const description = String(
    formData.get("description") ?? "",
  ).trim();

  const instructions = String(
    formData.get("instructions") ?? "",
  ).trim();

  const platform = String(
    formData.get("platform") ?? "general",
  ).trim();

  const taskType = String(
    formData.get("taskType") ?? "general",
  ).trim();

  const taskUrl = String(
    formData.get("taskUrl") ?? "",
  ).trim();

  const proofInstructions = String(
    formData.get("proofInstructions") ?? "",
  ).trim();

  const status = String(
    formData.get("status") ?? "draft",
  ).trim();

  const rewardAmount = Number(
    formData.get("rewardAmount") ?? 0,
  );

  const totalSlots = Number(
    formData.get("totalSlots") ?? 1,
  );

  if (!title || !description || !instructions) {
    redirect(
      "/admin/tasks/new?error=Title,+description+and+instructions+are+required.",
    );
  }

  if (
    !Number.isFinite(rewardAmount) ||
    rewardAmount <= 0
  ) {
    redirect(
      "/admin/tasks/new?error=Enter+a+valid+reward+amount.",
    );
  }

  if (
    !Number.isInteger(totalSlots) ||
    totalSlots < 1
  ) {
    redirect(
      "/admin/tasks/new?error=Total+slots+must+be+at+least+one.",
    );
  }

  if (!allowedStatuses.includes(status)) {
    redirect(
      "/admin/tasks/new?error=Invalid+task+status.",
    );
  }

  if (!allowedTaskTypes.includes(taskType)) {
    redirect(
      "/admin/tasks/new?error=Invalid+task+type.",
    );
  }

  const taskData = {
    title,
    description,
    instructions,
    platform,

    type: taskType,
    task_type: taskType,

    task_url: taskUrl || null,
    proof_instructions: proofInstructions || null,

    reward_amount: rewardAmount,
    total_slots: totalSlots,
    slots_available: totalSlots,

    status,
    created_by: user.id,

    campaign_id: null,
  };

  const { error } = await supabase
    .from("tasks")
    .insert(taskData);

  if (error) {
    const errorMessage = encodeURIComponent(
      error.message,
    );

    redirect(
      "/admin/tasks/new?error=" + errorMessage,
    );
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/tasks");

  redirect(
    "/admin/tasks?message=Task+created+successfully.",
  );
}