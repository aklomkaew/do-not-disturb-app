import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = typeof err === 'object' && err !== null && 'status' in err ? (err as any).status : 500;
  let message = err instanceof Error ? err.message : 'Unexpected error';

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error('=== ERROR HANDLER ===');
    console.error('[API_ERROR] Full error:', err);
    console.error('[API_ERROR] Error type:', typeof err);
    console.error('[API_ERROR] Error constructor:', (err as any)?.constructor?.name);
    if (err && typeof err === 'object') {
      console.error('[API_ERROR] Error keys:', Object.keys(err));
      console.error('[API_ERROR] Error stack:', (err as Error)?.stack);
      const zodError = err as any;
      if (zodError.errors) {
        console.error('[API_ERROR] Zod errors:', JSON.stringify(zodError.errors, null, 2));
      }
      if (zodError.issues) {
        console.error('[API_ERROR] Zod issues:', JSON.stringify(zodError.issues, null, 2));
      }
      if (zodError._zod) {
        console.error('[API_ERROR] _zod property exists:', zodError._zod);
      }
    }
    console.error('[API_ERROR] Message:', message);
    console.error('=== END ERROR HANDLER ===');
  }

  // Ensure message is a string
  if (typeof message !== 'string') {
    message = JSON.stringify(message);
  }

  res.status(status).json({
    error: {
      message,
    },
  });
}
