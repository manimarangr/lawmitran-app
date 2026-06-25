import { NextFunction, Request, Response } from 'express';

/**
 * Hand-rolled equivalent of helmet's default header set (the `helmet`
 * package could not be installed in this environment — see README/notes on
 * the broken `npm install`). Swap for real helmet() once that's resolved.
 */
export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=15552000; includeSubDomains',
  );
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'",
  );
  next();
}
