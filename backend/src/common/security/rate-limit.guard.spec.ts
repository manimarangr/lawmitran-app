import { ExecutionContext, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limit.guard';

function buildContext(
  overrides: Partial<{ ip: string; method: string; path: string }> = {},
): ExecutionContext {
  const request = {
    ip: overrides.ip ?? '1.2.3.4',
    method: overrides.method ?? 'POST',
    path: overrides.path ?? '/api/auth/login',
    headers: {},
    route: undefined,
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RateLimitGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let config: { get: jest.Mock };
  let guard: RateLimitGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValue({ limit: 2, windowMs: 60_000 }),
    };
    config = { get: jest.fn() };
    guard = new RateLimitGuard(
      reflector as unknown as Reflector,
      config as unknown as ConfigService,
    );
  });

  it('allows requests under the limit', () => {
    const context = buildContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws 429 once the limit is exceeded within the window', () => {
    const context = buildContext();

    guard.canActivate(context);
    guard.canActivate(context);

    expect(() => guard.canActivate(context)).toThrow(HttpException);
  });

  it('tracks separate buckets per IP', () => {
    const contextA = buildContext({ ip: '1.1.1.1' });
    const contextB = buildContext({ ip: '2.2.2.2' });

    guard.canActivate(contextA);
    guard.canActivate(contextA);
    expect(() => guard.canActivate(contextA)).toThrow(HttpException);

    expect(guard.canActivate(contextB)).toBe(true);
  });

  it('tracks separate buckets per route', () => {
    const contextLogin = buildContext({ path: '/api/auth/login' });
    const contextRegister = buildContext({ path: '/api/auth/register' });

    guard.canActivate(contextLogin);
    guard.canActivate(contextLogin);
    expect(() => guard.canActivate(contextLogin)).toThrow(HttpException);

    expect(guard.canActivate(contextRegister)).toBe(true);
  });

  it('falls back to config-driven defaults when no decorator metadata is present', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    config.get.mockImplementation((key: string) =>
      key === 'RATE_LIMIT_MAX' ? '1' : '60000',
    );
    const context = buildContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
  });
});
