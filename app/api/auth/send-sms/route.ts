import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";

import { sendSms } from "@/lib/sms/send-sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    process.env.SUPABASE_SEND_SMS_HOOK_SECRET;

  if (!secret) {
    throw new Error(
      "SUPABASE_SEND_SMS_HOOK_SECRET is missing.",
    );
  }

  return secret;
}

function formatOtpMessage(otp: string): string {
  return [
    `Your Task Money verification code is ${otp}.`,
    "It expires shortly.",
    "Do not share this code with anyone.",
  ].join(" ");
}

export async function POST(
  request: NextRequest,
) {
  const rawBody = await request.text();

  try {
    const webhook = new Webhook(
      getWebhookSecret(),
    );

    const payload = webhook.verify(
      rawBody,
      {
        "webhook-id":
          request.headers.get("webhook-id") ??
          "",
        "webhook-timestamp":
          request.headers.get(
            "webhook-timestamp",
          ) ?? "",
        "webhook-signature":
          request.headers.get(
            "webhook-signature",
          ) ?? "",
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
              "SMS hook did not contain a phone number.",
          },
        },
        {
          status: 400,
        },
      );
    }

    if (!otp || !/^\d{6,10}$/.test(otp)) {
      return NextResponse.json(
        {
          error: {
            http_code: 400,
            message:
              "SMS hook did not contain a valid OTP.",
          },
        },
        {
          status: 400,
        },
      );
    }

    const delivery = await sendSms({
      phone,
      message: formatOtpMessage(otp),
    });

    if (!delivery.success) {
      console.error(
        "TASK_MONEY_SMS_DELIVERY_ERROR",
        {
          phoneLastFour: phone.slice(-4),
          error: delivery.error,
        },
      );

      return NextResponse.json(
        {
          error: {
            http_code: 502,
            message:
              "The verification message could not be sent.",
          },
        },
        {
          status: 502,
        },
      );
    }

    return new NextResponse(null, {
      status: 200,
    });
  } catch (error) {
    console.error(
      "TASK_MONEY_SMS_HOOK_ERROR",
      error instanceof Error
        ? error.message
        : error,
    );

    return NextResponse.json(
      {
        error: {
          http_code: 401,
          message:
            "Invalid SMS-hook request.",
        },
      },
      {
        status: 401,
      },
    );
  }
}