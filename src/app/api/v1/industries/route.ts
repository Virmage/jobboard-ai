import { NextRequest } from "next/server";
import { listIndustries } from "@/db/queries";
import { jsonOk, handleCorsOptions } from "@/lib/api-response";
import { withAuth, type ValidateResult } from "@/lib/api-auth";

// ---------------------------------------------------------------------------
// GET /api/v1/industries
// ---------------------------------------------------------------------------
export const GET = withAuth(async function GET(_request: NextRequest, _auth: ValidateResult) {
  const industries = await listIndustries();

  return jsonOk({
    industries: industries.map((ind) => ({
      id: ind.id,
      slug: ind.slug,
      name: ind.name,
      description: ind.description,
      display_order: ind.displayOrder,
      job_count: Number(ind.jobCount),
    })),
  });
});

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export function OPTIONS() {
  return handleCorsOptions();
}
