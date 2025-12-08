import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const messageSchema = z.object({
  text: z.string().min(1).max(2000),
  attachments: z.array(z.string().url()).optional(),
});

export async function listMatches(req: Request, res: Response) {
  const profile = req.currentUser?.profile;
  if (!profile) {
    return res.status(400).json({ message: 'Profile required' });
  }

  const params = paginationSchema.parse(req.query);

  const matches = await prisma.match.findMany({
    where: {
      OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
    },
    include: {
      profileA: true,
      profileB: true,
    },
    orderBy: { createdAt: 'desc' },
    take: params.limit,
    cursor: params.cursor ? { id: params.cursor } : undefined,
    skip: params.cursor ? 1 : undefined,
  });

  const nextCursor = matches.length === params.limit ? matches[matches.length - 1].id : null;

  res.json({ items: matches, nextCursor });
}

export async function getMatch(req: Request, res: Response) {
  const profile = req.currentUser?.profile;
  if (!profile) {
    return res.status(400).json({ message: 'Profile required' });
  }

  const match = await prisma.match.findUnique({
    where: { id: req.params.matchId },
    include: { profileA: true, profileB: true },
  });

  if (!match || (match.profileAId !== profile.id && match.profileBId !== profile.id)) {
    return res.status(404).json({ message: 'Match not found' });
  }

  res.json(match);
}

export async function listMatchMessages(req: Request, res: Response) {
  const profile = req.currentUser?.profile;
  if (!profile) {
    return res.status(400).json({ message: 'Profile required' });
  }

  const params = paginationSchema.parse(req.query);
  const match = await prisma.match.findUnique({ where: { id: req.params.matchId } });
  if (!match || (match.profileAId !== profile.id && match.profileBId !== profile.id)) {
    return res.status(404).json({ message: 'Match not found' });
  }

  const messages = await prisma.message.findMany({
    where: { matchId: match.id },
    orderBy: { sentAt: 'desc' },
    take: params.limit,
    cursor: params.cursor ? { id: params.cursor } : undefined,
    skip: params.cursor ? 1 : undefined,
  });

  const nextCursor = messages.length === params.limit ? messages[messages.length - 1].id : null;

  res.json({ items: messages, nextCursor });
}

export async function sendMatchMessage(req: Request, res: Response) {
  const profile = req.currentUser?.profile;
  if (!profile) {
    return res.status(400).json({ message: 'Profile required' });
  }

  const match = await prisma.match.findUnique({ where: { id: req.params.matchId } });
  if (!match || (match.profileAId !== profile.id && match.profileBId !== profile.id)) {
    return res.status(404).json({ message: 'Match not found' });
  }

  const payload = messageSchema.parse(req.body);

  const message = await prisma.message.create({
    data: {
      matchId: match.id,
      senderProfileId: profile.id,
      text: payload.text,
      attachments: payload.attachments,
    },
  });

  await prisma.match.update({
    where: { id: match.id },
    data: { lastInteractionAt: message.sentAt },
  });

  res.status(201).json(message);
}

export async function inbox(req: Request, res: Response) {
  const profile = req.currentUser?.profile;
  if (!profile) {
    return res.status(400).json({ message: 'Profile required' });
  }

  const matches = await prisma.match.findMany({
    where: { OR: [{ profileAId: profile.id }, { profileBId: profile.id }] },
    include: {
      profileA: true,
      profileB: true,
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastInteractionAt: 'desc' },
  });

  const threads = matches.map((match) => {
    const peer = match.profileAId === profile.id ? match.profileB : match.profileA;
    return {
      matchId: match.id,
      peer: {
        id: peer.id,
        displayName: peer.displayName,
        bio: peer.bio,
        media: peer.media,
      },
      lastMessage: match.messages[0] ?? null,
      lastInteractionAt: match.lastInteractionAt,
    };
  });

  res.json({ items: threads });
}
