import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type",
  "Access-Control-Max-Age": "86400",
};

// ---------------------------------------------------------------------------
// Cache the spec in memory after first read
// ---------------------------------------------------------------------------
let cachedSpec: string | null = null;

function getSpec(): string {
  if (!cachedSpec) {
    const specPath = join(process.cwd(), "public", "openapi.json");
    cachedSpec = readFileSync(specPath, "utf-8");
  }
  return cachedSpec;
}

// ---------------------------------------------------------------------------
// GET /api/openapi.json — OpenAPI 3.1 spec for ChatGPT Actions
// ---------------------------------------------------------------------------
export async function GET() {
  const spec = getSpec();

  return new NextResponse(spec, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

// ---------------------------------------------------------------------------
// OPTIONS — CORS preflight
// ---------------------------------------------------------------------------
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
