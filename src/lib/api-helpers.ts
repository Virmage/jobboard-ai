import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { validateApiKey } from "@/lib/api-auth";

// ---------------------------------------------------------------------------
// Consistent JSON response envelope
// ---------------------------------------------------------------------------
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function apiSuccess<T>(
  data: T,
  meta?: { total?: number; page?: number; limit?: number },
  status = 200
): NextResponse {
  const body: Record<string, unknown> = { success: true, data };
  if (meta) body.meta = meta;
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export function apiError(
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  const body: Record<string, unknown> = { success: false, error: message };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

export function apiCorsOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ---------------------------------------------------------------------------
// JWT Bearer auth — extracts employer session from Authorization header
// ---------------------------------------------------------------------------
export async function requireAuth(
  request: Request
): Promise<{ employerId: string; email: string } | NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return apiError("Missing Authorization header", 401);
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return apiError("Invalid Authorization header format", 401);
  }

  const token = parts[1].trim();
  const payload = await verifyToken(token);
  if (!payload) {
    return apiError("Invalid or expired token", 401);
  }

  return { employerId: payload.employerId, email: payload.email };
}

// ---------------------------------------------------------------------------
// API Key auth — extracts key from X-API-Key header
// ---------------------------------------------------------------------------
export async function optionalApiKeyAuth(request: NextRequest) {
  const result = await validateApiKey(request);
  return result.authenticated ? result.key : null;
}
