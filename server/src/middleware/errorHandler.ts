import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = typeof err === 'object' && err !== null && 'status' in err ? (err as any).status : 500;
  const message = err instanceof Error ? err.message : 'Unexpected error';

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error('[API_ERROR]', err);
  }

  res.status(status).json({
    error: {
      message,
    },
  });
}
