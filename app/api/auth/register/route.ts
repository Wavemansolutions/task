import { NextRequest, NextResponse } from 'next/server';

import { normalizeNigerianPhone } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RegistrationBody = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegistrationBody;

    const fullName =
      typeof body.fullName === 'string'
        ? body.fullName.trim()
        : '';

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    const rawPhone =
      typeof body.phone === 'string'
        ? body.phone
        : '';

    const password =
      typeof body.password === 'string'
        ? body.password
        : '';

    if (fullName.length < 2) {
      return jsonError('Enter your full name.', 400);
    }

    if (!email || !email.includes('@')) {
      return jsonError('Enter a valid email address.', 400);
    }

    if (password.length < 8) {
      return jsonError(
        'Password must contain at least 8 characters.',
        400,
      );
    }

    const phone = normalizeNigerianPhone(rawPhone);
    const supabase = await createClient();

    const { data: existingPhone, error: phoneLookupError } =
      await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

    if (phoneLookupError) {
      console.error('PHONE_LOOKUP_ERROR', phoneLookupError.message);

      return jsonError(
        'Registration could not be completed.',
        500,
      );
    }

    if (existingPhone) {
      return jsonError(
        'This phone number is already connected to an account. Sign in instead.',
        409,
      );
    }

    const { data, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
          emailRedirectTo: `${request.nextUrl.origin}/login?confirmed=true`,
        },
      });

    if (signUpError) {
      return jsonError(signUpError.message, signUpError.status ?? 400);
    }

    const user = data.user;

    if (!user) {
      return jsonError(
        'Registration completed, but the account could not be loaded.',
        500,
      );
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          phone,
          phone_verified: false,
        },
        {
          onConflict: 'id',
        },
      );

    if (profileError) {
      if (
        profileError.code === '23505' ||
        /duplicate key|unique constraint/i.test(profileError.message)
      ) {
        return jsonError(
          'This phone number is already connected to an account.',
          409,
        );
      }

      console.error('PROFILE_CREATE_ERROR', profileError.message);

      return jsonError(
        'The account was created, but the profile could not be saved.',
        500,
      );
    }

    return NextResponse.json(
      {
        success: true,
        requiresEmailConfirmation: !data.session,
        message: data.session
          ? 'Account created successfully.'
          : 'Account created. Check your email and confirm your address before signing in.',
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return jsonError(
      error instanceof Error
        ? error.message
        : 'Registration could not be completed.',
      400,
    );
  }
}