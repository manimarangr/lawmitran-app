import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';

interface Bucket {
  count: number;
  resetAt: number;
}

const DEFAULT_LIMIT = 100;
const DEFAULT_WINDOW_MS = 60_000;

/**
 * In-memory sliding-window limiter (per process). Good enough for a single
 * backend instance; swap for a Redis-backed limiter (Redis is already
 * provisioned in docker-compose) once this runs behind multiple instances.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private reflector: Reflector,
    private config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? {
      limit: Number(this.config.get<string>('RATE_LIMIT_MAX') ?? DEFAULT_LIMIT),
      windowMs: Number(
        this.config.get<string>('RATE_LIMIT_WINDOW_MS') ?? DEFAULT_WINDOW_MS,
      ),
    };

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.buildKey(request);
    const now = Date.now();

    this.maybeCleanup(now);

    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }

    if (bucket.count >= options.limit) {
      throw new HttpException(
        'Too many requests, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    return true;
  }

  private buildKey(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const ip =
      (typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : undefined) ??
      request.ip ??
      'unknown';
    const routePath =
      (request.route as { path?: string } | undefined)?.path ?? request.path;
    const route = `${request.method}:${routePath}`;
    return `${ip}:${route}`;
  }

  private maybeCleanup(now: number): void {
    if (Math.random() >= 0.01) {
      return;
    }
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
