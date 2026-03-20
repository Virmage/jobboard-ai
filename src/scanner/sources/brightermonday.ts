import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import {
  fetchText,
  sleep,
  titleMatchesCreativeLeadership,
  ALL_SEARCH_QUERIES,
} from "../utils";

/**
 * BrighterMonday country configs for East Africa.
 */
const COUNTRIES = [
  { domain: "www.brightermonday.co.ke", country: "Kenya" },
  { domain: "www.brightermonday.co.ug", country: "Uganda" },
  { domain: "www.brightermonday.co.tz", country: "Tanzania" },
] as const;

/**
 * Scan BrighterMonday for East African job listings.
 *
 * BrighterMonday renders SSR HTML with job listing cards.
 * Market: Kenya, Uganda, Tanzania.
 */
export async function scanBrighterMonday(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 5 === 0);

  for (const { domain, country } of COUNTRIES) {
    for (const query of queries) {
      const url = `https://${domain}/jobs?q=${encodeURIComponent(query)}`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(2_000);
        continue;
      }

      try {
        const $ = cheerio.load(html);

        // BrighterMonday uses job listing card components
        $(
          ".search-results__job-card, " +
          "[class*='job-card'], " +
          ".job-listing, " +
          "article.listing, " +
          ".mx-job-card"
        ).each((_, el) => {
          const $el = $(el);
          const $titleLink = $el.find("a[href*='/job/'], a[href*='/listing/']").first();
          const href = $titleLink.attr("href");
          const title =
            $titleLink.text().trim() ||
            $el.find("h3, h2, [class*='title']").first().text().trim();
          const company =
            $el.find("[class*='company'], .listing__company, [class*='employer']").first().text().trim();
          const location =
            $el.find("[class*='location'], .listing__location").first().text().trim();

          if (!title) return;
          if (!titleMatchesCreativeLeadership(title)) return;

          const fullLink = href
            ? href.startsWith("http")
              ? href
              : `https://${domain}${href}`
            : undefined;
          if (!fullLink || seenLinks.has(fullLink)) return;

          seenLinks.add(fullLink);
          jobs.push({
            title,
            company: company || "See listing",
            location: location || country,
            link: fullLink,
            source: `BrighterMonday (${country})`,
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
                  job?.jobLocation?.address?.addressLocality || country,
                link,
                source: `BrighterMonday (${country})`,
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
  }

  return jobs;
}
