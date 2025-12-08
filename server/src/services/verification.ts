import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from './prisma';
import type { VerificationChannel } from '@prisma/client';

const DEFAULT_TTL_SECONDS = env.VERIFICATION_CODE_TTL_SECONDS;

type IssueCodeParams = {
  userId: string;
  identifier: string;
  channel: VerificationChannel;
};

type VerifyCodeParams = IssueCodeParams & {
  code: string;
};

export async function issueVerificationCode({ userId, identifier, channel }: IssueCodeParams) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + DEFAULT_TTL_SECONDS * 1000);

  await prisma.verificationCode.create({
    data: {
      userId,
      identifier,
      channel,
      codeHash: hashCode(code),
      expiresAt,
    },
  });

  logDelivery(channel, identifier, code);

  return {
    code,
    expiresAt,
  };
}

export async function verifyCode({ userId, channel, code }: VerifyCodeParams) {
  const record = await prisma.verificationCode.findFirst({
    where: {
      userId,
      channel,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!record) {
    throw Object.assign(new Error('Verification code not found or expired'), { status: 400 });
  }

  if (record.codeHash !== hashCode(code)) {
    throw Object.assign(new Error('Invalid verification code'), { status: 400 });
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashCode(code: string) {
  return crypto.createHash('sha256').update(`${env.JWT_SECRET}:${code}`).digest('hex');
}

function logDelivery(channel: VerificationChannel, identifier: string, code: string) {
  const prefix = channel === 'PHONE' ? '[auth:sms]' : '[auth:email]';
  console.info(`${prefix} Code for ${identifier}: ${code}`);
}
