// Edge-compatible rate limiter using Web Crypto API + Upstash Redis
// No Node.js built-ins — works on Cloudflare Pages, Vercel Edge, etc.

import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

// Initialize the edge-friendly Upstash Redis client
// Fail-safe initialization to avoid build failures if env vars are missing
const getRedisClient = () => {
    const url = env.UPSTASH_REDIS_REST_URL;
    const token = env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        console.warn('Warning: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing in environment. Redis operations will fail open.');
        return null;
    }
    return new Redis({ url, token });
};

/**
 * Hash an IP address using SHA-256 via Web Crypto API.
 * Never store or log raw IPs.
 */
export async function hashIP(ip: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract client IP from request headers.
 * Cloudflare: cf-connecting-ip
 * Fallback: x-forwarded-for, x-real-ip, or '127.0.0.1' for local dev
 */
export function getClientIP(request: Request): string {
    return (
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1'
    );
}

interface RateLimitResult {
    allowed: boolean;
    retryAfter?: number; // seconds
}

/**
 * Check and log rate limits concurrently using a single Upstash Redis HTTP Pipeline.
 * - Micro-burst: max 10 submissions in 5 seconds
 * - Sustained: max 300 submissions per hour
 */
export async function checkRateLimit(ipHash: string): Promise<RateLimitResult> {
    const redis = getRedisClient();
    if (!redis) {
        return { allowed: true }; // Fail open if Redis is not configured
    }

    const burstKey = `ratelimit:burst:${ipHash}`;
    const sustainedKey = `ratelimit:sustained:${ipHash}`;

    try {
        // Execute multiple commands in 1 fast edge RTT pipeline
        const p = redis.pipeline();
        p.incr(burstKey);
        p.expire(burstKey, 5); // 5 seconds micro-burst window
        
        p.incr(sustainedKey);
        p.expire(sustainedKey, 3600); // 1 hour sustained window
        
        const [burstCount, , sustainedCount] = await p.exec() as [number, unknown, number];

        // Max 10 submissions per 5 seconds
        if (burstCount > 10) {
            return { allowed: false, retryAfter: 5 };
        }

        // Max 300 submissions per hour
        if (sustainedCount > 300) {
            return { allowed: false, retryAfter: 60 };
        }

        return { allowed: true };
    } catch (error) {
        console.error('Upstash Redis rate limit check error:', error);
        // Fail open — don't block legitimate users if Redis has connectivity issues
        return { allowed: true };
    }
}

/**
 * Check if the user has already submitted a response to this specific form (Ballot Stuffing check)
 * Allows up to 3 submissions from the same IP network per secure form.
 */
export async function checkBallotStuffing(ipHash: string, formId: string): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) {
        return false; // Fail open
    }

    try {
        const ballotKey = `ballot:${formId}:${ipHash}`;
        const count = await redis.get<number>(ballotKey);
        return (count ?? 0) >= 3;
    } catch (error) {
        console.error('Ballot stuffing check error:', error);
        return false; // Fail open
    }
}

/**
 * Log the user's ballot submission in Redis to prevent ballot stuffing
 */
export async function logBallotSubmission(ipHash: string, formId: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
        return;
    }

    try {
        const ballotKey = `ballot:${formId}:${ipHash}`;
        const p = redis.pipeline();
        p.incr(ballotKey);
        p.expire(ballotKey, 30 * 24 * 60 * 60); // Keep ballot history for 30 days
        await p.exec();
    } catch (error) {
        console.error('Failed to log ballot:', error);
    }
}
