import { eq, and, lt } from "drizzle-orm";
import { db } from "@/db/index";
import { jobs } from "@/db/schema";

const UA =
  "Mozilla/5.0 (compatible; JobBoardAI/1.0; +https://jobboardai.com)";

/**
 * HEAD-check a single URL. Returns true if the link responds 2xx/3xx.
 * On 405 (HEAD not allowed), falls back to GET.
 * On timeout/network error, assumes alive (don't penalize transient failures).
 */
async function isLinkAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    if (res.ok) return true;
    if (res.status === 405) {
      const getRes = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(5000),
        redirect: "follow",
      });
      return getRes.ok;
    }
    // 404, 410, etc = dead
    return res.status < 400;
  } catch {
    // Network/timeout — assume alive
    return true;
  }
}

/**
 * Check all active jobs that haven't been seen in `staleHours` hours.
 * If their link is dead, mark them inactive.
 * Runs in batches of `batchSize` with a delay between batches.
 */
export async function checkStaleLinks(opts?: {
  staleHours?: number;
  batchSize?: number;
  delayMs?: number;
}) {
  const staleHours = opts?.staleHours ?? 48;
  const batchSize = opts?.batchSize ?? 20;
  const delayMs = opts?.delayMs ?? 1000;

  const cutoff = new Date(Date.now() - staleHours * 60 * 60 * 1000);

  const staleJobs = await db.query.jobs.findMany({
    where: and(
      eq(jobs.isActive, true),
      lt(jobs.lastSeenAt, cutoff)
    ),
    columns: { id: true, link: true, title: true, company: true },
    orderBy: (jobs, { asc }) => [asc(jobs.lastSeenAt)],
    limit: 500,
  });

  console.log(
    `[link-checker] Checking ${staleJobs.length} stale jobs (not seen in ${staleHours}h)...`
  );

  let deactivated = 0;

  for (let i = 0; i < staleJobs.length; i += batchSize) {
    const batch = staleJobs.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map(async (job) => {
        if (!job.link) return { id: job.id, alive: false };
        const alive = await isLinkAlive(job.link);
        return { id: job.id, alive, title: job.title, company: job.company };
      })
    );

    for (const r of results) {
      if (!r.alive) {
        await db
          .update(jobs)
          .set({ isActive: false })
          .where(eq(jobs.id, r.id));
        deactivated++;
        console.log(
          `[link-checker] Deactivated: ${r.title} at ${r.company} (dead link)`
        );
      }
    }

    // Pause between batches to avoid hammering servers
    if (i + batchSize < staleJobs.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  console.log(
    `[link-checker] Done. Checked ${staleJobs.length}, deactivated ${deactivated}.`
  );

  return { checked: staleJobs.length, deactivated };
}
