import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/index";
import { jobs } from "@/db/schema";

// ---------------------------------------------------------------------------
// GET /go/[id] — Click-through proxy with link health check
//
// 1. Looks up the job by ID
// 2. HEAD-checks the target URL is alive
// 3. If alive → 302 redirect + increment serve count
// 4. If dead → mark job inactive + show fallback page
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return new NextResponse("Invalid job ID", { status: 400 });
  }

  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
  });

  if (!job || !job.link) {
    return new NextResponse(deadLinkHtml("This job listing no longer exists."), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Health check the target URL
  const isAlive = await checkLink(job.link);

  if (isAlive) {
    // Fire-and-forget: bump serve count
    db.update(jobs)
      .set({ serveCount: sql`${jobs.serveCount} + 1` })
      .where(eq(jobs.id, id))
      .catch(() => {});

    return NextResponse.redirect(job.link, 302);
  }

  // Link is dead — mark job inactive
  await db
    .update(jobs)
    .set({ isActive: false })
    .where(eq(jobs.id, id))
    .catch(() => {});

  return new NextResponse(
    deadLinkHtml(
      `This listing for "${job.title}" at ${job.company} is no longer available. The original link has been removed.`
    ),
    {
      status: 410,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

// ---------------------------------------------------------------------------
// HEAD-check a URL (5s timeout, follows redirects)
// ---------------------------------------------------------------------------
async function checkLink(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JobBoardAI/1.0; +https://jobboardai.com)",
      },
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    // 2xx or 3xx = alive. Some sites block HEAD, so also try GET on 405.
    if (res.ok) return true;
    if (res.status === 405) {
      const getRes = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; JobBoardAI/1.0; +https://jobboardai.com)",
        },
        signal: AbortSignal.timeout(5000),
        redirect: "follow",
      });
      return getRes.ok;
    }
    return false;
  } catch {
    // Timeout or network error — don't mark as dead (could be transient)
    return true;
  }
}

// ---------------------------------------------------------------------------
// Fallback HTML for dead links
// ---------------------------------------------------------------------------
function deadLinkHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Listing Unavailable — JobBoard AI</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a0a; color: #e5e5e5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { max-width: 480px; text-align: center; padding: 48px 32px; }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 12px; }
    p { font-size: 14px; color: #888; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; padding: 10px 24px; background: #3b82f6; color: white; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; }
    a:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Listing Unavailable</h1>
    <p>${message}</p>
    <a href="/jobs">Browse Active Jobs</a>
  </div>
</body>
</html>`;
}
