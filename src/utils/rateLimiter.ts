interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 30, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(identifier: string): number | null {
    const entry = this.limits.get(identifier);
    if (!entry) return null;
    return entry.resetTime;
  }

  clear(identifier: string): void {
    this.limits.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Create different limiters for different actions
export const messageLimiter = new RateLimiter(30, 60000); // 30 messages per minute
export const jobCreationLimiter = new RateLimiter(5, 3600000); // 5 jobs per hour
export const applicationLimiter = new RateLimiter(10, 3600000); // 10 applications per hour
export const registrationLimiter = new RateLimiter(3, 3600000); // 3 registrations per hour

// Cleanup old entries every 5 minutes
setInterval(() => {
  messageLimiter.cleanup();
  jobCreationLimiter.cleanup();
  applicationLimiter.cleanup();
  registrationLimiter.cleanup();
}, 300000);
