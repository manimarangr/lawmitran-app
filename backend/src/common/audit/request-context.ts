import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextStore {
  ip?: string;
  userAgent?: string;
  userId?: string;
  role?: string;
}

/** Per-request store: middleware seeds ip/ua, JwtStrategy adds the actor. */
export const requestContext = new AsyncLocalStorage<RequestContextStore>();
