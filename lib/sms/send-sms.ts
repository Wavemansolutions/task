type SendSmsInput = {
  phone: string;
  message: string;
};

export type SmsGatewayResponse = {
  success: boolean;
  providerMessageId?: string;
  providerResponse?: unknown;
  error?: string;
};

function requiredEnvironmentVariable(
  name: string,
): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is missing.`,
    );
  }

  return value;
}

function normalizeKudiSmsNumber(
  rawPhone: string,
): string {
  const digits = rawPhone.replace(/\D/g, '');

  if (/^0\d{10}$/.test(digits)) {
    return `234${digits.slice(1)}`;
  }

  if (/^234\d{10}$/.test(digits)) {
    return digits;
  }

  if (/^\d{10}$/.test(digits)) {
    return `234${digits}`;
  }

  throw new Error(
    'The destination phone number is invalid.',
  );
}

function extractProviderError(
  responseBody: unknown,
): string | null {
  if (
    typeof responseBody !== 'object' ||
    responseBody === null
  ) {
    return null;
  }

  const record = responseBody as Record<
    string,
    unknown
  >;

  const candidates = [
    record.message,
    record.error,
    record.error_message,
    record.description,
    record.msg,
  ];

  for (const value of candidates) {
    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value;
    }
  }

  return null;
}

function extractMessageId(
  responseBody: unknown,
): string | undefined {
  if (
    typeof responseBody !== 'object' ||
    responseBody === null
  ) {
    return undefined;
  }

  const record = responseBody as Record<
    string,
    unknown
  >;

  const candidates = [
    record.message_id,
    record.messageId,
    record.id,
    record.reference,
    record.request_id,
  ];

  for (const value of candidates) {
    if (
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      return String(value);
    }
  }

  return undefined;
}

export async function sendSms({
  phone,
  message,
}: SendSmsInput): Promise<SmsGatewayResponse> {
  /*
   * Development testing only.
   * Never enable this publicly in production.
   */
  if (
    process.env.SMS_DEVELOPMENT_MODE ===
    'true'
  ) {
    console.log(
      'TASK_MONEY_DEVELOPMENT_SMS',
      {
        phone,
        message,
      },
    );

    return {
      success: true,
      providerMessageId:
        'development-message',
    };
  }

  try {
    const apiUrl =
      requiredEnvironmentVariable(
        'KUDISMS_API_URL',
      );

    const apiKey =
      requiredEnvironmentVariable(
        'KUDISMS_API_KEY',
      );

    const senderId =
      requiredEnvironmentVariable(
        'KUDISMS_SENDER_ID',
      );

    const recipient =
      normalizeKudiSmsNumber(phone);

    /*
     * These names can be changed from Vercel without
     * modifying the source code.
     */
    const recipientField =
      process.env.KUDISMS_RECIPIENT_FIELD?.trim() ||
      'recipient';

    const messageField =
      process.env.KUDISMS_MESSAGE_FIELD?.trim() ||
      'message';

    const senderField =
      process.env.KUDISMS_SENDER_FIELD?.trim() ||
      'sender_id';

    const apiKeyHeader =
      process.env.KUDISMS_API_KEY_HEADER?.trim() ||
      'Authorization';

    const apiKeyPrefix =
      process.env.KUDISMS_API_KEY_PREFIX ??
      'Bearer';

    const authorizationValue =
      apiKeyPrefix.trim()
        ? `${apiKeyPrefix.trim()} ${apiKey}`
        : apiKey;

    const requestBody: Record<
      string,
      string
    > = {
      [recipientField]: recipient,
      [messageField]: message,
      [senderField]: senderId,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
        Accept: 'application/json',
        [apiKeyHeader]:
          authorizationValue,
      },

      body: JSON.stringify(
        requestBody,
      ),

      cache: 'no-store',

      signal:
        AbortSignal.timeout(4000),
    });

    const rawResponse =
      await response.text();

    let responseBody: unknown =
      rawResponse;

    try {
      responseBody =
        rawResponse
          ? JSON.parse(rawResponse)
          : null;
    } catch {
      // Keep the raw text response.
    }

    if (!response.ok) {
      return {
        success: false,

        error:
          extractProviderError(
            responseBody,
          ) ||
          `KudiSMS returned HTTP ${response.status}.`,

        providerResponse:
          responseBody,
      };
    }

    /*
     * Some providers return HTTP 200 while placing
     * an error inside the response body.
     */
    if (
      typeof responseBody === 'object' &&
      responseBody !== null
    ) {
      const body =
        responseBody as Record<
          string,
          unknown
        >;

      const explicitSuccess =
        body.success;

      const status =
        typeof body.status === 'string'
          ? body.status.toLowerCase()
          : '';

      if (
        explicitSuccess === false ||
        status === 'failed' ||
        status === 'error'
      ) {
        return {
          success: false,

          error:
            extractProviderError(
              responseBody,
            ) ||
            'KudiSMS rejected the message.',

          providerResponse:
            responseBody,
        };
      }
    }

    return {
      success: true,

      providerMessageId:
        extractMessageId(
          responseBody,
        ),

      providerResponse:
        responseBody,
    };
  } catch (error: unknown) {
    return {
      success: false,

      error:
        error instanceof Error
          ? error.message
          : 'KudiSMS request failed.',
    };
  }
}