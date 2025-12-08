import { prisma } from '../services/prisma';

type RequireProfileOptions = {
  includeUser?: boolean;
};

export async function requireProfile(userId: string, options: RequireProfileOptions = {}) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: options.includeUser ? { user: true } : undefined,
  });

  if (!profile) {
    throw Object.assign(new Error('Complete your profile to continue'), { status: 409 });
  }

  return profile;
}
