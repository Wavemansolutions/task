import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { Webhook } from 'standardwebhooks';

import { sendSms } from '@/lib/sms/send-sms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SupabaseSmsHookPayload = {
  user?: {
    id?: string;
    phone?: string;
  };

  sms?: {
    otp?: string;
  };
};

function getWebhookSecret(): string {
  const rawSecret =
    process.env
      .SUPABASE_SEND_SMS_HOOK_SECRET
      ?.trim();

  if (!rawSecret) {
    throw new Error(
      'SUPABASE_SEND_SMS_HOOK_SECRET is missing.',
    );
  }

  /*
   * Supabase hook secrets may be shown as:
   *
   * v1,whsec_xxxxxxxxx
   * or
   * whsec_xxxxxxxxx
   *
   * standardwebhooks expects only the base64 secret part.
   */
  const normalizedSecret = rawSecret
    .replace(/^v1,whsec_/, '')
    .replace(/^whsec_/, '')
    .trim();

  if (!normalizedSecret) {
    throw new Error(
      'SUPABASE_SEND_SMS_HOOK_SECRET is invalid.',
    );
  }

  return normalizedSecret;
}

function formatOtpMessage(
  otp: string,
): string {
  return (
    `Your Task Money verification code is ${otp}. ` +
    'It expires shortly. Do not share this code with anyone.'
  );
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service:
        'Task Money KudiSMS hook',
      provider: 'KudiSMS',
      accepts: ['POST'],
    },
    {
      status: 200,
    },
  );
}

export async function POST(
  request: NextRequest,
) {
  const rawBody =
    await request.text();

  try {
    const webhook =
      new Webhook(
        getWebhookSecret(),
      );

    const payload =
      webhook.verify(
        rawBody,
        {
          'webhook-id':
            request.headers.get(
              'webhook-id',
            ) ?? '',

          'webhook-timestamp':
            request.headers.get(
              'webhook-timestamp',
            ) ?? '',

          'webhook-signature':
            request.headers.get(
              'webhook-signature',
            ) ?? '',
        },
      ) as SupabaseSmsHookPayload;

    const phone =
      payload.user?.phone?.trim();

    const otp =
      payload.sms?.otp?.trim();

    if (!phone) {
      return NextResponse.json(
        {
          error: {
            http_code: 400,
            message:
              'The hook request did not contain a phone number.',
          },
        },
        {
          status: 400,
        },
      );
    }

    if (
      !otp ||
      !/^\d{6,10}$/.test(otp)
    ) {
      return NextResponse.json(
        {
          error: {
            http_code: 400,
            message:
              'The hook request did not contain a valid OTP.',
          },
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await sendSms({
        phone,
        message:
          formatOtpMessage(otp),
      });

    if (!result.success) {
      console.error(
        'KUDISMS_DELIVERY_ERROR',
        {
          phoneLastFour:
            phone.slice(-4),

          error: result.error,

          providerResponse:
            result.providerResponse,
        },
      );

      return NextResponse.json(
        {
          error: {
            http_code: 502,
            message:
              result.error ||
              'The verification SMS could not be sent.',
          },
        },
        {
          status: 502,
        },
      );
    }

    console.info(
      'KUDISMS_DELIVERY_ACCEPTED',
      {
        phoneLastFour:
          phone.slice(-4),

        providerMessageId:
          result.providerMessageId ??
          null,
      },
    );

    return new NextResponse(
      null,
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown webhook error';

    console.error(
      'TASK_MONEY_SMS_HOOK_ERROR',
      message,
    );

    return NextResponse.json(
      {
        error: {
          http_code: 401,
          message:
            'The SMS hook signature could not be verified.',
        },
      },
      {
        status: 401,
      },
    );
  }
}