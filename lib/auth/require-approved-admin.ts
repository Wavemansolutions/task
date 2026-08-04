import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

const approvedAdminRoles = new Set([
  'super_admin',
  'task_manager',
  'proof_reviewer',
  'finance_admin',
  'support_admin',
  'auditor',
]);

type AdminProfile = {
  id: string;
  full_name: string | null;
  role: string | null;
  account_status: string | null;
};

export async function requireApprovedAdmin() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      '/login?error=Please+sign+in+to+continue.',
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('profiles')
    .select(
      'id,full_name,role,account_status',
    )
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    redirect(
      '/dashboard?error=Administrator+profile+could+not+be+verified.',
    );
  }

  const profile =
    data as unknown as AdminProfile;

  if (
    profile.account_status !==
    'approved'
  ) {
    redirect(
      '/dashboard?error=Your+administrator+account+has+not+been+approved.',
    );
  }

  if (
    !profile.role ||
    !approvedAdminRoles.has(
      profile.role,
    )
  ) {
    redirect(
      '/dashboard?error=You+are+not+authorized+to+access+the+administrator+area.',
    );
  }

  return {
    supabase,
    user,
    profile,
  };
}