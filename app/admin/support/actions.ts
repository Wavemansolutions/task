"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function assignTicket(formData: FormData) {
  const ticketId = String(formData.get("ticket_id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "assign_support_ticket",
    {
      p_ticket_id: ticketId,
      p_admin_id: null,
    },
  );

  if (error) {
    redirect(
      "/admin/support/" +
        ticketId +
        "?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/admin/support");
  revalidatePath("/admin/support/" + ticketId);
  redirect("/admin/support/" + ticketId);
}

export async function replyTicket(formData: FormData) {
  const ticketId = String(formData.get("ticket_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "admin_reply_support_ticket",
    {
      p_ticket_id: ticketId,
      p_message: message,
    },
  );

  if (error) {
    redirect(
      "/admin/support/" +
        ticketId +
        "?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/admin/support");
  revalidatePath("/admin/support/" + ticketId);
  redirect("/admin/support/" + ticketId);
}

export async function updateTicketStatus(
  formData: FormData,
) {
  const ticketId = String(formData.get("ticket_id") ?? "");
  const status = String(formData.get("status") ?? "open");
  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "admin_update_ticket_status",
    {
      p_ticket_id: ticketId,
      p_status: status,
    },
  );

  if (error) {
    redirect(
      "/admin/support/" +
        ticketId +
        "?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/admin/support");
  revalidatePath("/admin/support/" + ticketId);
  redirect("/admin/support/" + ticketId);
}
