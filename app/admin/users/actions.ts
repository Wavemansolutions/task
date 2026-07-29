"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedRoles = [
  "worker",
  "super_admin",
  "task_manager",
  "proof_reviewer",
  "finance_admin",
  "support_admin",
  "auditor",
];

export async function assignUserRole(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please+sign+in+to+continue.");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (currentProfile?.role !== "super_admin") {
    redirect(
      "/dashboard?error=Only+the+Super+Admin+can+assign+roles.",
    );
  }

  const targetUserId = String(
    formData.get("userId") ?? "",
  ).trim();

  const newRole = String(
    formData.get("role") ?? "",
  ).trim();

  if (!targetUserId || !allowedRoles.includes(newRole)) {
    redirect(
      "/admin/users?error=Invalid+user+or+role.",
    );
  }

  if (
    targetUserId === user.id &&
    newRole !== "super_admin"
  ) {
    redirect(
      "/admin/users?error=You+cannot+remove+your+own+Super+Admin+role.",
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (error) {
    redirect(
      `/admin/users?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath("/admin/users");

  redirect(
    "/admin/users?message=User+role+updated+successfully.",
  );
}
