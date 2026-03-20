import { listIndustries } from "@/db/queries";
import { jsonOk, handleCorsOptions } from "@/lib/api-response";

// ---------------------------------------------------------------------------
// GET /api/v1/industries
// ---------------------------------------------------------------------------
export async function GET() {
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
}

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export function OPTIONS() {
  return handleCorsOptions();
}
