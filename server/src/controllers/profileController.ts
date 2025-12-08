import type { Request, Response } from 'express';
import { Gender, Prisma, RelationshipStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../services/prisma';

const baseProfileSchema = z.object({
  displayName: z.string().min(1).max(80),
  gender: z.nativeEnum(Gender),
  age: z.number().int().min(18).max(120),
  relationshipStatus: z.nativeEnum(RelationshipStatus),
  bio: z.string().min(1).max(500),
  media: z.array(z.string().url()).max(6),
  preferences: z.object({
    ageMin: z.number().int().min(18).max(120).default(18),
    ageMax: z.number().int().min(18).max(120).default(60),
    showGenders: z.array(z.nativeEnum(Gender)).default([]),
  }),
  location: z.string().optional(),
});

const updateProfileSchema = baseProfileSchema.partial();

const listProfilesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  gender: z.nativeEnum(Gender).optional(),
  ageMin: z.coerce.number().int().min(18).optional(),
  ageMax: z.coerce.number().int().max(120).optional(),
});

export async function getMyProfile(req: Request, res: Response) {
  if (!req.currentUser?.profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }
  res.json(req.currentUser.profile);
}

export async function createProfile(req: Request, res: Response) {
  if (!req.currentUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.currentUser.profile) {
    return res.status(409).json({ message: 'Profile already exists' });
  }

  const payload = baseProfileSchema.parse(req.body);

  const profile = await prisma.profile.create({
    data: {
      userId: req.currentUser.id,
      ...payload,
    },
  });

  res.status(201).json(profile);
}

export async function updateProfile(req: Request, res: Response) {
  if (!req.currentUser?.profile) {
    return res.status(404).json({ message: 'Profile not found' });
  }

  const payload = updateProfileSchema.parse(req.body);

  const profile = await prisma.profile.update({
    where: { id: req.currentUser.profile.id },
    data: payload,
  });

  res.json(profile);
}

export async function listProfiles(req: Request, res: Response) {
  if (!req.currentUser?.profile) {
    return res.status(400).json({ message: 'Create a profile first' });
  }

  const params = listProfilesSchema.parse(req.query);
  const swiped = await prisma.swipe.findMany({
    where: { sourceProfileId: req.currentUser.profile.id },
    select: { targetProfileId: true },
  });
  const excludeIds = [req.currentUser.profile.id, ...swiped.map((s) => s.targetProfileId)];

  const whereClauses: Prisma.ProfileWhereInput = {
    id: { notIn: excludeIds },
  };

  if (params.gender) {
    whereClauses.gender = params.gender;
  }
  if (params.ageMin || params.ageMax) {
    whereClauses.age = {};
    if (params.ageMin) whereClauses.age.gte = params.ageMin;
    if (params.ageMax) whereClauses.age.lte = params.ageMax;
  }

  const profiles = await prisma.profile.findMany({
    where: whereClauses,
    take: params.limit,
    orderBy: { createdAt: 'desc' },
    cursor: params.cursor ? { id: params.cursor } : undefined,
    skip: params.cursor ? 1 : undefined,
    select: {
      id: true,
      displayName: true,
      gender: true,
      age: true,
      relationshipStatus: true,
      bio: true,
      media: true,
      location: true,
      createdAt: true,
    },
  });

  const nextCursor = profiles.length === params.limit ? profiles[profiles.length - 1].id : null;

  res.json({ items: profiles, nextCursor, deckSeed: new Date().toISOString() });
}
