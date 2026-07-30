'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

function text(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function safeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export async function uploadAndSubmitProof(formData: FormData) {
  const reservationId = text(formData.get('reservation_id'));
  const taskId = text(formData.get('task_id'));
  const proofText = text(formData.get('proof_text'));
  const viewCountRaw = text(formData.get('view_count'));
  const file = formData.get('proof_file');

  if (!(file instanceof File) || file.size === 0) {
    redirect(
      `/tasks/${taskId}/submit?reservation=${reservationId}&error=${encodeURIComponent(
        'Select a proof file.'
      )}`
    );
  }

  if (file.size > 15 * 1024 * 1024) {
    redirect(
      `/tasks/${taskId}/submit?reservation=${reservationId}&error=${encodeURIComponent(
        'Proof file must be 15 MB or smaller.'
      )}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const filename = `${Date.now()}-${safeFilename(file.name)}`;
  const storagePath = `${user.id}/${reservationId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from('task-proofs')
    .upload(storagePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    redirect(
      `/tasks/${taskId}/submit?reservation=${reservationId}&error=${encodeURIComponent(
        uploadError.message
      )}`
    );
  }

  const proofType =
    file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : file.type === 'application/pdf'
          ? 'document'
          : 'document';

  const viewCount = viewCountRaw ? Number(viewCountRaw) : null;

  const { data: submissionId, error: submitError } = await supabase.rpc(
    'submit_task_proof',
    {
      p_reservation_id: reservationId,
      p_proof_type: proofType,
      p_proof_url: storagePath,
      p_proof_text: proofText || null,
      p_view_count: Number.isFinite(viewCount) ? viewCount : null,
    }
  );

  if (submitError) {
    await supabase.storage.from('task-proofs').remove([storagePath]);

    redirect(
      `/tasks/${taskId}/submit?reservation=${reservationId}&error=${encodeURIComponent(
        submitError.message
      )}`
    );
  }

  await supabase
    .from('proof_submissions')
    .update({
      storage_bucket: 'task-proofs',
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type || null,
      file_size_bytes: file.size,
    })
    .eq('id', submissionId);

  revalidatePath('/tasks');
  revalidatePath('/dashboard');
  redirect('/dashboard?proof=submitted');
}
