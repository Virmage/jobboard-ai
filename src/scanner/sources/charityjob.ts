import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import {
  fetchText,
  sleep,
  titleMatchesCreativeLeadership,
  ALL_SEARCH_QUERIES,
} from "../utils";

/**
 * Scan CharityJob UK for nonprofit/charity jobs.
 *
 * CharityJob renders SSR HTML with job listing cards.
 * Market: UK, Categories: nonprofit/charity.
 */
export async function scanCharityJob(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 4 === 0);

  for (const query of queries) {
    const url = `https://www.charityjob.co.uk/jobs/${encodeURIComponent(query).replace(/%20/g, "-")}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // CharityJob uses structured job card elements
      $(
        ".job-listing, " +
        "[class*='job-card'], " +
        ".search-result, " +
        ".listing-item, " +
        "article[class*='job']"
      ).each((_, el) => {
        const $el = $(el);
        const $titleLink = $el.find("a[href*='/job/'], a[href*='/jobs/']").first();
        const href = $titleLink.attr("href");
        const title =
          $titleLink.text().trim() ||
          $el.find("h2, h3, [class*='title']").first().text().trim();
        const company =
          $el.find("[class*='recruiter'], [class*='company'], [class*='charity']").first().text().trim();
        const location =
          $el.find("[class*='location']").first().text().trim();
        const salary =
          $el.find("[class*='salary']").first().text().trim() || undefined;

        if (!title) return;
        if (!titleMatchesCreativeLeadership(title)) return;

        const fullLink = href
          ? href.startsWith("http")
            ? href
            : `https://www.charityjob.co.uk${href}`
          : undefined;
        if (!fullLink || seenLinks.has(fullLink)) return;

        seenLinks.add(fullLink);
        jobs.push({
          title,
          company: company || "Charity",
          location: location || "United Kingdom",
          link: fullLink,
          source: "CharityJob",
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
              company: job?.hiringOrganization?.name || "Charity",
              location:
                job?.jobLocation?.address?.addressLocality || "United Kingdom",
              link,
              source: "CharityJob",
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
