import { NextRequest } from "next/server";
import { z } from "zod";
import { suggestRoles } from "@/db/queries";
import {
  jsonOk,
  badRequest,
  zodValidationError,
  handleCorsOptions,
} from "@/lib/api-response";
import { withAuth, type ValidateResult } from "@/lib/api-auth";

// ---------------------------------------------------------------------------
// Query-param schema
// ---------------------------------------------------------------------------
const suggestSchema = z.object({
  q: z.string().min(1, "q is required").max(200),
});

// ---------------------------------------------------------------------------
// GET /api/v1/roles/suggest?q=...
// ---------------------------------------------------------------------------
export const GET = withAuth(async function GET(request: NextRequest, _auth: ValidateResult) {
  const { searchParams } = request.nextUrl;
  const raw: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    raw[key] = value;
  }

  const parsed = suggestSchema.safeParse(raw);
  if (!parsed.success) {
    return zodValidationError(parsed.error);
  }

  const matches = await suggestRoles(parsed.data.q);

  return jsonOk({
    query: parsed.data.q,
    suggestions: matches.map((m) => ({
      id: m.id,
      slug: m.slug,
      canonical_title: m.canonicalTitle,
      related_titles: m.relatedTitles ?? [],
      industry: m.industry
        ? {
            id: m.industry.id,
            slug: m.industry.slug,
            name: m.industry.name,
          }
        : null,
      score: m.score,
    })),
  });
});

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export function OPTIONS() {
  return handleCorsOptions();
}
