export function normalizeNigerianPhone(
  rawPhone: string,
): string {
  const digits = rawPhone.replace(/\D/g, '');

  // 08012345678
  if (/^0\d{10}$/.test(digits)) {
    return `+234${digits.slice(1)}`;
  }

  // 2348012345678
  if (/^234\d{10}$/.test(digits)) {
    return `+${digits}`;
  }

  // 8012345678
  if (/^\d{10}$/.test(digits)) {
    return `+234${digits}`;
  }

  throw new Error(
    'Enter a valid Nigerian phone number, for example 08012345678.',
  );
}