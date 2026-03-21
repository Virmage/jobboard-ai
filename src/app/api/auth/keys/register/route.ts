import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { apiKeys } from "@/db/schema";
import { generateApiKey } from "@/lib/api-auth";
import {
  jsonOk,
  jsonError,
  badRequest,
  handleCorsOptions,
} from "@/lib/api-response";

const registerSchema = z.object({
  email: z.string().email("A valid email is required"),
  name: z.string().max(100).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/auth/keys/register
//
// Simple API key registration — no email verification for now.
// Accepts { email, name? } and returns a new API key.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return badRequest("Validation error", issues);
    }

    const { email, name } = parsed.data;

    // Generate key
    const { raw, hash, prefix } = generateApiKey();

    // Tier defaults
    const tier = "free";
    const monthlyLimit = 100;
    const rateLimit = 100;

    // Store in DB
    const [record] = await db
      .insert(apiKeys)
      .values({
        email: email.toLowerCase(),
        key: raw,
        keyHash: hash,
        keyPrefix: prefix,
        name: name ?? null,
        tier,
        rateLimit,
        monthlyLimit,
        requestCount: 0,
        isActive: true,
      })
      .returning({
        id: apiKeys.id,
        email: apiKeys.email,
        keyPrefix: apiKeys.keyPrefix,
        name: apiKeys.name,
        tier: apiKeys.tier,
        monthlyLimit: apiKeys.monthlyLimit,
        createdAt: apiKeys.createdAt,
      });

    return jsonOk(
      {
        message: "API key created. Store it securely — it will not be shown again.",
        api_key: raw,
        key_prefix: record.keyPrefix,
        email: record.email,
        name: record.name,
        tier: record.tier,
        monthly_limit: record.monthlyLimit,
        created_at: record.createdAt,
      },
      201
    );
  } catch (err) {
    console.error("POST /api/auth/keys/register error:", err);
    return jsonError("Internal server error", 500);
  }
}

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export function OPTIONS() {
  return handleCorsOptions();
}
