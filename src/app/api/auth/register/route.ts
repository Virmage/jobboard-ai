import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db/index";
import { employers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";
import { apiSuccess, apiError, apiCorsOptions } from "@/lib/api-helpers";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  company_name: z.string().min(1, "Company name is required"),
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
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
      return apiError("Validation error", 400, issues);
    }

    const { email, password, company_name } = parsed.data;

    // Check if email already exists
    const existing = await db.query.employers.findFirst({
      where: eq(employers.email, email.toLowerCase()),
    });
    if (existing) {
      return apiError("An account with this email already exists", 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create employer
    const [employer] = await db
      .insert(employers)
      .values({
        name: company_name,
        email: email.toLowerCase(),
        passwordHash,
        companyName: company_name,
      })
      .returning({
        id: employers.id,
        email: employers.email,
        companyName: employers.companyName,
      });

    // Generate JWT token
    const token = await signToken({
      employerId: employer.id,
      email: employer.email,
    });

    return apiSuccess(
      {
        token,
        employer: {
          id: employer.id,
          email: employer.email,
          company_name: employer.companyName,
        },
      },
      undefined,
      201
    );
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    return apiError("Internal server error", 500);
  }
}

export function OPTIONS() {
  return apiCorsOptions();
}
