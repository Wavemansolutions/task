'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

function text(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function reserveTaskAction(formData: FormData) {
  const taskId = text(formData.get('task_id'));
  const fingerprint = text(formData.get('device_fingerprint'));
  const countryCode = text(formData.get('country_code')).toUpperCase();
  const isVpn = formData.get('is_vpn') === 'true';

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || null;
  const userAgent = requestHeaders.get('user-agent');

  const supabase = await createClient();

  const { error } = await supabase.rpc('reserve_task', {
    p_task_id: taskId,
    p_device_fingerprint: fingerprint || null,
    p_ip_address: ipAddress,
    p_user_agent: userAgent,
    p_country_code: countryCode || null,
    p_is_vpn: isVpn,
  });

  if (error) {
    redirect(`/tasks?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/tasks');
  revalidatePath('/dashboard');
  redirect('/tasks?reserved=true');
}
