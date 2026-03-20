import { db } from "@/db";
import { jobs } from "@/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";

/**
 * Expires featured listings whose featured_until timestamp has passed.
 * Sets is_featured = false on any job where featured_until < NOW() and
 * is_featured is still true.
 */
export async function handleExpireFeatures(): Promise<void> {
  console.log("[expire-features] Checking for expired featured listings...");

  const result = await db
    .update(jobs)
    .set({ isFeatured: false })
    .where(
      and(
        eq(jobs.isFeatured, true),
        lt(jobs.featuredUntil, sql`NOW()`),
      ),
    )
    .returning({ id: jobs.id, title: jobs.title });

  if (result.length > 0) {
    console.log(
      `[expire-features] Expired ${result.length} listing(s):`,
      result.map((r) => r.title).join(", "),
    );
  } else {
    console.log("[expire-features] No listings to expire");
  }
}
