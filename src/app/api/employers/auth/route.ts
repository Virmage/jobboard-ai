import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { employers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, company_name, mode } = body as {
      email?: string;
      password?: string;
      company_name?: string;
      mode?: "login" | "register";
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // ---------- Register ----------
    if (mode === "register") {
      if (!company_name) {
        return NextResponse.json(
          { error: "Company name is required for registration" },
          { status: 400 },
        );
      }

      const existing = await db.query.employers.findFirst({
        where: eq(employers.email, email.toLowerCase()),
      });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 },
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [employer] = await db
        .insert(employers)
        .values({
          name: company_name,
          email: email.toLowerCase(),
          passwordHash,
          companyName: company_name,
        })
        .returning({ id: employers.id, email: employers.email });

      await setSessionCookie(employer.id, employer.email);

      return NextResponse.json({
        success: true,
        employer: { id: employer.id, email: employer.email },
      });
    }

    // ---------- Login ----------
    const employer = await db.query.employers.findFirst({
      where: eq(employers.email, email.toLowerCase()),
    });

    if (!employer) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, employer.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!employer.isActive) {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 403 },
      );
    }

    await setSessionCookie(employer.id, employer.email);

    return NextResponse.json({
      success: true,
      employer: {
        id: employer.id,
        email: employer.email,
        companyName: employer.companyName,
      },
    });
  } catch (err) {
    console.error("Employer auth error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
