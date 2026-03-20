import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep, titleMatchesCreativeLeadership, isWithinCutoff, parseRelativeAge } from "../utils";

const CUTOFF_DAYS = 14;
const BASE_URL = "https://www.efinancialcareers.com";

/**
 * Market-specific search URLs for eFinancialCareers.
 * Each entry targets a different geographic market.
 */
const SEARCH_URLS = [
  // US
  `${BASE_URL}/jobs-USA`,
  `${BASE_URL}/jobs-USA/q-technology`,
  `${BASE_URL}/jobs-USA/q-fintech`,
  `${BASE_URL}/jobs-USA/q-quantitative`,
  // UK
  `${BASE_URL}/jobs-United_Kingdom`,
  `${BASE_URL}/jobs-United_Kingdom/q-technology`,
  `${BASE_URL}/jobs-United_Kingdom/q-fintech`,
  // Germany
  `${BASE_URL}/jobs-Germany/q-technology`,
  `${BASE_URL}/jobs-Germany/q-finance`,
  // Singapore
  `${BASE_URL}/jobs-Singapore/q-technology`,
  `${BASE_URL}/jobs-Singapore/q-finance`,
  // Hong Kong
  `${BASE_URL}/jobs-Hong_Kong/q-technology`,
  `${BASE_URL}/jobs-Hong_Kong/q-finance`,
];

/**
 * Scan eFinancialCareers for finance/fintech roles.
 *
 * HTML scraping of job listing pages.
 * URL: https://www.efinancialcareers.com/jobs
 * Market: global (US, UK, DE, SG, HK).
 */
export async function scanEFinancialCareers(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  for (const searchUrl of SEARCH_URLS) {
    const html = await fetchText(searchUrl);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    const $ = cheerio.load(html);

    // eFinancialCareers uses various card structures
    // Look for job card elements
    $(
      '[data-testid="job-card"], .job-card, article.job, .card-job, [class*="JobCard"], [class*="job-listing"], a[href*="/jobs-"]',
    ).each((_, el) => {
      const $el = $(el);

      // Extract title
      const title =
        $el.find('[data-testid="job-title"], h3, h2, .job-title, [class*="Title"]').first().text().trim()
        || $el.find("a").first().text().trim();

      if (!title) return;
      if (!titleMatchesCreativeLeadership(title)) return;

      // Extract link
      let link = $el.find("a").first().attr("href") || $el.attr("href") || "";
      if (link && !link.startsWith("http")) {
        link = `${BASE_URL}${link}`;
      }
      if (!link || seenLinks.has(link)) return;

      // Extract company
      const company =
        $el.find('[data-testid="company-name"], .company-name, [class*="Company"]').first().text().trim()
        || "See listing";

      // Extract location
      const location =
        $el.find('[data-testid="job-location"], .job-location, [class*="Location"]').first().text().trim()
        || "Finance Hub";

      // Extract salary if available
      const salary =
        $el.find('[data-testid="salary"], .salary, [class*="Salary"]').first().text().trim()
        || undefined;

      // Check date
      const dateText =
        $el.find('[data-testid="posted-date"], .posted-date, time, [class*="Date"], [class*="date"]').first().text().trim();
      const timeEl = $el.find("time").attr("datetime");

      let withinCutoff = true;
      if (timeEl) {
        withinCutoff = isWithinCutoff(new Date(timeEl), CUTOFF_DAYS);
      } else if (dateText) {
        const ageDays = parseRelativeAge(dateText);
        withinCutoff = ageDays <= CUTOFF_DAYS;
      }
      if (!withinCutoff) return;

      seenLinks.add(link);

      const postedDate = timeEl ? new Date(timeEl) : undefined;

      jobs.push({
        title,
        company,
        location,
        link,
        source: "eFinancialCareers",
        salary,
        postedAt: postedDate,
      });
    });

    await sleep(2_000);
  }

  return jobs;
}
