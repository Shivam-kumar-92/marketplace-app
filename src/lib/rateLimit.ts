interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window cache with periodic sweep
const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300000);
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitOptions {
  windowMs: number; // e.g. 60000 for 1 minute
  maxRequests: number; // max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Extracts client IP address from proxy and server headers
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return '127.0.0.1';
}

/**
 * Sliding window rate limiter to guard sensitive endpoints from abuse and card-testing
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60000, maxRequests: 5 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  const record = rateLimitMap.get(identifier) || { timestamps: [] };

  // Remove timestamps outside the sliding window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= options.maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfterMs = oldestTimestamp + options.windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);
  rateLimitMap.set(identifier, record);

  return {
    allowed: true,
    limit: options.maxRequests,
    remaining: options.maxRequests - record.timestamps.length,
    retryAfterSeconds: 0,
  };
}
