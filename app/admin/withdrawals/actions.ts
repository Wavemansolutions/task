"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function reviewWithdrawal(
  formData: FormData,
  decision: "approved" | "rejected" | "paid",
) {
  const requestId = String(
    formData.get("request_id") ?? "",
  ).trim();

  const reviewNotes = String(
    formData.get("review_notes") ?? "",
  ).trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc(
    "review_withdrawal_request",
    {
      p_request_id: requestId,
      p_decision: decision,
      p_review_notes: reviewNotes || null,
    },
  );

  if (error) {
    redirect(
      "/admin/withdrawals/" +
        requestId +
        "?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/admin/withdrawals");
  revalidatePath(
    "/admin/withdrawals/" + requestId,
  );
  revalidatePath("/wallet");
  revalidatePath("/wallet/withdraw");
  revalidatePath("/admin/wallets");

  redirect(
    "/admin/withdrawals?message=" +
      encodeURIComponent(
        decision === "approved"
          ? "Withdrawal approved and wallet debited."
          : decision === "paid"
            ? "Withdrawal marked as paid."
            : "Withdrawal rejected.",
      ),
  );
}

export async function approveWithdrawal(
  formData: FormData,
) {
  return reviewWithdrawal(formData, "approved");
}

export async function rejectWithdrawal(
  formData: FormData,
) {
  return reviewWithdrawal(formData, "rejected");
}

export async function markWithdrawalPaid(
  formData: FormData,
) {
  return reviewWithdrawal(formData, "paid");
}
