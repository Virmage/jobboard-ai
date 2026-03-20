import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import {
  fetchText,
  sleep,
  titleMatchesCreativeLeadership,
  ALL_SEARCH_QUERIES,
} from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Scan Totaljobs UK for job listings.
 *
 * Totaljobs renders SSR HTML with job card results.
 * Market: UK, Categories: all, 120K+ listings.
 */
export async function scanTotaljobs(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 3 === 0);

  for (const query of queries) {
    const params = new URLSearchParams({
      Keywords: query,
      Radius: "0",
      posted: String(CUTOFF_DAYS),
    });

    const url = `https://www.totaljobs.com/jobs/${encodeURIComponent(query).replace(/%20/g, "-")}?posted=${CUTOFF_DAYS}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // Totaljobs uses job card result components
      $(
        "[data-testid='job-card'], " +
        ".res-1p9ibj9, " +
        ".job-card, " +
        "article.job, " +
        ".search-result"
      ).each((_, el) => {
        const $el = $(el);
        const $titleLink = $el.find("a[href*='/job/'], a[class*='job-title']").first();
        const href = $titleLink.attr("href");
        const title =
          $titleLink.text().trim() ||
          $el.find("h2, h3, [class*='title']").first().text().trim();
        const company =
          $el.find("[class*='company'], [data-testid='company-name'], .company-name").first().text().trim();
        const location =
          $el.find("[class*='location'], [data-testid='location'], .job-location").first().text().trim();
        const salary =
          $el.find("[class*='salary'], [data-testid='salary']").first().text().trim() || undefined;

        if (!title) return;
        if (!titleMatchesCreativeLeadership(title)) return;

        const fullLink = href
          ? href.startsWith("http")
            ? href
            : `https://www.totaljobs.com${href}`
          : undefined;
        if (!fullLink || seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: location || "United Kingdom",
          link: fullLink,
          source: "Totaljobs",
          salary,
        });
      });

      // JSON-LD fallback
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() ?? "");
          const items = data?.itemListElement || (Array.isArray(data) ? data : []);
          for (const item of items) {
            const job = item?.item || item;
            if (job?.["@type"] !== "JobPosting") continue;
            const title = job?.title || job?.name;
            if (!title || !titleMatchesCreativeLeadership(title)) continue;

            const link = job?.url || job?.sameAs;
            if (!link || seenLinks.has(link)) continue;

            seenLinks.add(link);
            jobs.push({
              title,
              company: job?.hiringOrganization?.name || "See listing",
              location:
                job?.jobLocation?.address?.addressLocality || "United Kingdom",
              link,
              source: "Totaljobs",
              postedAt: job?.datePosted ? new Date(job.datePosted) : undefined,
              salary:
                job?.baseSalary?.value
                  ? `£${job.baseSalary.value.minValue?.toLocaleString()} - £${job.baseSalary.value.maxValue?.toLocaleString()}`
                  : undefined,
            });
          }
        } catch {
          // skip
        }
      });
    } catch {
      // page parse failure
    }

    await sleep(2_000);
  }

  return jobs;
}
