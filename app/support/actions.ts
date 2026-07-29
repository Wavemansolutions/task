"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createSupportTicket(
  formData: FormData,
) {
  const subject = String(
    formData.get("subject") ?? "",
  ).trim();

  const category = String(
    formData.get("category") ?? "general",
  );

  const priority = String(
    formData.get("priority") ?? "normal",
  );

  const message = String(
    formData.get("message") ?? "",
  ).trim();

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "create_support_ticket",
    {
      p_subject: subject,
      p_category: category,
      p_priority: priority,
      p_message: message,
    },
  );

  if (error) {
    redirect(
      "/support/new?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/support");
  revalidatePath("/admin/support");

  redirect(
    "/support?message=" +
      encodeURIComponent(
        "Support ticket created successfully.",
      ),
  );
}

export async function replySupportTicket(
  formData: FormData,
) {
  const ticketId = String(
    formData.get("ticket_id") ?? "",
  );

  const message = String(
    formData.get("message") ?? "",
  ).trim();

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "reply_support_ticket",
    {
      p_ticket_id: ticketId,
      p_message: message,
    },
  );

  if (error) {
    redirect(
      "/support/" +
        ticketId +
        "?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/support/" + ticketId);
  revalidatePath("/admin/support/" + ticketId);

  redirect("/support/" + ticketId);
}
