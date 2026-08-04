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
    throw new Error(`${name} is missing.`);
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

function getProviderMessage(
  body: unknown,
): string | null {
  if (
    typeof body !== 'object' ||
    body === null
  ) {
    return null;
  }

  const record =
    body as Record<string, unknown>;

  const candidates = [
    record.msg,
    record.message,
    record.error,
    record.description,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === 'string' &&
      candidate.trim()
    ) {
      return candidate;
    }
  }

  return null;
}

function getProviderMessageId(
  body: unknown,
): string | undefined {
  if (
    typeof body !== 'object' ||
    body === null
  ) {
    return undefined;
  }

  const record =
    body as Record<string, unknown>;

  const candidates = [
    record.message_id,
    record.messageId,
    record.id,
    record.reference,
    record.request_id,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === 'string' ||
      typeof candidate === 'number'
    ) {
      return String(candidate);
    }
  }

  return undefined;
}

function providerRejected(
  body: unknown,
): boolean {
  if (typeof body === 'string') {
    const value = body.trim().toLowerCase();

    return (
      value.includes('error') ||
      value.includes('failed') ||
      value.includes('invalid') ||
      value.includes('missing parameter') ||
      value.includes('insufficient')
    );
  }

  if (
    typeof body !== 'object' ||
    body === null
  ) {
    return false;
  }

  const record =
    body as Record<string, unknown>;

  const status =
    typeof record.status === 'string'
      ? record.status.toLowerCase()
      : '';

  const errorCode =
    typeof record.error_code === 'string'
      ? record.error_code
      : typeof record.error_code === 'number'
        ? String(record.error_code)
        : '';

  return (
    status === 'error' ||
    status === 'failed' ||
    record.success === false ||
    Boolean(errorCode) ||
    typeof record.error === 'string'
  );
}

export async function sendSms({
  phone,
  message,
}: SendSmsInput): Promise<SmsGatewayResponse> {
  const developmentSmsEnabled =
    process.env.NODE_ENV !== 'production' &&
    process.env.SMS_DEVELOPMENT_MODE
      ?.trim()
      .toLowerCase() === 'true';

  if (developmentSmsEnabled) {
    console.info(
      'TASK_MONEY_DEVELOPMENT_SMS',
      {
        phoneLastFour:
          phone.slice(-4),
      },
    );

    return {
      success: true,
      providerMessageId:
        'development-message',
    };
  }

  console.info(
    'TASK_MONEY_SMS_PROVIDER_MODE',
    {
      nodeEnvironment:
        process.env.NODE_ENV,

      developmentMode:
        process.env
          .SMS_DEVELOPMENT_MODE ??
        'undefined',

      hasApiUrl: Boolean(
        process.env.KUDISMS_API_URL,
      ),

      hasApiKey: Boolean(
        process.env.KUDISMS_API_KEY,
      ),

      hasSenderId: Boolean(
        process.env.KUDISMS_SENDER_ID,
      ),
    },
  );

  try {
    const apiUrl =
      process.env.KUDISMS_API_URL?.trim() ||
      'https://my.kudisms.net/api/sms';

    const token =
      requiredEnvironmentVariable(
        'KUDISMS_API_KEY',
      );

    const senderId =
      requiredEnvironmentVariable(
        'KUDISMS_SENDER_ID',
      );

    const recipients =
      normalizeKudiSmsNumber(phone);

    const formData =
      new URLSearchParams();

    formData.set('token', token);
    formData.set('senderID', senderId);
    formData.set(
      'recipients',
      recipients,
    );
    formData.set('message', message);

    const response = await fetch(
      apiUrl,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',

          Accept:
            'application/json',
        },

        body:
          formData.toString(),

        cache: 'no-store',

        signal:
          AbortSignal.timeout(8000),
      },
    );

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
      // Keep raw text response.
    }

    console.info(
      'KUDISMS_RAW_RESPONSE',
      {
        statusCode:
          response.status,

        responseBody,
      },
    );

    if (!response.ok) {
      return {
        success: false,

        error:
          getProviderMessage(
            responseBody,
          ) ||
          `KudiSMS returned HTTP ${response.status}.`,

        providerResponse:
          responseBody,
      };
    }

    if (
      providerRejected(
        responseBody,
      )
    ) {
      return {
        success: false,

        error:
          getProviderMessage(
            responseBody,
          ) ||
          'KudiSMS rejected the message.',

        providerResponse:
          responseBody,
      };
    }

    return {
      success: true,

      providerMessageId:
        getProviderMessageId(
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