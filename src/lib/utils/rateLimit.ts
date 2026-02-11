// Edge-compatible rate limiter using Web Crypto API + Supabase
// No Node.js built-ins — works on Cloudflare Pages, Vercel Edge, etc.

import { supabase } from '$lib/supabaseClient';

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
 * Check rate limits against ip_rate_log in Supabase.
 * - Micro-burst: max 10 submissions in 5 seconds
 * - Sustained: max 300 submissions per hour
 */
export async function checkRateLimit(ipHash: string): Promise<RateLimitResult> {
    const now = new Date();

    // Check micro-burst: last 5 seconds
    const burstCutoff = new Date(now.getTime() - 5 * 1000).toISOString();
    const { count: burstCount, error: burstError } = await supabase
        .from('ip_rate_log')
        .select('*', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', burstCutoff);

    if (burstError) {
        console.error('Rate limit burst check error:', burstError);
        // Fail open — don't block legitimate users on DB errors
        return { allowed: true };
    }

    if ((burstCount ?? 0) >= 10) {
        return { allowed: false, retryAfter: 5 };
    }

    // Check sustained: last hour
    const sustainedCutoff = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const { count: sustainedCount, error: sustainedError } = await supabase
        .from('ip_rate_log')
        .select('*', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', sustainedCutoff);

    if (sustainedError) {
        console.error('Rate limit sustained check error:', sustainedError);
        return { allowed: true };
    }

    if ((sustainedCount ?? 0) >= 300) {
        return { allowed: false, retryAfter: 60 };
    }

    return { allowed: true };
}

/**
 * Log a request to ip_rate_log for future rate limit checks.
 */
export async function logRequest(ipHash: string, formId: string): Promise<void> {
    const { error } = await supabase
        .from('ip_rate_log')
        .insert({ ip_hash: ipHash, form_id: formId });

    if (error) {
        console.error('Failed to log rate limit entry:', error);
    }
}
