'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

function text(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: FormDataEntryValue | null): number {
  const parsed = Number(text(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function boolValue(value: FormDataEntryValue | null): boolean {
  return value === 'on' || value === 'true';
}

function csvArray(value: FormDataEntryValue | null): string[] {
  return text(value)
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

export async function addCampaignTask(formData: FormData) {
  const campaignId = text(formData.get('campaign_id'));
  const supabase = await createClient();

  const { error } = await supabase.rpc('admin_add_campaign_task', {
    p_campaign_id: campaignId,
    p_title: text(formData.get('title')),
    p_description: text(formData.get('description')),
    p_type: text(formData.get('type')) || 'general',
    p_reward_amount: numberValue(formData.get('reward_amount')),
    p_total_slots: numberValue(formData.get('total_slots')),
    p_daily_limit: numberValue(formData.get('daily_limit')) || 20,
    p_reservation_minutes:
      numberValue(formData.get('reservation_minutes')) || 60,
    p_minimum_trust_score:
      numberValue(formData.get('minimum_trust_score')) || 0,
  });

  if (error) {
    redirect(
      `/admin/campaigns/${campaignId}/tasks/new?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath('/admin/campaigns');
  redirect(`/admin/campaigns/${campaignId}`);
}

export async function saveCampaignRules(formData: FormData) {
  const campaignId = text(formData.get('campaign_id'));
  const supabase = await createClient();

  const { error } = await supabase.rpc('admin_save_campaign_rules', {
    p_campaign_id: campaignId,
    p_minimum_trust_score:
      numberValue(formData.get('minimum_trust_score')) || 0,
    p_maximum_daily_tasks:
      numberValue(formData.get('maximum_daily_tasks')) || 20,
    p_allowed_countries: csvArray(formData.get('allowed_countries')),
    p_blocked_countries: csvArray(formData.get('blocked_countries')),
    p_require_verified_phone: boolValue(
      formData.get('require_verified_phone')
    ),
    p_require_verified_email: boolValue(
      formData.get('require_verified_email')
    ),
    p_block_vpn: boolValue(formData.get('block_vpn')),
    p_block_duplicate_device: boolValue(
      formData.get('block_duplicate_device')
    ),
    p_block_duplicate_ip: boolValue(
      formData.get('block_duplicate_ip')
    ),
    p_minimum_account_age_days:
      numberValue(formData.get('minimum_account_age_days')) || 0,
  });

  if (error) {
    redirect(
      `/admin/campaigns/${campaignId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  revalidatePath(`/admin/campaigns/${campaignId}`);
  redirect(`/admin/campaigns/${campaignId}?saved=rules`);
}
