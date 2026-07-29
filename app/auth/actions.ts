"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const phone = String(formData.get("phone") ?? "").trim();

  const whatsappNumber = String(
    formData.get("whatsappNumber") ?? "",
  ).trim();

  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    redirect(
      `/register?error=${encodeURIComponent(
        "Name, email and password are required.",
      )}`,
    );
  }

  if (password.length < 8) {
    redirect(
      `/register?error=${encodeURIComponent(
        "Password must contain at least eight characters.",
      )}`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        whatsapp_number: whatsappNumber,
      },
    },
  });

  if (error) {
    redirect(
      `/register?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Registration successful. Check your email to confirm your account.",
    )}`,
  );
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Email and password are required.",
      )}`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}