'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

type RegisterDeviceInput = {
  fingerprint: string;
  deviceName: string;
  browserName: string;
  browserVersion: string;
  operatingSystem: string;
  deviceType: string;
  userAgent: string;
};

export async function registerCurrentDevice(
  input: RegisterDeviceInput,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const requestHeaders = await headers();

  const forwardedFor =
    requestHeaders.get('x-forwarded-for');

  const ipAddress =
    forwardedFor?.split(',')[0]?.trim() ||
    requestHeaders.get('x-real-ip') ||
    null;

  const countryCode =
    requestHeaders.get('x-vercel-ip-country') ||
    requestHeaders.get('cf-ipcountry') ||
    null;

  const countryName = null;

  const city =
    requestHeaders.get('x-vercel-ip-city') ||
    null;

  const { data, error } = await supabase.rpc(
    'register_user_device',
    {
      p_device_fingerprint: input.fingerprint,
      p_device_name: input.deviceName,
      p_browser_name: input.browserName,
      p_browser_version: input.browserVersion,
      p_operating_system: input.operatingSystem,
      p_device_type: input.deviceType,
      p_ip_address: ipAddress,
      p_country_code: countryCode,
      p_country_name: countryName,
      p_city: city,
      p_user_agent: input.userAgent,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}