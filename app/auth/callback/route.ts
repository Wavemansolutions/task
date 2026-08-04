import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
) {
  const requestUrl =
    new URL(request.url);

  const code =
    requestUrl.searchParams.get('code');

  const origin =
    requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        'The confirmation link is invalid.',
      )}`,
    );
  }

  const supabase =
    await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(
      code,
    );

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/dashboard?message=${encodeURIComponent(
      'Email confirmed successfully.',
    )}`,
  );
}