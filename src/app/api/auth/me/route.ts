import { NextRequest } from "next/server";
import { db } from "@/db/index";
import { employers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, apiSuccess, apiError, apiCorsOptions } from "@/lib/api-helpers";

// ---------------------------------------------------------------------------
// GET /api/auth/me — current user from JWT
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const employer = await db.query.employers.findFirst({
      where: eq(employers.id, auth.employerId),
    });

    if (!employer) {
      return apiError("Employer not found", 404);
    }

    return apiSuccess({
      id: employer.id,
      email: employer.email,
      company_name: employer.companyName,
      company_url: employer.companyUrl,
      logo_url: employer.logoUrl,
      is_active: employer.isActive,
      created_at: employer.createdAt,
    });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return apiError("Internal server error", 500);
  }
}

export function OPTIONS() {
  return apiCorsOptions();
}
