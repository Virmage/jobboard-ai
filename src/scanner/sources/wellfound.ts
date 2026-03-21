import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import {
  fetchText,
  sleep,
  ALL_SEARCH_QUERIES,
} from "../utils";

/**
 * Scan Wellfound (AngelList) for startup jobs.
 *
 * Wellfound renders SSR HTML with job listing cards.
 * We search across a representative subset of queries to cover all categories.
 * Market: Global (US-heavy), all startup roles.
 */
export async function scanWellfound(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  // Use a subset of queries to avoid excessive requests
  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 3 === 0);

  for (const query of queries) {
    const params = new URLSearchParams({
      query: query,
    });

    const url = `https://wellfound.com/jobs?${params}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(3_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // Wellfound uses structured job card components
      $(
        "[data-test='JobSearchResults'] .styles_jobCard____, " +
        ".styles_jobListingCard____, " +
        "[class*='JobListing_container'], " +
        "[class*='job-listing'], " +
        "div[data-test='StartupResult']"
      ).each((_, el) => {
        const $el = $(el);
        const $titleLink =
          $el.find("a[href*='/jobs/'], a[href*='/role/']").first();
        const href = $titleLink.attr("href");
        const title =
          $titleLink.text().trim() ||
          $el.find("h2, h3, [class*='title']").first().text().trim();
        const company =
          $el.find("[class*='company'], [data-test='StartupName'], h2 a").first().text().trim() ||
          $el.find("a[href*='/company/']").first().text().trim();
        const location =
          $el.find("[class*='location'], [class*='Location']").first().text().trim();

        if (!title || !href) return;


        const fullLink = href.startsWith("http")
          ? href
          : `https://wellfound.com${href}`;
        if (seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "Startup",
          location: location || "Remote / US",
          link: fullLink,
          source: "Wellfound",
        });
      });

      // Fallback: JSON-LD
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() ?? "");
          const items = Array.isArray(data) ? data : data?.itemListElement || [data];
          for (const item of items) {
            const job = item?.item || item;
            if (job?.["@type"] !== "JobPosting") continue;
            const title = job?.title || job?.name;


            const link = job?.url || job?.sameAs;
            if (!link || seenLinks.has(link)) continue;

            seenLinks.add(link);
            jobs.push({
              title,
              company: job?.hiringOrganization?.name || "Startup",
              location:
                job?.jobLocation?.address?.addressLocality || "Remote / US",
              link,
              source: "Wellfound",
              postedAt: job?.datePosted ? new Date(job.datePosted) : undefined,
            });
          }
        } catch {
          // skip malformed JSON-LD
        }
      });
    } catch {
      // page parse failure
    }

    await sleep(3_000);
  }

  return jobs;
}
