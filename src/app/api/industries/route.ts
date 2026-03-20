import { listIndustries } from "@/db/queries";
import { apiSuccess, apiCorsOptions } from "@/lib/api-helpers";

// ---------------------------------------------------------------------------
// GET /api/industries — list all industries with job counts
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const results = await listIndustries();

    const data = results.map((ind) => ({
      id: ind.id,
      slug: ind.slug,
      name: ind.name,
      description: ind.description,
      display_order: ind.displayOrder,
      job_count: Number(ind.jobCount),
    }));

    return apiSuccess(data, { total: data.length });
  } catch (err) {
    console.error("GET /api/industries error:", err);
    return apiSuccess([], { total: 0 });
  }
}

export function OPTIONS() {
  return apiCorsOptions();
}
