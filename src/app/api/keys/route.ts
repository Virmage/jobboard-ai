import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { apiKeys } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateApiKey } from "@/lib/api-auth";
import { requireAuth, apiSuccess, apiError, apiCorsOptions } from "@/lib/api-helpers";

const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  tier: z.enum(["free", "starter", "pro", "enterprise"]).default("free"),
});

// ---------------------------------------------------------------------------
// POST /api/keys — generate API key (auth required)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const parsed = createKeySchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return apiError("Validation error", 400, issues);
    }

    const { name, tier } = parsed.data;

    // Rate limits by tier
    const tierLimits: Record<string, number> = {
      free: 100,
      starter: 1000,
      pro: 10000,
      enterprise: 100000,
    };

    // Generate key
    const { raw, hash, prefix } = generateApiKey();

    // Store in DB
    const [key] = await db
      .insert(apiKeys)
      .values({
        email: auth.email,
        key: raw,
        keyHash: hash,
        keyPrefix: prefix,
        name: name ?? null,
        ownerId: auth.employerId,
        tier,
        rateLimit: tierLimits[tier] ?? 100,
        monthlyLimit: tierLimits[tier] ?? 100,
        requestCount: 0,
        isActive: true,
      })
      .returning({
        id: apiKeys.id,
        keyPrefix: apiKeys.keyPrefix,
        name: apiKeys.name,
        tier: apiKeys.tier,
        rateLimit: apiKeys.rateLimit,
        createdAt: apiKeys.createdAt,
      });

    return apiSuccess(
      {
        id: key.id,
        key: raw, // Only returned once at creation time
        key_prefix: key.keyPrefix,
        name: key.name,
        tier: key.tier,
        rate_limit: key.rateLimit,
        created_at: key.createdAt,
      },
      undefined,
      201
    );
  } catch (err) {
    console.error("POST /api/keys error:", err);
    return apiError("Internal server error", 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/keys — list API keys (auth required)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const keys = await db
      .select({
        id: apiKeys.id,
        keyPrefix: apiKeys.keyPrefix,
        name: apiKeys.name,
        tier: apiKeys.tier,
        rateLimit: apiKeys.rateLimit,
        isActive: apiKeys.isActive,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.ownerId, auth.employerId))
      .orderBy(desc(apiKeys.createdAt));

    const data = keys.map((k) => ({
      id: k.id,
      key_prefix: k.keyPrefix,
      name: k.name,
      tier: k.tier,
      rate_limit: k.rateLimit,
      is_active: k.isActive,
      last_used_at: k.lastUsedAt,
      created_at: k.createdAt,
    }));

    return apiSuccess(data, { total: data.length });
  } catch (err) {
    console.error("GET /api/keys error:", err);
    return apiError("Internal server error", 500);
  }
}

export function OPTIONS() {
  return apiCorsOptions();
}
