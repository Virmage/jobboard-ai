import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ---------------------------------------------------------------------------
// CORS headers applied to every API response
// ---------------------------------------------------------------------------
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

// ---------------------------------------------------------------------------
// Success response
// ---------------------------------------------------------------------------
export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: CORS_HEADERS,
  });
}

// ---------------------------------------------------------------------------
// Error responses
// ---------------------------------------------------------------------------
export function jsonError(
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  const body: Record<string, unknown> = { error: message };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, {
    status,
    headers: CORS_HEADERS,
  });
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return jsonError(message, 400, details);
}

export function unauthorized(message = "Unauthorized"): NextResponse {
  return jsonError(message, 401);
}

export function notFound(message = "Not found"): NextResponse {
  return jsonError(message, 404);
}

export function tooManyRequests(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Rate limit exceeded", retry_after_seconds: retryAfter },
    {
      status: 429,
      headers: {
        ...CORS_HEADERS,
        "Retry-After": String(retryAfter),
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Zod validation error formatter
// ---------------------------------------------------------------------------
export function zodValidationError(err: ZodError): NextResponse {
  const issues = err.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  return badRequest("Validation error", issues);
}

// ---------------------------------------------------------------------------
// CORS preflight handler
// ---------------------------------------------------------------------------
export function handleCorsOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
