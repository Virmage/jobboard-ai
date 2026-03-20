import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db/index";
import { savedSearches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/api-helpers";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const updateAlertSchema = z.object({
  name: z.string().optional(),
  query: z.string().optional(),
  industry: z.string().optional(),
  taxonomy: z.string().optional(),
  region: z.string().optional(),
  is_remote: z.boolean().optional(),
  salary_min: z.number().int().positive().nullable().optional(),
  frequency: z.enum(["daily", "weekly", "instant"]).optional(),
  is_active: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/alerts/[id] — get a single saved search
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const [result] = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.id, id));

    if (!result) {
      return apiError("Saved search not found", 404);
    }

    return apiSuccess(result);
  } catch (err) {
    console.error("GET /api/alerts/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/alerts/[id] — update a saved search
// ---------------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateAlertSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const data = parsed.data;

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.query !== undefined) updates.query = data.query;
    if (data.industry !== undefined) updates.industrySlug = data.industry;
    if (data.taxonomy !== undefined) updates.taxonomySlug = data.taxonomy;
    if (data.region !== undefined) updates.region = data.region;
    if (data.is_remote !== undefined) updates.isRemote = data.is_remote;
    if (data.salary_min !== undefined) updates.salaryMin = data.salary_min;
    if (data.frequency !== undefined) updates.frequency = data.frequency;
    if (data.is_active !== undefined) updates.isActive = data.is_active;

    if (Object.keys(updates).length === 0) {
      return apiError("No fields to update", 400);
    }

    const [updated] = await db
      .update(savedSearches)
      .set(updates)
      .where(eq(savedSearches.id, id))
      .returning();

    if (!updated) {
      return apiError("Saved search not found", 404);
    }

    return apiSuccess(updated);
  } catch (err) {
    console.error("PATCH /api/alerts/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/alerts/[id] — soft delete (set is_active = false)
// ---------------------------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const [updated] = await db
      .update(savedSearches)
      .set({ isActive: false })
      .where(eq(savedSearches.id, id))
      .returning();

    if (!updated) {
      return apiError("Saved search not found", 404);
    }

    return apiSuccess({ message: "Saved search deactivated" });
  } catch (err) {
    console.error("DELETE /api/alerts/[id] error:", err);
    return apiError("Internal server error", 500);
  }
}
