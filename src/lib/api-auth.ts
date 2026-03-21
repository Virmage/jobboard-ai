import { createHash } from "crypto";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { apiKeys } from "@/db/schema";
import {
  jsonError,
  unauthorized,
  tooManyRequests,
} from "@/lib/api-response";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ApiKeyInfo {
  id: string;
  email: string;
  keyPrefix: string;
  name: string | null;
  tier: string;
  rateLimit: number;
  monthlyLimit: number;
  requestCount: number;
  ownerId: string | null;
}

export interface AuthResult {
  authenticated: true;
  key: ApiKeyInfo;
}

export interface AuthAnonymous {
  authenticated: false;
  key: null;
}

export type ValidateResult = AuthResult | AuthAnonymous;

// ---------------------------------------------------------------------------
// In-memory IP rate limiter (10 req/hour for unauthenticated requests)
// ---------------------------------------------------------------------------
const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const IP_LIMIT = 10;

const ipBuckets = new Map<string, { count: number; resetsAt: number }>();

function checkIpRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  let bucket = ipBuckets.get(ip);

  if (!bucket || now >= bucket.resetsAt) {
    bucket = { count: 0, resetsAt: now + IP_WINDOW_MS };
    ipBuckets.set(ip, bucket);
  }

  bucket.count++;

  if (bucket.count > IP_LIMIT) {
    const retryAfter = Math.ceil((bucket.resetsAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}

// Periodic cleanup of stale IP buckets (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of ipBuckets) {
    if (now >= bucket.resetsAt) ipBuckets.delete(ip);
  }
}, 10 * 60 * 1000).unref?.();

// ---------------------------------------------------------------------------
// hashApiKey — SHA-256 hash of the raw key for DB lookup
// ---------------------------------------------------------------------------
function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

// ---------------------------------------------------------------------------
// extractApiKey — pull key from X-API-Key header, Authorization Bearer,
//                 or ?api_key= query param
// ---------------------------------------------------------------------------
function extractApiKey(request: NextRequest): string | null {
  // 1. X-API-Key header
  const xApiKey = request.headers.get("x-api-key");
  if (xApiKey) return xApiKey.trim();

  // 2. Authorization: Bearer <key>
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      const token = parts[1].trim();
      // Only treat as API key if it starts with our prefix
      if (token.startsWith("aj_live_")) return token;
    }
  }

  // 3. ?api_key= query param
  const queryKey = request.nextUrl.searchParams.get("api_key");
  if (queryKey) return queryKey.trim();

  return null;
}

// ---------------------------------------------------------------------------
// getClientIp
// ---------------------------------------------------------------------------
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// validateApiKey — main validation function
//
// Extracts key from request, hashes it, looks up in DB,
// checks is_active, checks rate limit, increments counter.
// ---------------------------------------------------------------------------
export async function validateApiKey(
  request: NextRequest
): Promise<ValidateResult> {
  const token = extractApiKey(request);

  if (!token) {
    return { authenticated: false, key: null };
  }

  const hash = hashApiKey(token);

  const record = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.keyHash, hash), eq(apiKeys.isActive, true)),
  });

  if (!record) {
    return { authenticated: false, key: null };
  }

  // Check monthly rate limit
  if (record.requestCount >= record.monthlyLimit) {
    return { authenticated: false, key: null };
  }

  // Increment request count + update last_used_at (fire-and-forget)
  db.update(apiKeys)
    .set({
      lastUsedAt: new Date(),
      requestCount: sql`${apiKeys.requestCount} + 1`,
    })
    .where(eq(apiKeys.id, record.id))
    .then(() => {})
    .catch(() => {});

  return {
    authenticated: true,
    key: {
      id: record.id,
      email: record.email,
      keyPrefix: record.keyPrefix,
      name: record.name,
      tier: record.tier,
      rateLimit: record.rateLimit,
      monthlyLimit: record.monthlyLimit,
      requestCount: record.requestCount,
      ownerId: record.ownerId,
    },
  };
}

// ---------------------------------------------------------------------------
// generateApiKey — create a new API key (returns raw key + hash + prefix)
//
// Format: aj_live_ + 32 random hex characters
// ---------------------------------------------------------------------------
export function generateApiKey(): {
  raw: string;
  hash: string;
  prefix: string;
} {
  const bytes = new Uint8Array(16); // 16 bytes = 32 hex chars
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const raw = `aj_live_${hex}`;
  const hash = hashApiKey(raw);
  const prefix = raw.slice(0, 16); // "aj_live_" + first 8 hex chars

  return { raw, hash, prefix };
}

// ---------------------------------------------------------------------------
// withAuth — middleware wrapper for API route handlers
//
// Extracts API key from request. If key is provided but invalid, returns 401.
// If no key, applies IP-based rate limiting (10 req/hour).
// If key is valid but over monthly limit, returns 429.
//
// Passes AuthResult to the handler so it knows the caller's tier/identity.
// ---------------------------------------------------------------------------
export function withAuth(
  handler: (
    request: NextRequest,
    auth: ValidateResult,
    ...args: unknown[]
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const rawKey = extractApiKey(request);

    // If a key was provided, validate it
    if (rawKey) {
      const hash = hashApiKey(rawKey);

      const record = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.keyHash, hash),
      });

      // Key not found at all
      if (!record) {
        return unauthorized("Invalid API key");
      }

      // Key is deactivated
      if (!record.isActive) {
        return unauthorized("API key has been deactivated");
      }

      // Key has exceeded monthly limit
      if (record.requestCount >= record.monthlyLimit) {
        return tooManyRequests(
          Math.ceil(
            (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime() -
              Date.now()) /
              1000
          )
        );
      }

      // Increment request count + update last_used_at
      db.update(apiKeys)
        .set({
          lastUsedAt: new Date(),
          requestCount: sql`${apiKeys.requestCount} + 1`,
        })
        .where(eq(apiKeys.id, record.id))
        .then(() => {})
        .catch(() => {});

      const auth: AuthResult = {
        authenticated: true,
        key: {
          id: record.id,
          email: record.email,
          keyPrefix: record.keyPrefix,
          name: record.name,
          tier: record.tier,
          rateLimit: record.rateLimit,
          monthlyLimit: record.monthlyLimit,
          requestCount: record.requestCount,
          ownerId: record.ownerId,
        },
      };

      return handler(request, auth, ...args);
    }

    // No key provided — apply IP rate limiting
    const ip = getClientIp(request);
    const { allowed, retryAfter } = checkIpRateLimit(ip);

    if (!allowed) {
      return tooManyRequests(retryAfter);
    }

    const auth: AuthAnonymous = { authenticated: false, key: null };
    return handler(request, auth, ...args);
  };
}
