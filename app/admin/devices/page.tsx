import { redirect } from 'next/navigation';

import {
  blockDevice,
  unblockDevice,
} from './actions';

import { AppShell } from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';

type DeviceRecord = {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  device_type: string | null;
  ip_address: string | null;
  country_code: string | null;
  country_name: string | null;
  city: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_login_at: string | null;
  login_count: number;
  is_trusted: boolean;
  is_blocked: boolean;
  block_reason: string | null;
  profiles:
    | {
        full_name: string | null;
        phone: string | null;
      }
    | {
        full_name: string | null;
        phone: string | null;
      }[]
    | null;
};

function relatedProfile(
  relation: DeviceRecord['profiles'],
) {
  return Array.isArray(relation)
    ? relation[0] ?? null
    : relation;
}

export default async function AdminDevicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('full_name,role')
    .eq('id', user.id)
    .maybeSingle();

  const allowedRoles = [
    'super_admin',
    'support_admin',
    'auditor',
  ];

  if (
    !currentProfile ||
    !allowedRoles.includes(currentProfile.role)
  ) {
    redirect('/dashboard?error=Unauthorized.');
  }

  const { data, error } = await supabase
    .from('user_devices')
    .select(`
      id,
      user_id,
      device_fingerprint,
      device_name,
      browser_name,
      browser_version,
      operating_system,
      device_type,
      ip_address,
      country_code,
      country_name,
      city,
      first_seen_at,
      last_seen_at,
      last_login_at,
      login_count,
      is_trusted,
      is_blocked,
      block_reason,
      profiles!user_devices_user_id_fkey (
        full_name,
        phone
      )
    `)
    .order('last_seen_at', {
      ascending: false,
    });

  const devices = (data ?? []) as DeviceRecord[];

  return (
    <AppShell
      userName={
        currentProfile.full_name ||
        user.email?.split('@')[0] ||
        'Administrator'
      }
      userRole={currentProfile.role}
      isAdmin
    >
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header>
          <p className="text-sm font-bold uppercase tracking-wider text-green-600">
            Security
          </p>

          <h1 className="mt-2 text-3xl font-black">
            User Devices
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review account devices, fingerprints, IP addresses
            and login history.
          </p>
        </header>

        {query.message ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            {query.message}
          </div>
        ) : null}

        {query.error || error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {query.error ?? error?.message}
          </div>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Device</th>
                  <th className="px-5 py-4">Browser</th>
                  <th className="px-5 py-4">IP address</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Logins</th>
                  <th className="px-5 py-4">Last seen</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {devices.map((device) => {
                  const profile = relatedProfile(
                    device.profiles,
                  );

                  return (
                    <tr key={device.id}>
                      <td className="px-5 py-4">
                        <p className="font-bold">
                          {profile?.full_name ||
                            'Unnamed user'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {profile?.phone ||
                            device.user_id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold">
                          {device.device_name ||
                            'Unknown device'}
                        </p>

                        <p className="mt-1 text-xs capitalize text-slate-500">
                          {device.device_type ||
                            'Unknown type'}
                        </p>

                        <p className="mt-1 max-w-[180px] truncate font-mono text-[10px] text-slate-400">
                          {device.device_fingerprint}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p>
                          {device.browser_name ||
                            'Unknown browser'}
                        </p>

                        <p className="text-xs text-slate-500">
                          {device.operating_system ||
                            'Unknown OS'}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-mono text-sm">
                        {device.ip_address || '—'}
                      </td>

                      <td className="px-5 py-4">
                        {[
                          device.city,
                          device.country_name,
                          device.country_code,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'Unknown'}
                      </td>

                      <td className="px-5 py-4">
                        {device.login_count}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {new Date(
                          device.last_seen_at,
                        ).toLocaleString('en-NG')}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            device.is_blocked
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {device.is_blocked
                            ? 'Blocked'
                            : 'Active'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {device.is_blocked ? (
                          <form action={unblockDevice}>
                            <input
                              type="hidden"
                              name="device_id"
                              value={device.id}
                            />

                            <button className="rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white">
                              Unblock
                            </button>
                          </form>
                        ) : (
                          <form
                            action={blockDevice}
                            className="flex gap-2"
                          >
                            <input
                              type="hidden"
                              name="device_id"
                              value={device.id}
                            />

                            <input
                              name="reason"
                              placeholder="Reason"
                              className="w-32 rounded-lg border px-2 py-2 text-xs"
                            />

                            <button className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">
                              Block
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!devices.length ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      No devices have been registered.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AppShell>
  );
}