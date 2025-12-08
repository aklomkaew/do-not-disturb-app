import twilio, { Twilio } from 'twilio';
import { Resend } from 'resend';
import { env } from '../config/env';

type SmsProvider = 'mock' | 'twilio';
type EmailProvider = 'mock' | 'resend';

const smsProvider: SmsProvider = env.SMS_PROVIDER;
const emailProvider: EmailProvider = env.EMAIL_PROVIDER;

const twilioClient: Twilio | null =
  smsProvider === 'twilio' && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
    ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
    : null;

const resendClient = emailProvider === 'resend' && env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendVerificationSms(to: string, code: string) {
  const message = `Your Do Not Disturb verification code is ${code}`;

  if (!twilioClient || !env.TWILIO_FROM_NUMBER) {
    console.info(`[auth:sms:mock] -> ${to} :: ${message}`);
    return;
  }

  await twilioClient.messages.create({
    body: message,
    from: env.TWILIO_FROM_NUMBER,
    to,
  });
}

export async function sendVerificationEmail(to: string, code: string) {
  const subject = 'Your Do Not Disturb verification code';
  const text = `Use this code to continue: ${code}. It expires in ${env.VERIFICATION_CODE_TTL_SECONDS / 60} minutes.`;

  if (!resendClient || !env.EMAIL_FROM_ADDRESS) {
    console.info(`[auth:email:mock] -> ${to} :: ${text}`);
    return;
  }

  await resendClient.emails.send({
    from: env.EMAIL_FROM_ADDRESS,
    to,
    subject,
    text,
  });
}
