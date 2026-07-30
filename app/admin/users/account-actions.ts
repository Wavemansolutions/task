"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateAccountStatus(
  formData: FormData,
) {
  const userId = String(formData.get("user_id") ?? "");
  const status = String(
    formData.get("account_status") ?? "active",
  );
  const reason = String(
    formData.get("reason") ?? "",
  ).trim();

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "admin_set_account_status",
    {
      p_user_id: userId,
      p_status: status,
      p_reason: reason || null,
    },
  );

  if (error) {
    redirect(
      "/admin/users?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");

  redirect(
    "/admin/users?message=" +
      encodeURIComponent(
        "Account status updated successfully.",
      ),
  );
}
