'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

function text(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function claimWithdrawal(formData: FormData) {
  const id = text(formData.get('withdrawal_id'));
  const supabase = await createClient();
  const { error } = await supabase.rpc('claim_withdrawal_for_review', {
    p_withdrawal_id: id,
  });

  if (error) {
    redirect(`/admin/finance/withdrawals?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/finance/withdrawals');
  redirect(`/admin/finance/withdrawals/${id}`);
}

export async function approveWithdrawal(formData: FormData) {
  const id = text(formData.get('withdrawal_id'));
  const supabase = await createClient();
  const { error } = await supabase.rpc('approve_withdrawal', {
    p_withdrawal_id: id,
    p_review_note: text(formData.get('review_note')) || null,
  });

  if (error) {
    redirect(`/admin/finance/withdrawals/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/finance/withdrawals');
  redirect(`/admin/finance/withdrawals/${id}?approved=true`);
}

export async function rejectWithdrawal(formData: FormData) {
  const id = text(formData.get('withdrawal_id'));
  const supabase = await createClient();
  const { error } = await supabase.rpc('reject_withdrawal', {
    p_withdrawal_id: id,
    p_reason: text(formData.get('reason')),
  });

  if (error) {
    redirect(`/admin/finance/withdrawals/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/finance/withdrawals');
  redirect('/admin/finance/withdrawals?rejected=true');
}

export async function markWithdrawalPaid(formData: FormData) {
  const id = text(formData.get('withdrawal_id'));
  const supabase = await createClient();
  const { error } = await supabase.rpc('mark_withdrawal_paid', {
    p_withdrawal_id: id,
    p_payment_reference: text(formData.get('payment_reference')),
    p_provider_response: {},
  });

  if (error) {
    redirect(`/admin/finance/withdrawals/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/finance/withdrawals');
  redirect('/admin/finance/withdrawals?paid=true');
}
