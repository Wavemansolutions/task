'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

function text(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalDate(value: FormDataEntryValue | null): string | null {
  const result = text(value);
  return result || null;
}

function numberValue(value: FormDataEntryValue | null): number {
  const result = Number(text(value));
  return Number.isFinite(result) ? result : 0;
}

export async function createCampaign(formData: FormData) {
  const supabase = await createClient();

  const payload = {
    p_title: text(formData.get('title')),
    p_description: text(formData.get('description')),
    p_client_name: text(formData.get('client_name')),
    p_total_budget: numberValue(formData.get('total_budget')),
    p_starts_at: optionalDate(formData.get('starts_at')),
    p_ends_at: optionalDate(formData.get('ends_at')),
    p_task_title: text(formData.get('task_title')),
    p_task_description: text(formData.get('task_description')),
    p_task_type: text(formData.get('task_type')) || 'general',
    p_reward_amount: numberValue(formData.get('reward_amount')),
    p_total_slots: numberValue(formData.get('total_slots')),
    p_daily_limit: numberValue(formData.get('daily_limit')) || 20,
  };

  const { data, error } = await supabase.rpc(
    'admin_create_campaign',
    payload
  );

  if (error) {
    redirect(
      `/admin/campaigns/new?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath('/admin/campaigns');
  redirect(`/admin/campaigns/${data}`);
}

export async function setCampaignStatus(formData: FormData) {
  const supabase = await createClient();
  const campaignId = text(formData.get('campaign_id'));
  const status = text(formData.get('status'));

  const { error } = await supabase.rpc(
    'admin_set_campaign_status',
    {
      p_campaign_id: campaignId,
      p_status: status,
    }
  );

  if (error) {
    redirect(
      `/admin/campaigns/${campaignId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath('/admin/campaigns');
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function recalculateCampaignBudget(formData: FormData) {
  const supabase = await createClient();
  const campaignId = text(formData.get('campaign_id'));

  const { error } = await supabase.rpc(
    'admin_recalculate_campaign_budget',
    { p_campaign_id: campaignId }
  );

  if (error) {
    redirect(
      `/admin/campaigns/${campaignId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath('/admin/campaigns');
  revalidatePath(`/admin/campaigns/${campaignId}`);
}
