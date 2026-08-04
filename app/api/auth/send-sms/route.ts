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
   * Supabase may display the hook secret as:
   *
   * v1,whsec_xxxxx
   * or
   * whsec_xxxxx
   *
   * standardwebhooks expects only the Base64 secret value.
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

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: {
        'Content-Type':
          'application/json; charset=utf-8',
        'Cache-Control':
          'no-store',
      },
    },
  );
}

export async function GET() {
  return jsonResponse(
    {
      status: 'ok',
      service:
        'Task Money KudiSMS hook',
      provider: 'KudiSMS',
      accepts: ['POST'],
    },
    200,
  );
}

export async function POST(
  request: NextRequest,
) {
  const contentType =
    request.headers.get(
      'content-type',
    ) ?? '';

  if (
    !contentType
      .toLowerCase()
      .includes('application/json')
  ) {
    return jsonResponse(
      {
        error: {
          http_code: 415,
          message:
            'Invalid Content-Type. application/json is required.',
        },
      },
      415,
    );
  }

  const rawBody =
    await request.text();

  if (!rawBody.trim()) {
    return jsonResponse(
      {
        error: {
          http_code: 400,
          message:
            'The SMS-hook request body is empty.',
        },
      },
      400,
    );
  }

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
      return jsonResponse(
        {
          error: {
            http_code: 400,
            message:
              'The hook request did not contain a phone number.',
          },
        },
        400,
      );
    }

    if (
      !otp ||
      !/^\d{6,10}$/.test(otp)
    ) {
      return jsonResponse(
        {
          error: {
            http_code: 400,
            message:
              'The hook request did not contain a valid OTP.',
          },
        },
        400,
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

          error:
            result.error,

          providerResponse:
            result.providerResponse,
        },
      );

      return jsonResponse(
        {
          error: {
            http_code: 502,
            message:
              result.error ||
              'The verification SMS could not be sent.',
          },
        },
        502,
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

    return jsonResponse(
      {},
      200,
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

    return jsonResponse(
      {
        error: {
          http_code: 401,
          message:
            'The SMS hook signature could not be verified.',
        },
      },
      401,
    );
  }
}