import { NextRequest } from "next/server";
import { z } from "zod";
import { getJobById, incrementServeCount } from "@/db/queries";
import { getFreshnessScore } from "@/lib/freshness";
import {
  jsonOk,
  badRequest,
  notFound,
  handleCorsOptions,
} from "@/lib/api-response";

// ---------------------------------------------------------------------------
// Param validation
// ---------------------------------------------------------------------------
const uuidSchema = z.string().uuid("id must be a valid UUID");

// ---------------------------------------------------------------------------
// GET /api/v1/jobs/:id
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) {
    return badRequest("Invalid job ID", parsed.error.issues);
  }

  const job = await getJobById(id);
  if (!job) {
    return notFound("Job not found");
  }

  const freshness = getFreshnessScore(job.lastSeenAt);

  // Increment serve count (fire-and-forget)
  incrementServeCount([job.id]).catch(() => {});

  return jsonOk({
    job: { ...job, freshness },
  });
}

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export function OPTIONS() {
  return handleCorsOptions();
}
