"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(
  formData: FormData,
) {
  const notificationId = String(
    formData.get("notification_id") ?? "",
  ).trim();

  const link = String(
    formData.get("link") ?? "/notifications",
  ).trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc(
    "mark_notification_read",
    {
      p_notification_id: notificationId,
    },
  );

  if (error) {
    redirect(
      "/notifications?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");

  redirect(link || "/notifications");
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc(
    "mark_all_notifications_read",
  );

  if (error) {
    redirect(
      "/notifications?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");

  redirect(
    "/notifications?message=" +
      encodeURIComponent(
        "All notifications marked as read.",
      ),
  );
}
