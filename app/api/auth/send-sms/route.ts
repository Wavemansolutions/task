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
  const secret =
    process.env
      .SUPABASE_SEND_SMS_HOOK_SECRET
      ?.trim();

  if (!secret) {
    throw new Error(
      'SUPABASE_SEND_SMS_HOOK_SECRET is missing.',
    );
  }

  return secret;
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
    console.error(
      'TASK_MONEY_SMS_HOOK_ERROR',
      error instanceof Error
        ? error.message
        : error,
    );

    return NextResponse.json(
      {
        error: {
          http_code: 401,
          message:
            'Invalid SMS-hook request.',
        },
      },
      {
        status: 401,
      },
    );
  }
}