type SendSmsInput = {
  phone: string;
  message: string;
};

type SmsGatewayResponse = {
  success: boolean;
  providerMessageId?: string;
  error?: string;
};

export async function sendSms({
  phone,
  message,
}: SendSmsInput): Promise<SmsGatewayResponse> {
  const gatewayUrl = process.env.SMS_GATEWAY_URL;
  const apiKey = process.env.SMS_GATEWAY_API_KEY;

  /*
   * Development only.
   *
   * Never enable this in production because it prints OTPs
   * into server logs.
   */
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.SMS_DEVELOPMENT_MODE === "true"
  ) {
    console.log("TASK MONEY DEVELOPMENT SMS", {
      phone,
      message,
    });

    return {
      success: true,
      providerMessageId: "development-message",
    };
  }

  if (!gatewayUrl) {
    return {
      success: false,
      error: "SMS_GATEWAY_URL is missing.",
    };
  }

  const response = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey
        ? {
            Authorization: `Bearer ${apiKey}`,
          }
        : {}),
    },
    body: JSON.stringify({
      to: phone,
      message,
      sender:
        process.env.SMS_SENDER_NAME ??
        "TaskMoney",
    }),
    signal: AbortSignal.timeout(4000),
  });

  const responseBody = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    return {
      success: false,
      error:
        responseBody?.message ??
        responseBody?.error ??
        `SMS gateway returned ${response.status}.`,
    };
  }

  return {
    success: true,
    providerMessageId:
      responseBody?.message_id ??
      responseBody?.messageId ??
      responseBody?.id,
  };
}