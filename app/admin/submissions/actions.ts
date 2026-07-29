"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireReviewer() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const allowedRoles = [
    "super_admin",
    "task_manager",
    "proof_reviewer",
  ];

  if (!allowedRoles.includes(profile?.role ?? "")) {
    redirect(
      "/dashboard?error=" +
        encodeURIComponent(
          "You are not allowed to review proofs.",
        ),
    );
  }

  return supabase;
}

async function reviewSubmission(
  formData: FormData,
  decision: "approved" | "rejected",
) {
  const submissionId = String(
    formData.get("submission_id") ?? "",
  ).trim();

  const reviewNotes = String(
    formData.get("review_notes") ?? "",
  ).trim();

  if (!submissionId) {
    redirect(
      "/admin/submissions?error=" +
        encodeURIComponent(
          "Submission ID is required.",
        ),
    );
  }

  const supabase = await requireReviewer();

  const { error } = await supabase.rpc(
    "review_task_submission",
    {
      p_submission_id: submissionId,
      p_decision: decision,
      p_review_notes: reviewNotes || null,
    },
  );

  if (error) {
    redirect(
      "/admin/submissions/" +
        submissionId +
        "?error=" +
        encodeURIComponent(error.message),
    );
  }

  revalidatePath("/admin/submissions");
  revalidatePath(
    "/admin/submissions/" + submissionId,
  );
  revalidatePath("/dashboard");

  redirect(
    "/admin/submissions?message=" +
      encodeURIComponent(
        decision === "approved"
          ? "Submission approved."
          : "Submission rejected.",
      ),
  );
}

export async function approveSubmission(
  formData: FormData,
) {
  return reviewSubmission(formData, "approved");
}

export async function rejectSubmission(
  formData: FormData,
) {
  return reviewSubmission(formData, "rejected");
}
