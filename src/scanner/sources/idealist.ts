import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import {
  fetchText,
  sleep,
  titleMatchesCreativeLeadership,
  ALL_SEARCH_QUERIES,
} from "../utils";

/**
 * Scan Idealist for nonprofit/social impact jobs.
 *
 * Idealist renders SSR HTML with job listing cards.
 * Market: Global, Categories: nonprofit/social impact.
 */
export async function scanIdealist(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 4 === 0);

  for (const query of queries) {
    const url = `https://www.idealist.org/en/jobs?q=${encodeURIComponent(query)}&sort=DATE_POSTED`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // Idealist uses card components for listings
      $(
        "[class*='Listing_card'], " +
        "[class*='listing-card'], " +
        ".search-result, " +
        "a[href*='/job/']"
      ).each((_, el) => {
        const $el = $(el);
        // Could be the link itself or contain a link
        const isLink = $el.is("a");
        const $titleLink = isLink ? $el : $el.find("a[href*='/job/']").first();
        const href = $titleLink.attr("href");
        const title =
          $el.find("h3, h4, [class*='title'], [class*='name']").first().text().trim() ||
          $titleLink.text().trim();
        const company =
          $el.find("[class*='org'], [class*='company'], [class*='Organization']").first().text().trim();
        const location =
          $el.find("[class*='location'], [class*='Location']").first().text().trim();

        if (!title || title.length < 3) return;
        if (!titleMatchesCreativeLeadership(title)) return;

        const fullLink = href
          ? href.startsWith("http")
            ? href
            : `https://www.idealist.org${href}`
          : undefined;
        if (!fullLink || seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "Nonprofit",
          location: location || "Global",
          link: fullLink,
          source: "Idealist",
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
              company: job?.hiringOrganization?.name || "Nonprofit",
              location:
                job?.jobLocation?.address?.addressLocality || "Global",
              link,
              source: "Idealist",
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

    await sleep(2_000);
  }

  return jobs;
}
