import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import {
  fetchText,
  sleep,
  titleMatchesCreativeLeadership,
  ALL_SEARCH_QUERIES,
} from "../utils";

/**
 * Scan EthicalJobs Australia for nonprofit/social impact jobs.
 *
 * EthicalJobs renders SSR HTML with job listing cards.
 * Market: Australia, Categories: nonprofit/social impact.
 */
export async function scanEthicalJobs(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 4 === 0);

  for (const query of queries) {
    const url = `https://www.ethicaljobs.com.au/jobs?q=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // EthicalJobs uses card-based job listings
      $(
        "[class*='job-card'], " +
        "[class*='JobCard'], " +
        ".job-listing, " +
        "article[class*='job'], " +
        ".search-result, " +
        ".listing-card"
      ).each((_, el) => {
        const $el = $(el);
        const $titleLink = $el.find("a[href*='/job/'], a[href*='/jobs/']").first();
        const href = $titleLink.attr("href");
        const title =
          $titleLink.text().trim() ||
          $el.find("h2, h3, h4, [class*='title']").first().text().trim();
        const company =
          $el.find("[class*='organisation'], [class*='company'], [class*='org']").first().text().trim();
        const location =
          $el.find("[class*='location']").first().text().trim();
        const salary =
          $el.find("[class*='salary'], [class*='remuneration']").first().text().trim() || undefined;

        if (!title) return;
        if (!titleMatchesCreativeLeadership(title)) return;

        const fullLink = href
          ? href.startsWith("http")
            ? href
            : `https://www.ethicaljobs.com.au${href}`
          : undefined;
        if (!fullLink || seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: location || "Australia",
          link: fullLink,
          source: "EthicalJobs",
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
                job?.jobLocation?.address?.addressLocality || "Australia",
              link,
              source: "EthicalJobs",
              postedAt: job?.datePosted ? new Date(job.datePosted) : undefined,
              salary:
                job?.baseSalary?.value
                  ? `A$${job.baseSalary.value.minValue?.toLocaleString()} - A$${job.baseSalary.value.maxValue?.toLocaleString()}`
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
