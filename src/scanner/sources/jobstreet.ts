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
 * JobStreet country configs for Southeast Asia.
 */
const COUNTRIES = [
  { domain: "www.jobstreet.com.sg", country: "Singapore", region: "APAC" },
  { domain: "www.jobstreet.com.my", country: "Malaysia", region: "APAC" },
  { domain: "www.jobstreet.com.ph", country: "Philippines", region: "APAC" },
  { domain: "www.jobstreet.co.id", country: "Indonesia", region: "APAC" },
] as const;

/**
 * Scan JobStreet for Southeast Asian job listings.
 *
 * JobStreet renders SSR HTML with job card results.
 * Market: Singapore, Malaysia, Philippines, Indonesia. 240K+ listings.
 */
export async function scanJobStreet(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  // Use a subset to keep request count manageable across 4 countries
  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 5 === 0);

  for (const { domain, country } of COUNTRIES) {
    for (const query of queries) {
      const url = `https://${domain}/jobs?q=${encodeURIComponent(query)}&createdAt=${CUTOFF_DAYS}d`;
      const html = await fetchText(url);
      if (!html) {
        await sleep(2_000);
        continue;
      }

      try {
        const $ = cheerio.load(html);

        // JobStreet uses article elements or data-attribute cards
        $(
          "article[data-card-type='JobCard'], " +
          "[data-automation='jobListing'], " +
          "[class*='job-card'], " +
          ".sx2jih0"
        ).each((_, el) => {
          const $el = $(el);
          const $titleLink = $el.find("a[href*='/job/'], a[href*='/jobs-id/']").first();
          const href = $titleLink.attr("href");
          const title =
            $titleLink.text().trim() ||
            $el.find("h3, h2, [data-automation='jobTitle']").first().text().trim();
          const company =
            $el.find("[data-automation='jobCompany'], [class*='company']").first().text().trim();
          const location =
            $el.find("[data-automation='jobLocation'], [class*='location']").first().text().trim();
          const salary =
            $el.find("[data-automation='jobSalary'], [class*='salary']").first().text().trim() || undefined;

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
            source: `JobStreet (${country})`,
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
                  job?.jobLocation?.address?.addressLocality || country,
                link,
                source: `JobStreet (${country})`,
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
