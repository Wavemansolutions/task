'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

function text(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function claimReview(formData: FormData) {
  const id = text(formData.get('submission_id'));
  const supabase = await createClient();
  const { error } = await supabase.rpc('claim_submission_for_review', {
    p_submission_id: id,
  });

  if (error) {
    redirect(`/admin/reviews?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/reviews');
  redirect(`/admin/reviews/${id}`);
}

export async function approveReview(formData: FormData) {
  const id = text(formData.get('submission_id'));
  const supabase = await createClient();
  const { error } = await supabase.rpc('approve_submission', {
    p_submission_id: id,
    p_review_note: text(formData.get('review_note')) || null,
  });

  if (error) {
    redirect(
      `/admin/reviews/${id}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath('/admin/reviews');
  revalidatePath(`/admin/reviews/${id}`);
  redirect('/admin/reviews?approved=true');
}

export async function rejectReview(formData: FormData) {
  const id = text(formData.get('submission_id'));
  const supabase = await createClient();
  const { error } = await supabase.rpc('reject_submission', {
    p_submission_id: id,
    p_rejection_reason: text(formData.get('rejection_reason')),
    p_restore_slot: formData.get('restore_slot') === 'on',
  });

  if (error) {
    redirect(
      `/admin/reviews/${id}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath('/admin/reviews');
  revalidatePath(`/admin/reviews/${id}`);
  redirect('/admin/reviews?rejected=true');
}
