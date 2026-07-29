"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedAdminRoles = [
  "super_admin",
  "task_manager",
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
      .single();

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

  const allowedStatuses = [
    "draft",
    "active",
    "paused",
  ];

  if (!allowedStatuses.includes(status)) {
    redirect(
      "/admin/tasks/new?error=Invalid+task+status.",
    );
  }

  const { error } = await supabase
    .from("tasks")
    .insert({
      title,
      description,
      instructions,
      platform,
      task_type: taskType,
      task_url: taskUrl || null,
      proof_instructions:
        proofInstructions || null,
      reward_amount: rewardAmount,
      total_slots: totalSlots,
      slots_available: totalSlots,
      status,
      created_by: user.id,
    });

  if (error) {
    redirect(
      `/admin/tasks/new?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/tasks");
  revalidatePath("/admin/tasks");

  redirect(
    "/admin/tasks?message=Task+created+successfully.",
  );
}
