import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { savedSearches } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-helpers";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const createAlertSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  query: z.string().optional(),
  industry: z.string().optional(),
  taxonomy: z.string().optional(),
  region: z.string().optional(),
  is_remote: z.boolean().optional(),
  salary_min: z.number().int().positive().optional(),
  frequency: z.enum(["daily", "weekly", "instant"]).optional().default("daily"),
});

// ---------------------------------------------------------------------------
// POST /api/alerts — create a saved search
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createAlertSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const data = parsed.data;

    const [created] = await db
      .insert(savedSearches)
      .values({
        email: data.email,
        name: data.name ?? null,
        query: data.query ?? null,
        industrySlug: data.industry ?? null,
        taxonomySlug: data.taxonomy ?? null,
        region: data.region ?? null,
        isRemote: data.is_remote ?? null,
        salaryMin: data.salary_min ?? null,
        frequency: data.frequency,
      })
      .returning();

    return apiSuccess(created, undefined, 201);
  } catch (err) {
    console.error("POST /api/alerts error:", err);
    return apiError("Internal server error", 500);
  }
}

// ---------------------------------------------------------------------------
// GET /api/alerts?email=... — list active saved searches for an email
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return apiError("Missing required query param: email", 400);
    }

    const results = await db
      .select()
      .from(savedSearches)
      .where(
        and(eq(savedSearches.email, email), eq(savedSearches.isActive, true))
      );

    return apiSuccess(results);
  } catch (err) {
    console.error("GET /api/alerts error:", err);
    return apiError("Internal server error", 500);
  }
}
