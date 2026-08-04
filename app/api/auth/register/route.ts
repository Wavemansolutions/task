import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { normalizeNigerianPhone } from '@/lib/phone';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RegistrationBody = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
};

function jsonError(
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

function isDuplicateError(
  code: string | undefined,
  message: string,
) {
  return (
    code === '23505' ||
    /duplicate key|unique constraint|already registered|already exists/i.test(
      message,
    )
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      (await request.json()) as RegistrationBody;

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
      return jsonError(
        'Enter your full name.',
        400,
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return jsonError(
        'Enter a valid email address.',
        400,
      );
    }

    if (password.length < 8) {
      return jsonError(
        'Password must contain at least 8 characters.',
        400,
      );
    }

    const phone =
      normalizeNigerianPhone(rawPhone);

    const admin =
      createAdminClient();

    // Check both values using the trusted server client.
    const [
      emailLookup,
      phoneLookup,
    ] = await Promise.all([
      admin
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .limit(1)
        .maybeSingle(),

      admin
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .limit(1)
        .maybeSingle(),
    ]);

    if (emailLookup.error) {
      console.error(
        'REGISTER_EMAIL_LOOKUP_ERROR',
        emailLookup.error.message,
      );

      return jsonError(
        'Registration could not be completed.',
        500,
      );
    }

    if (phoneLookup.error) {
      console.error(
        'REGISTER_PHONE_LOOKUP_ERROR',
        phoneLookup.error.message,
      );

      return jsonError(
        'Registration could not be completed.',
        500,
      );
    }

    if (emailLookup.data) {
      return jsonError(
        'An account already exists with this email address. Sign in instead.',
        409,
      );
    }

    if (phoneLookup.data) {
      return jsonError(
        'This phone number is already connected to an account. Sign in instead.',
        409,
      );
    }

    const supabase =
      await createClient();

    const {
      data,
      error: signUpError,
    } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            `${request.nextUrl.origin}/auth/callback`,

          data: {
            full_name: fullName,
            phone,
          },
        },
      });

    if (signUpError) {
      if (
        isDuplicateError(
          signUpError.code,
          signUpError.message,
        )
      ) {
        return jsonError(
          'An account already exists with this email address or phone number.',
          409,
        );
      }

      console.error(
        'REGISTER_AUTH_ERROR',
        {
          message:
            signUpError.message,
          code:
            signUpError.code,
          status:
            signUpError.status,
        },
      );

      return jsonError(
        signUpError.message ||
          'Registration could not be completed.',
        signUpError.status ?? 400,
      );
    }

    if (!data.user) {
      return jsonError(
        'The account could not be created.',
        500,
      );
    }

    /*
     * Do not insert into profiles here.
     *
     * The database trigger creates the profile as part
     * of the Auth-user transaction. This works even
     * when email confirmation is enabled and no session
     * has been issued yet.
     */

    return NextResponse.json(
      {
        success: true,

        requiresEmailConfirmation:
          !data.session,

        message:
          data.session
            ? 'Account created successfully.'
            : 'Account created. Check your email and confirm your address before signing in.',
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Registration could not be completed.';

    console.error(
      'REGISTER_ROUTE_ERROR',
      message,
    );

    return jsonError(
      message,
      400,
    );
  }
}