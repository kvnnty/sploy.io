import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export const RateLimit = (opts: RateLimitOptions) =>
  (target: object, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    const reflector = Reflect;
    reflector.defineMetadata(
      RATE_LIMIT_KEY,
      opts,
      descriptor?.value ?? target,
    );
  };

interface BucketEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, BucketEntry>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const opts = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!opts) return true;

    const request = context.switchToHttp().getRequest<{
      ip: string;
      headers: Record<string, string | undefined>;
    }>();
    const ip =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? request.ip;
    const key = `${context.getHandler().name}:${ip}`;
    const now = Date.now();

    let entry = this.buckets.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      this.buckets.set(key, entry);
    }

    entry.count++;

    if (entry.count > opts.maxRequests) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
