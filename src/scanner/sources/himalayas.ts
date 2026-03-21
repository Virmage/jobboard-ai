import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import {
  fetchText,
  sleep,
  ALL_SEARCH_QUERIES,
} from "../utils";

/**
 * Scan Himalayas.app for remote jobs.
 *
 * Himalayas renders SSR HTML with job cards.
 * Market: Global remote.
 */
export async function scanHimalayas(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 4 === 0);

  for (const query of queries) {
    const url = `https://himalayas.app/jobs?q=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // Himalayas uses card-based job listings
      $(
        "a[href*='/jobs/'], " +
        "[class*='job-card'], " +
        "[class*='JobCard'], " +
        "article"
      ).each((_, el) => {
        const $el = $(el);
        const isLink = $el.is("a");
        const $titleLink = isLink ? $el : $el.find("a[href*='/jobs/']").first();
        const href = $titleLink.attr("href");

        // Skip navigation/category links
        if (href && !href.match(/\/jobs\/[a-z0-9-]+/i)) return;

        const title =
          $el.find("h2, h3, h4, [class*='title']").first().text().trim() ||
          $titleLink.text().trim();
        const company =
          $el.find("[class*='company'], [class*='Company']").first().text().trim();
        const location =
          $el.find("[class*='location'], [class*='Location']").first().text().trim();
        const salary =
          $el.find("[class*='salary'], [class*='Salary']").first().text().trim() || undefined;

        if (!title || title.length < 3) return;


        const fullLink = href
          ? href.startsWith("http")
            ? href
            : `https://himalayas.app${href}`
          : undefined;
        if (!fullLink || seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "See listing",
          location: location || "Remote",
          link: fullLink,
          source: "Himalayas",
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


            const link = job?.url || job?.sameAs;
            if (!link || seenLinks.has(link)) continue;

            seenLinks.add(link);
            jobs.push({
              title,
              company: job?.hiringOrganization?.name || "See listing",
              location:
                job?.jobLocation?.address?.addressLocality || "Remote",
              link,
              source: "Himalayas",
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
