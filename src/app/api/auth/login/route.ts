import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db/index";
import { employers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";
import { apiSuccess, apiError, apiCorsOptions } from "@/lib/api-helpers";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ---------------------------------------------------------------------------
// POST /api/auth/login — returns JWT token
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return apiError("Validation error", 400, issues);
    }

    const { email, password } = parsed.data;

    // Find employer
    const employer = await db.query.employers.findFirst({
      where: eq(employers.email, email.toLowerCase()),
    });

    if (!employer) {
      return apiError("Invalid email or password", 401);
    }

    // Check password
    const valid = await bcrypt.compare(password, employer.passwordHash);
    if (!valid) {
      return apiError("Invalid email or password", 401);
    }

    if (!employer.isActive) {
      return apiError("Account is disabled", 403);
    }

    // Generate JWT token
    const token = await signToken({
      employerId: employer.id,
      email: employer.email,
    });

    return apiSuccess({
      token,
      employer: {
        id: employer.id,
        email: employer.email,
        company_name: employer.companyName,
        company_url: employer.companyUrl,
        logo_url: employer.logoUrl,
      },
    });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    return apiError("Internal server error", 500);
  }
}

export function OPTIONS() {
  return apiCorsOptions();
}
