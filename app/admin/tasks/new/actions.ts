'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

export async function createTaskAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    redirect(
      `/admin/tasks/new?error=${encodeURIComponent(
        profileError.message
      )}`
    );
  }

  const allowedRoles = [
    'super_admin',
    'admin',
    'task_manager',
  ];

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect(
      `/admin/tasks/new?error=${encodeURIComponent(
        'You do not have permission to create tasks.'
      )}`
    );
  }

  const title = getText(formData, 'title');
  const description = getText(formData, 'description');
  const instructions = getText(formData, 'instructions');
  const type = getText(formData, 'type');
  const taskUrl = getText(formData, 'task_url');
  const proofType = getText(formData, 'proof_type');
  const status = getText(formData, 'status');
  const socialPlatform = getText(formData, 'social_platform');
  const thumbnailUrl = getText(formData, 'thumbnail_url');
  const category = getText(formData, 'category');
  const proofInstructions = getText(formData, 'proof_instructions');
  const bannerHeadline = getText(formData, 'banner_headline');
  const adminNote = getText(formData, 'admin_note');

  const rewardAmount = Number(
    formData.get('reward_amount')
  );

  const totalSlots = Number(
    formData.get('total_slots')
  );

  const reservationMinutes = Number(formData.get('reservation_minutes') || 0);
  const minimumTrustScore = Number(formData.get('minimum_trust_score') || 0);
  const maxProofFiles = Number(formData.get('max_proof_files') || 1);
  const requireUniqueProof = formData.get('require_unique_proof') === 'true';

  const startsAt = getText(formData, 'starts_at');
  const endsAt = getText(formData, 'ends_at');

  if (title.length < 3) {
    redirect(
      `/admin/tasks/new?error=${encodeURIComponent(
        'Task title must contain at least three characters.'
      )}`
    );
  }

  if (!description) {
    redirect(
      `/admin/tasks/new?error=${encodeURIComponent(
        'Task description is required.'
      )}`
    );
  }

  if (!instructions) {
    redirect(
      `/admin/tasks/new?error=${encodeURIComponent(
        'Task instructions are required.'
      )}`
    );
  }

  if (
    !Number.isFinite(rewardAmount) ||
    rewardAmount <= 0
  ) {
    redirect(
      `/admin/tasks/new?error=${encodeURIComponent(
        'Enter a valid task reward.'
      )}`
    );
  }

  if (
    !Number.isInteger(totalSlots) ||
    totalSlots <= 0
  ) {
    redirect(
      `/admin/tasks/new?error=${encodeURIComponent(
        'Enter a valid number of workers.'
      )}`
    );
  }

  if (
    startsAt &&
    endsAt &&
    new Date(endsAt) <= new Date(startsAt)
  ) {
    redirect(
      `/admin/tasks/new?error=${encodeURIComponent(
        'The end date must be after the start date.'
      )}`
    );
  }

  /*
   * Create a campaign because campaign_id was previously
   * required by your tasks table.
   */
  const { data: campaign, error: campaignError } =
    await supabase
      .from('campaigns')
      .insert({
        name: title,
        title,
        description,
        owner_id: user.id,
        created_by: user.id,
        status:
          status === 'active' ? 'active' : 'draft',
      })
      .select('id')
      .single();

  if (campaignError || !campaign) {
    console.error('CAMPAIGN_CREATE_ERROR', campaignError);

    redirect(
      `/admin/tasks/new?error=${encodeURIComponent(
        campaignError?.message ??
          'Campaign could not be created.'
      )}`
    );
  }

  const baseTask = {
    campaign_id: campaign.id,
    title,
    description,
    instructions,
    type,
    task_url: taskUrl || null,
    proof_type: proofType,
    reward_amount: rewardAmount,
    total_slots: totalSlots,
    slots_available: totalSlots,
    status,
    starts_at: startsAt ? new Date(startsAt).toISOString() : null,
    ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    created_by: user.id,
  };

  const enhancedTask = {
    ...baseTask,
    social_platform: socialPlatform || null,
    thumbnail_url: thumbnailUrl || null,
    category: category || null,
    proof_instructions: proofInstructions || null,
    banner_headline: bannerHeadline || null,
    admin_note: adminNote || null,
    reservation_minutes: reservationMinutes > 0 ? reservationMinutes : null,
    minimum_trust_score: minimumTrustScore > 0 ? minimumTrustScore : 0,
    max_proof_files: maxProofFiles > 0 ? maxProofFiles : 1,
    require_unique_proof: requireUniqueProof,
  };

  let { error: taskError } = await supabase.from('tasks').insert(enhancedTask);

  // Older Task Money databases may not yet contain the optional UI columns.
  // Retry with the established core schema instead of crashing task creation.
  if (taskError && /column .* does not exist|schema cache/i.test(taskError.message)) {
    const retry = await supabase.from('tasks').insert(baseTask);
    taskError = retry.error;
  }

  if (taskError) {
    console.error('TASK_CREATE_ERROR', taskError);

    await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaign.id);

    redirect(
      `/admin/tasks/new?error=${encodeURIComponent(
        taskError.message
      )}`
    );
  }

  revalidatePath('/tasks');
  revalidatePath('/admin/tasks');

  redirect('/admin/tasks?created=1');
}