import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import {
  fetchText,
  sleep,
  titleMatchesCreativeLeadership,
  ALL_SEARCH_QUERIES,
} from "../utils";

/**
 * Scan Dice.com for tech/engineering jobs.
 *
 * Dice renders SSR HTML with search result cards.
 * Market: US, Categories: tech/engineering, 70K+ listings.
 */
export async function scanDice(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  // Focus on tech-relevant queries
  const queries = ALL_SEARCH_QUERIES.filter((_, i) => i % 3 === 0);

  for (const query of queries) {
    const params = new URLSearchParams({
      q: query,
      countryCode: "US",
      radius: "30",
      radiusUnit: "mi",
      page: "1",
      pageSize: "100",
      language: "en",
    });

    const url = `https://www.dice.com/jobs?${params}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(3_000);
      continue;
    }

    try {
      const $ = cheerio.load(html);

      // Dice uses custom web components and search result cards
      $(
        "dhi-search-card, " +
        "[class*='search-card'], " +
        ".card-content, " +
        "[data-cy='search-card']"
      ).each((_, el) => {
        const $el = $(el);
        const $titleLink = $el.find("a[href*='/job-detail/'], a.card-title-link").first();
        const href = $titleLink.attr("href");
        const title =
          $titleLink.text().trim() ||
          $el.find("h5, [class*='card-title']").first().text().trim();
        const company =
          $el.find("[data-cy='search-result-company-name'], [class*='company-name'], .card-company a").first().text().trim();
        const location =
          $el.find("[data-cy='search-result-location'], [class*='location'], .card-location").first().text().trim();
        const posted =
          $el.find("[data-cy='card-posted-date'], [class*='posted-date']").first().text().trim();

        if (!title) return;
        if (!titleMatchesCreativeLeadership(title)) return;

        const fullLink = href
          ? href.startsWith("http")
            ? href
            : `https://www.dice.com${href}`
          : `https://www.dice.com/jobs?q=${encodeURIComponent(query)}`;

        if (seenLinks.has(fullLink)) return;
        seenLinks.add(fullLink);

        jobs.push({
          title,
          company: company || "See listing",
          location: location || "US",
          link: fullLink,
          source: "Dice",
        });
      });

      // Fallback: JSON-LD
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
                job?.jobLocation?.address?.addressLocality || "US",
              link,
              source: "Dice",
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
