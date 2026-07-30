'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

function text(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function savePayoutAccount(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('save_payout_account', {
    p_account_name: text(formData.get('account_name')),
    p_account_number: text(formData.get('account_number')),
    p_bank_name: text(formData.get('bank_name')),
    p_bank_code: text(formData.get('bank_code')) || null,
    p_provider: 'bank',
  });

  if (error) {
    redirect(`/wallet?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/wallet');
  redirect('/wallet?account=saved');
}

export async function requestWithdrawal(formData: FormData) {
  const supabase = await createClient();
  const amount = Number(text(formData.get('amount')));

  const { error } = await supabase.rpc('request_withdrawal', {
    p_amount: amount,
    p_payout_account_id: text(formData.get('payout_account_id')),
  });

  if (error) {
    redirect(`/wallet?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/wallet');
  revalidatePath('/dashboard');
  redirect('/wallet?withdrawal=requested');
}
