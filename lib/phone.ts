const NIGERIAN_MOBILE_PREFIXES = new Set([
  '0701', '0703', '0704', '0705', '0706', '0707', '0708',
  '0801', '0802', '0803', '0804', '0805', '0806', '0807', '0808', '0809',
  '0810', '0811', '0812', '0813', '0814', '0815', '0816', '0817', '0818',
  '0901', '0902', '0903', '0904', '0905', '0906', '0907', '0908', '0909',
  '0911', '0912', '0913', '0915', '0916',
]);

export function normalizeNigerianPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');

  let localNumber: string;

  if (/^0\d{10}$/.test(digits)) {
    localNumber = digits;
  } else if (/^234\d{10}$/.test(digits)) {
    localNumber = `0${digits.slice(3)}`;
  } else if (/^\d{10}$/.test(digits)) {
    localNumber = `0${digits}`;
  } else {
    throw new Error(
      'Enter a valid 11-digit Nigerian phone number, for example 08136963037.',
    );
  }

  const prefix = localNumber.slice(0, 4);

  if (!NIGERIAN_MOBILE_PREFIXES.has(prefix)) {
    throw new Error(
      `The phone prefix ${prefix} is not recognised as a Nigerian mobile prefix.`,
    );
  }

  return `+234${localNumber.slice(1)}`;
}