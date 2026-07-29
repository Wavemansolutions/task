"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestWithdrawal(
  formData: FormData,
) {
  const amount = Number(
    formData.get("amount") ?? 0,
  );

  const bankName = String(
    formData.get("bank_name") ?? "",
  ).trim();

  const accountName = String(
    formData.get("account_name") ?? "",
  ).trim();

  const accountNumber = String(
    formData.get("account_number") ?? "",
  ).trim();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc(
    "create_withdrawal_request",
    {
      p_amount: amount,
      p_bank_name: bankName,
      p_account_name: accountName,
      p_account_number: accountNumber,
    },
  );

  if (error) {
    redirect(
      "/wallet/withdraw?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/wallet");
  revalidatePath("/wallet/withdraw");
  revalidatePath("/admin/withdrawals");

  redirect(
    "/wallet/withdraw?message=" +
      encodeURIComponent(
        "Withdrawal request submitted successfully.",
      ),
  );
}
