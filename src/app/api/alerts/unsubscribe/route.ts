import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { savedSearches } from "@/db/schema";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// GET /api/alerts/unsubscribe?id=... — mark saved search as inactive
// Returns a simple HTML page confirming unsubscription
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return new NextResponse(
      htmlPage("Missing alert ID", "No alert ID was provided in the link."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const [updated] = await db
      .update(savedSearches)
      .set({ isActive: false })
      .where(eq(savedSearches.id, id))
      .returning();

    if (!updated) {
      return new NextResponse(
        htmlPage("Not Found", "This alert was not found or has already been removed."),
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    return new NextResponse(
      htmlPage(
        "You've been unsubscribed",
        "You will no longer receive email alerts for this saved search. You can re-enable it anytime from your dashboard."
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err) {
    console.error("GET /api/alerts/unsubscribe error:", err);
    return new NextResponse(
      htmlPage("Error", "Something went wrong. Please try again later."),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

// ---------------------------------------------------------------------------
// Helper — minimal HTML page
// ---------------------------------------------------------------------------
function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; color: #111827; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.1); padding: 2rem 2.5rem; max-width: 420px; text-align: center; }
    h1 { font-size: 1.25rem; margin-bottom: .5rem; }
    p { color: #6b7280; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
