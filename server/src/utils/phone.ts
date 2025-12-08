import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhoneNumber(input: string) {
  const parsed = parsePhoneNumberFromString(input);
  if (!parsed || !parsed.isValid()) {
    throw Object.assign(new Error('Invalid phone number'), { status: 400 });
  }
  return parsed.number; // E.164 format
}

export function maskPhoneNumber(e164: string) {
  if (e164.length <= 4) {
    return e164;
  }

  const visible = e164.slice(-4);
  const masked = e164.slice(0, -4).replace(/\d/g, '•');
  return `${masked}${visible}`;
}

export function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!domain) {
    return email;
  }
  const visibleUser = `${user.slice(0, 2)}${user.length > 2 ? '***' : ''}`;
  return `${visibleUser}@${domain}`;
}
