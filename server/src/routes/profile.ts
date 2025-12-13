import { Gender, RelationshipStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard';
import { prisma } from '../services/prisma';
import { extractPhotoPaths, resolveMediaPhotos } from '../services/storage';

export const profileRouter = Router();

profileRouter.use(authGuard);

const photosSchema = z
  .object({
    photos: z.array(z.string().min(1)).max(5),
  })
  .optional();

console.log('Schema definition - photosSchema:', photosSchema);
console.log('Schema definition - photosSchema shape:', photosSchema._def);

const profileDetailsSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  age: z.coerce.number().int().min(18).max(100).optional(),
  gender: z.nativeEnum(Gender).optional(),
  relationshipStatus: z.nativeEnum(RelationshipStatus).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  instagramHandle: z.string().max(50).nullable().optional(),
  matchNotificationsEnabled: z.boolean().optional(),
  media: photosSchema,
  // Don't include preferences in the schema - handle it separately
});

// Create update schema manually to avoid issues with .partial() and z.coerce/z.nativeEnum
const updateSchema = z.object({
  displayName: z.string().min(2).optional(),
  age: z.coerce.number().int().min(18).max(100).optional(),
  gender: z.nativeEnum(Gender).optional(),
  relationshipStatus: z.nativeEnum(RelationshipStatus).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  instagramHandle: z.string().max(50).nullable().optional(),
  matchNotificationsEnabled: z.boolean().optional(),
  media: photosSchema,
}); // Don't use strict since we extract preferences separately

profileRouter.post('/bootstrap', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Extract preferences separately before Zod validation
    console.log('=== POST /bootstrap DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    const { preferences: rawPreferences, ...bodyWithoutPreferences } = req.body;
    console.log('Body without preferences:', JSON.stringify(bodyWithoutPreferences, null, 2));
    
    console.log('Bootstrap - profileDetailsSchema shape keys:', Object.keys(profileDetailsSchema.shape || {}));
    
    let data;
    try {
      console.log('Bootstrap - Calling profileDetailsSchema.parse()...');
      data = profileDetailsSchema.parse(bodyWithoutPreferences);
      console.log('Bootstrap parse SUCCESS');
    } catch (parseError) {
      console.error('=== Bootstrap Zod parse error ===');
      console.error('Error:', parseError);
      console.error('Error type:', typeof parseError);
      if (parseError && typeof parseError === 'object') {
        console.error('Error keys:', Object.keys(parseError as any));
        const zodError = parseError as any;
        if (zodError._zod) {
          console.error('_zod property:', zodError._zod);
        }
        if (zodError.errors) {
          console.error('Errors:', JSON.stringify(zodError.errors, null, 2));
        }
      }
      throw parseError;
    }
    
    // Validate preferences separately
    let preferences: any = {};
    if (rawPreferences !== undefined && rawPreferences !== null) {
      if (typeof rawPreferences === 'object' && !Array.isArray(rawPreferences)) {
        preferences = rawPreferences;
      }
    }
    
    const photos = data.media?.photos ?? [];

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return res.json({ profile: existingProfile, created: false });
    }

    const profile = await prisma.profile.create({
      data: {
        userId,
        displayName: data.displayName,
        gender: data.gender ?? Gender.OTHER,
        age: data.age ?? 21,
        relationshipStatus: data.relationshipStatus ?? RelationshipStatus.SINGLE,
        bio: data.bio ?? 'New to Do Not Disturb. Bio coming soon.',
        location: data.location?.trim() ? data.location.trim() : null,
        instagramHandle: data.instagramHandle?.trim() ? data.instagramHandle.trim() : null,
        matchNotificationsEnabled: data.matchNotificationsEnabled ?? true,
        media: { photos },
        preferences: preferences as any,
      },
    });

    res.status(201).json({ profile: await withSignedPhotos(profile), created: true });
  } catch (error) {
    next(error);
  }
});

profileRouter.get('/me', async (req, res, next) => {
  // DEBUG: remove after fixing - confirms request reaches server
  console.log('[profile] GET /me', { hasUser: !!req.user, userId: req.user?.id, hasAuth: !!req.headers.authorization });
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const profile = await prisma.profile.findUnique({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ profile: await withSignedPhotos(profile) });
  } catch (error) {
    next(error);
  }
});

profileRouter.patch('/me', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Debug: log incoming request body
    console.log('=== PATCH /me DEBUG START ===');
    console.log('1. Full request body:', JSON.stringify(req.body, null, 2));
    console.log('2. Request body keys:', Object.keys(req.body || {}));
    console.log('3. Preferences value:', req.body?.preferences);
    console.log('4. Preferences type:', typeof req.body?.preferences);
    console.log('5. Preferences is array?', Array.isArray(req.body?.preferences));
    
    // Extract preferences separately before Zod validation
    const { preferences: rawPreferences, ...bodyWithoutPreferences } = req.body;
    console.log('6. Body without preferences:', JSON.stringify(bodyWithoutPreferences, null, 2));
    console.log('7. Raw preferences extracted:', rawPreferences);
    
    let data;
    try {
      console.log('8. Attempting Zod parse...');
      console.log('9. Update schema type:', typeof updateSchema);
      console.log('9a. Update schema has shape?', 'shape' in updateSchema);
      console.log('9b. Update schema has _def?', '_def' in updateSchema);
      try {
        console.log('9c. Update schema shape keys:', Object.keys(updateSchema.shape || {}));
      } catch (e) {
        console.log('9c. Cannot access shape:', e);
      }
      try {
        console.log('9d. Update schema _def:', updateSchema._def);
        if (updateSchema._def?.shape) {
          console.log('9e. _def.shape keys:', Object.keys(updateSchema._def.shape));
          // Check each field in the shape
          Object.keys(updateSchema._def.shape).forEach(key => {
            const fieldSchema = (updateSchema._def.shape as any)[key];
            console.log(`9f. Field "${key}":`, {
              type: typeof fieldSchema,
              hasZod: '_def' in fieldSchema || '_zod' in fieldSchema,
              constructor: fieldSchema?.constructor?.name,
            });
          });
        }
      } catch (e) {
        console.log('9d. Cannot access _def:', e);
      }
      
      console.log('9g. Calling updateSchema.parse() with:', JSON.stringify(bodyWithoutPreferences, null, 2));
      data = updateSchema.parse(bodyWithoutPreferences);
      console.log('10. Zod parse SUCCESS. Parsed data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('=== ZOD PARSE ERROR ===');
      console.error('Error type:', typeof parseError);
      console.error('Error constructor:', parseError?.constructor?.name);
      console.error('Error instanceof Error?', parseError instanceof Error);
      console.error('Full error object:', parseError);
      if (parseError && typeof parseError === 'object') {
        console.error('Error keys:', Object.keys(parseError as any));
        console.error('Error message:', (parseError as any)?.message);
        console.error('Error stack:', (parseError as any)?.stack);
        const zodError = parseError as any;
        if (zodError.errors) {
          console.error('Zod errors array:', JSON.stringify(zodError.errors, null, 2));
        }
        if (zodError.issues) {
          console.error('Zod issues:', JSON.stringify(zodError.issues, null, 2));
        }
      }
      console.error('Schema validation failed for:', JSON.stringify(bodyWithoutPreferences, null, 2));
      // Re-throw with a more descriptive error
      if (parseError instanceof Error) {
        const zodError = parseError as any;
        if (zodError.errors && Array.isArray(zodError.errors)) {
          const errorMessages = zodError.errors.map((e: any) => 
            `${e.path?.join?.('.') || 'unknown'}: ${e.message || 'unknown error'}`
          ).join('; ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw parseError;
      }
      throw parseError;
    }
    
    // Validate preferences separately (just ensure it's an object if provided)
    let preferences: any = undefined;
    console.log('11. Validating preferences...');
    if (rawPreferences !== undefined && rawPreferences !== null) {
      if (typeof rawPreferences === 'object' && !Array.isArray(rawPreferences)) {
        preferences = rawPreferences;
        console.log('12. Preferences validated and accepted:', JSON.stringify(preferences, null, 2));
      } else {
        // Invalid preferences format, skip it
        console.warn('13. Invalid preferences format, skipping:', rawPreferences);
      }
    } else {
      console.log('14. No preferences provided');
    }
    
    const { matchNotificationsEnabled, location: locationInput, instagramHandle: instagramHandleInput, media, ...rest } = data;
    console.log('15. Destructured data keys:', Object.keys(rest));
    console.log('=== PATCH /me DEBUG END ===');

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No profile fields provided' });
    }

    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        ...rest,
        location: locationInput !== undefined ? (locationInput?.trim() ? locationInput.trim() : null) : undefined,
        instagramHandle: instagramHandleInput !== undefined ? (instagramHandleInput?.trim() ? instagramHandleInput.trim() : null) : undefined,
        matchNotificationsEnabled: matchNotificationsEnabled ?? undefined,
        media: media ? { photos: media.photos } : undefined,
        preferences: preferences !== undefined ? (preferences as any) : undefined,
      },
    });

    res.json({ profile: await withSignedPhotos(profile) });
  } catch (error) {
    next(error);
  }
});

profileRouter.get('/', (_req, res) => {
  res.status(501).json({ message: 'Profile catalog not implemented yet' });
});

profileRouter.delete('/me', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await prisma.$transaction(async (tx) => {
      const matches = await tx.match.findMany({
        where: {
          OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
        },
        select: { id: true },
      });

      const matchIds = matches.map((match) => match.id);

      if (matchIds.length > 0) {
        await tx.message.deleteMany({
          where: {
            matchId: { in: matchIds },
          },
        });
      }

      await Promise.all([
        tx.notification.deleteMany({ where: { profileId: profile.id } }),
        tx.swipe.deleteMany({
          where: {
            OR: [{ sourceProfileId: profile.id }, { targetProfileId: profile.id }],
          },
        }),
        tx.match.deleteMany({
          where: {
            OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
          },
        }),
        tx.verificationCode.deleteMany({ where: { userId } }),
        tx.refreshToken.deleteMany({ where: { userId } }),
      ]);

      await tx.profile.delete({ where: { id: profile.id } });
      await tx.user.delete({ where: { id: userId } });
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

async function withSignedPhotos<T extends { media: any }>(profile: T) {
  try {
    const { photoPaths, photos } = await resolveMediaPhotos(profile.media);
    return { ...profile, media: { photos, paths: photoPaths } };
  } catch (err) {
    // Storage (e.g. Supabase signed URLs) may fail due to config, network, or missing bucket.
    // Return profile with empty photos so the app still loads instead of 500.
    const cause = err instanceof Error ? err.cause ?? err.message : String(err);
    console.warn('[profile] Storage signed URL failed, returning profile without photo URLs:', cause);
    const photoPaths = extractPhotoPaths(profile.media);
    return { ...profile, media: { photos: [] as string[], paths: photoPaths } };
  }
}
