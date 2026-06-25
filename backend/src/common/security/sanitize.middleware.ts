import { NextFunction, Request, Response } from 'express';
import { sanitizeValue } from './sanitize.util';

/** Defense-in-depth against stored XSS: strips HTML tags from request bodies before they reach controllers. */
export function sanitizeRequestBody(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
}
