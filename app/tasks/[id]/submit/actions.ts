'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

function text(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function submitProof(formData: FormData) {
  const reservationId = text(formData.get('reservation_id'));
  const taskId = text(formData.get('task_id'));
  const viewCountRaw = text(formData.get('view_count'));
  const viewCount = viewCountRaw ? Number(viewCountRaw) : null;

  const supabase = await createClient();

  const { error } = await supabase.rpc('submit_task_proof', {
    p_reservation_id: reservationId,
    p_proof_type: text(formData.get('proof_type')) || 'image',
    p_proof_url: text(formData.get('proof_url')),
    p_proof_text: text(formData.get('proof_text')) || null,
    p_view_count: Number.isFinite(viewCount) ? viewCount : null,
  });

  if (error) {
    redirect(
      `/tasks/${taskId}/submit?reservation=${reservationId}&error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath('/tasks');
  revalidatePath('/dashboard');
  redirect('/dashboard?proof=submitted');
}
