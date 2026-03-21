import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import {
  fetchText,
  sleep,
  ALL_SEARCH_QUERIES,
} from "../utils";

/**
 * Scan Bayt.com for Middle East job listings.
 *
 * Bayt renders SSR HTML with job listing cards.
 * Market: UAE, Saudi Arabia, Gulf region. #1 Middle East job board.
 */
export async function scanBayt(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 3 === 0);

  for (const query of queries) {
    const url = `https://www.bayt.com/en/jobs/?q=${encodeURIComponent(query)}&page=1`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(3_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // Bayt uses list items or divs with job data
      $(
        "[data-js-aid='jobListing'], " +
        ".has-pointer-d, " +
        "li[class*='job'], " +
        "[class*='jobItem'], " +
        ".t-joblisting"
      ).each((_, el) => {
        const $el = $(el);
        const $titleLink = $el.find("a[href*='/job/'], a[href*='/jobs/']").first();
        const href = $titleLink.attr("href");
        const title =
          $titleLink.text().trim() ||
          $el.find("h2, h3, [class*='title']").first().text().trim();
        const company =
          $el.find("[class*='company'], .t-company, [data-js-aid='company']").first().text().trim();
        const location =
          $el.find("[class*='location'], .t-location, [data-js-aid='location']").first().text().trim();

        if (!title) return;


        const fullLink = href
          ? href.startsWith("http")
            ? href
            : `https://www.bayt.com${href}`
          : undefined;
        if (!fullLink || seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: location || "Middle East",
          link: fullLink,
          source: "Bayt",
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


            const link = job?.url || job?.sameAs;
            if (!link || seenLinks.has(link)) continue;

            seenLinks.add(link);
            jobs.push({
              title,
              company: job?.hiringOrganization?.name || "See listing",
              location:
                job?.jobLocation?.address?.addressLocality || "Middle East",
              link,
              source: "Bayt",
              postedAt: job?.datePosted ? new Date(job.datePosted) : undefined,
            });
          }
        } catch {
          // skip
        }
      });
    } catch {
      // page parse failure
    }

    await sleep(3_000);
  }

  return jobs;
}
