"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createFraudFlag(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const severity = String(
    formData.get("severity") ?? "medium",
  );

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "admin_create_fraud_flag",
    {
      p_user_id: userId,
      p_reason: reason,
      p_severity: severity,
      p_evidence: {},
    },
  );

  if (error) {
    redirect(
      "/admin/fraud/new?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/admin/fraud");
  redirect(
    "/admin/fraud?message=" +
      encodeURIComponent("Fraud flag created."),
  );
}

export async function resolveFraudFlag(
  formData: FormData,
) {
  const flagId = String(formData.get("flag_id") ?? "");
  const status = String(formData.get("status") ?? "reviewing");
  const notes = String(
    formData.get("resolution_notes") ?? "",
  ).trim();

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "admin_resolve_fraud_flag",
    {
      p_flag_id: flagId,
      p_status: status,
      p_resolution_notes: notes,
    },
  );

  if (error) {
    redirect(
      "/admin/fraud/" +
        flagId +
        "?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/admin/fraud");
  revalidatePath("/admin/fraud/" + flagId);
  redirect("/admin/fraud/" + flagId);
}
