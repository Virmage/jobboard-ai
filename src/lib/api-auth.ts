import { createHash } from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/index";
import { apiKeys } from "@/db/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ApiKeyInfo {
  id: string;
  keyPrefix: string;
  name: string | null;
  tier: string;
  rateLimit: number;
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
// hashApiKey — SHA-256 hash of the raw key for DB lookup
// ---------------------------------------------------------------------------
function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

// ---------------------------------------------------------------------------
// extractBearerToken — pull token from Authorization header
// ---------------------------------------------------------------------------
function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;

  return parts[1].trim();
}

// ---------------------------------------------------------------------------
// validateApiKey — main middleware function
//
// Extracts bearer token from request, hashes it, looks up in DB,
// checks is_active, and returns key info or null for anonymous access.
// ---------------------------------------------------------------------------
export async function validateApiKey(
  request: Request
): Promise<ValidateResult> {
  const token = extractBearerToken(request);

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

  // Update last_used_at (fire-and-forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, record.id))
    .then(() => {})
    .catch(() => {});

  return {
    authenticated: true,
    key: {
      id: record.id,
      keyPrefix: record.keyPrefix,
      name: record.name,
      tier: record.tier,
      rateLimit: record.rateLimit,
      ownerId: record.ownerId,
    },
  };
}

// ---------------------------------------------------------------------------
// generateApiKey — create a new API key (returns raw key + hash + prefix)
//
// Usage: const { raw, hash, prefix } = generateApiKey();
// Store hash in DB, return raw to the user once.
// ---------------------------------------------------------------------------
export function generateApiKey(): {
  raw: string;
  hash: string;
  prefix: string;
} {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw =
    "jbai_" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const hash = hashApiKey(raw);
  const prefix = raw.slice(0, 12);

  return { raw, hash, prefix };
}
