import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory rate-limit store
// ---------------------------------------------------------------------------
// In production you would swap this for Redis (ioredis is already a dep).
// This Map-based store is sufficient for single-process / Vercel Edge.
// ---------------------------------------------------------------------------

interface RateBucket {
  count: number;
  resetAt: number; // epoch ms
}

const rateLimitStore = new Map<string, RateBucket>();

// Cleanup stale entries every 5 minutes to prevent unbounded growth
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of rateLimitStore) {
    if (bucket.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Rate limiting constants
// ---------------------------------------------------------------------------
const ANON_RATE_LIMIT = process.env.NODE_ENV === "development" ? 1000 : 200; // requests per window
const ANON_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_AUTH_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function hashKeyFast(raw: string): string {
  // Simple non-crypto hash for prefix extraction. We only need the prefix
  // to build a rate-limit key; full validation happens in the route handler
  // via api-auth.ts.  We extract just the first 12 chars of the bearer token
  // so we never store full keys in memory.
  return raw.slice(0, 12);
}

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupStaleEntries();

  const now = Date.now();
  let bucket = rateLimitStore.get(key);

  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(key, bucket);
  }

  bucket.count++;

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

// ---------------------------------------------------------------------------
// CORS headers for preflight
// ---------------------------------------------------------------------------
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type",
  "Access-Control-Max-Age": "86400",
};

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply to /api/v1/* and /api/* routes (but not Next.js internals)
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip rate limiting for employer dashboard routes that use cookie auth
  // and for non-rate-limited internal routes
  if (
    pathname.startsWith("/api/employers/auth") ||
    pathname.startsWith("/api/employers/billing") ||
    pathname.startsWith("/api/employers/analytics") ||
    pathname.startsWith("/api/employers/listings") ||
    pathname.startsWith("/api/mcp") ||
    pathname.startsWith("/api/openapi.json") ||
    pathname.startsWith("/api/widget")
  ) {
    return NextResponse.next();
  }

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  // Extract bearer token or API key (if present)
  const authHeader = request.headers.get("authorization");
  const apiKeyHeader = request.headers.get("x-api-key");
  let bearerToken: string | null = null;

  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      bearerToken = parts[1].trim();
    }
  } else if (apiKeyHeader) {
    bearerToken = apiKeyHeader;
  }

  // Determine rate-limit identity and limits
  let rateLimitKey: string;
  let rateLimit: number;
  let windowMs: number;

  if (bearerToken) {
    // Authenticated: rate limit by key prefix
    // The actual key validation (hash lookup, is_active check) happens in the
    // route handler via validateApiKey(). Here we only enforce the rate window.
    // We read the tier limit from a header set by the route if available,
    // but since middleware runs before the handler, we use a generous default
    // that the per-tier limit in api-auth will further restrict if needed.
    const prefix = hashKeyFast(bearerToken);
    rateLimitKey = `auth:${prefix}`;

    // Attempt to read the rate limit from the key prefix.
    // For middleware we use a default ceiling; the handler-level auth
    // rejects invalid keys entirely.
    rateLimit = 1000; // generous default; per-tier enforcement at handler
    windowMs = DEFAULT_AUTH_WINDOW_MS;
  } else {
    // Anonymous: rate limit by IP
    const ip = getClientIp(request);
    rateLimitKey = `anon:${ip}`;
    rateLimit = ANON_RATE_LIMIT;
    windowMs = ANON_WINDOW_MS;
  }

  const { allowed, remaining, resetAt } = checkRateLimit(
    rateLimitKey,
    rateLimit,
    windowMs
  );

  // Build response (either pass-through or 429)
  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retry_after_seconds: Math.max(1, retryAfter),
      },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          "X-RateLimit-Limit": String(rateLimit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
          "Retry-After": String(Math.max(1, retryAfter)),
        },
      }
    );
  }

  // Allowed — continue with rate-limit headers
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(rateLimit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

  // Add CORS headers
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

// ---------------------------------------------------------------------------
// Matcher — only run middleware on API routes
// ---------------------------------------------------------------------------
export const config = {
  matcher: ["/api/:path*"],
};
