'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function requireDeviceAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const allowedRoles = [
    'super_admin',
    'support_admin',
    'auditor',
  ];

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/dashboard?error=Unauthorized.');
  }

  return supabase;
}

export async function blockDevice(formData: FormData) {
  const supabase = await requireDeviceAdmin();

  const deviceId = String(
    formData.get('device_id') ?? '',
  ).trim();

  const reason = String(
    formData.get('reason') ?? '',
  ).trim();

  const { error } = await supabase
    .from('user_devices')
    .update({
      is_blocked: true,
      block_reason: reason || 'Blocked by administrator',
      updated_at: new Date().toISOString(),
    })
    .eq('id', deviceId);

  if (error) {
    redirect(
      `/admin/devices?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath('/admin/devices');
  redirect('/admin/devices?message=Device+blocked.');
}

export async function unblockDevice(formData: FormData) {
  const supabase = await requireDeviceAdmin();

  const deviceId = String(
    formData.get('device_id') ?? '',
  ).trim();

  const { error } = await supabase
    .from('user_devices')
    .update({
      is_blocked: false,
      block_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', deviceId);

  if (error) {
    redirect(
      `/admin/devices?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath('/admin/devices');
  redirect('/admin/devices?message=Device+unblocked.');
}