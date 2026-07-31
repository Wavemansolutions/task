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

  const rewardAmount = Number(
    formData.get('reward_amount')
  );

  const totalSlots = Number(
    formData.get('total_slots')
  );

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
        description,
        owner_id: user.id,
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

  const { error: taskError } = await supabase
    .from('tasks')
    .insert({
      campaign_id: campaign.id,
      title,
      description,
      instructions: instructions || null,
      type,
      task_url: taskUrl || null,
      proof_type: proofType,
      reward_amount: rewardAmount,
      total_slots: totalSlots,
      slots_available: totalSlots,
      status,
      starts_at: startsAt
        ? new Date(startsAt).toISOString()
        : null,
      ends_at: endsAt
        ? new Date(endsAt).toISOString()
        : null,
      created_by: user.id,
    });

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