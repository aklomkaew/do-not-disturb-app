import type { Profile, User } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: User & { profile?: Profile | null };
  }
}
