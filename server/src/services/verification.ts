import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from './prisma';
import type { VerificationChannel } from '@prisma/client';
import { sendVerificationEmail, sendVerificationSms } from './notifications';

const DEFAULT_TTL_SECONDS = env.VERIFICATION_CODE_TTL_SECONDS;
const REQUEST_LIMIT = env.VERIFICATION_REQUEST_LIMIT;
const REQUEST_WINDOW_MS = env.VERIFICATION_REQUEST_WINDOW_SECONDS * 1000;

type IssueCodeParams = {
  userId: string;
  identifier: string;
  channel: VerificationChannel;
};

type VerifyCodeParams = IssueCodeParams & {
  code: string;
};

export async function issueVerificationCode({ userId, identifier, channel }: IssueCodeParams) {
  await assertRequestAllowance(identifier, channel);

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

  if (channel === 'PHONE') {
    await sendVerificationSms(identifier, code);
  } else {
    await sendVerificationEmail(identifier, code);
  }

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

async function assertRequestAllowance(identifier: string, channel: VerificationChannel) {
  const windowStart = new Date(Date.now() - REQUEST_WINDOW_MS);
  const count = await prisma.verificationCode.count({
    where: {
      identifier,
      channel,
      createdAt: { gte: windowStart },
    },
  });

  if (count >= REQUEST_LIMIT) {
    throw Object.assign(new Error('Too many verification attempts. Please try again later.'), { status: 429 });
  }
}
