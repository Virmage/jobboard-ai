import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, isWithinCutoff, ALL_SEARCH_QUERIES } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Search queries — covers all major job categories.
 * We use a representative subset to avoid excessive requests.
 */
const SEARCH_QUERIES = ALL_SEARCH_QUERIES.filter((_,i) => i % 5 === 0);

/**
 * Scan indeed.com for creative director / head of brand roles (remote).
 *
 * Indeed guest pages render SSR HTML with job card divs.
 * We filter by remote and last 14 days.
 */
export async function scanIndeed(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    // fromage=14 = posted in last 14 days, remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11 = remote
    const params = new URLSearchParams({
      q: query,
      l: "",
      fromage: String(CUTOFF_DAYS),
      remotejob: "032b3046-06a3-4876-8dfd-474eb5e7ed11",
      sort: "date",
    });

    const url = `https://www.indeed.com/jobs?${params}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(3_000);
      continue;
    }

    const $ = cheerio.load(html);

    // Indeed renders job cards in div.job_seen_beacon or similar
    $(
      ".job_seen_beacon, .jobsearch-ResultsList .result, [data-jk], .tapItem",
    ).each((_, el) => {
      const $el = $(el);
      const title = $el
        .find(
          "h2.jobTitle span[title], h2.jobTitle a, .jobTitle span, .jcs-JobTitle span",
        )
        .first()
        .text()
        .trim();
      const company = $el
        .find(
          "[data-testid='company-name'], .companyName, .company_location .companyName",
        )
        .text()
        .trim();
      const loc = $el
        .find(
          "[data-testid='text-location'], .companyLocation, .company_location .companyLocation",
        )
        .text()
        .trim();

      // Extract job key from data attribute or link
      const jk =
        $el.attr("data-jk") ||
        $el.find("a[data-jk]").attr("data-jk") ||
        $el.find("a[href*='jk=']").attr("href")?.match(/jk=([a-f0-9]+)/)?.[1];

      if (!title) return;


      const link = jk
        ? `https://www.indeed.com/viewjob?jk=${jk}`
        : `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}`;

      if (seenLinks.has(link)) return;
      seenLinks.add(link);

      jobs.push({
        title,
        company: company || "See listing",
        location: loc || "Remote",
        link,
        source: "Indeed",
      });
    });

    // Also try JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? "");
        const items = data?.itemListElement || [];
        for (const item of items) {
          const job = item?.item || item;
          const title = job?.title || job?.name;


          const link = job?.url || job?.sameAs;
          if (!link || seenLinks.has(link)) continue;

          const posted = job?.datePosted;
          if (posted && !isWithinCutoff(new Date(posted), CUTOFF_DAYS)) continue;

          seenLinks.add(link);
          jobs.push({
            title,
            company: job?.hiringOrganization?.name || "See listing",
            location:
              job?.jobLocation?.address?.addressLocality || "Remote",
            link,
            source: "Indeed",
            postedAt: posted ? new Date(posted) : undefined,
          });
        }
      } catch {
        // skip
      }
    });

    await sleep(3_000);
  }

  return jobs;
}
