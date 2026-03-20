import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import {
  fetchText,
  sleep,
  titleMatchesCreativeLeadership,
} from "../utils";

/**
 * Search queries — covers all major job categories for EU market.
 */
const SEARCH_QUERIES = [
  // Creative & Brand
  "creative director", "brand director", "head of design",
  "head of creative", "art director", "copywriter",
  // Engineering
  "software engineer", "senior software engineer", "frontend engineer",
  "backend engineer", "fullstack engineer", "devops engineer",
  "engineering manager", "CTO",
  // Product
  "product manager", "senior product manager", "head of product",
  // Design
  "product designer", "UX designer", "UI designer", "UX researcher",
  // Data & AI
  "data scientist", "data engineer", "ML engineer", "data analyst",
  // Marketing & Growth
  "marketing director", "head of marketing", "growth manager",
  "performance marketing", "product marketing manager",
  // Sales
  "account executive", "sales manager", "head of sales",
  // Operations
  "operations manager", "program manager", "project manager",
  // People
  "recruiter", "head of people", "HR manager",
  // French equivalents
  "directeur creatif", "directeur marketing",
  "ingenieur logiciel", "chef de produit",
];

/**
 * Scan welcometothejungle.com for FR/EU creative leadership roles.
 *
 * Welcome to the Jungle (WTTJ) is a major European job platform
 * popular in France, Germany, Spain, and other EU markets.
 * They have both an HTML frontend and a GraphQL/JSON API.
 */
export async function scanWelcomeJungle(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    // WTTJ search URL
    const url = `https://www.welcometothejungle.com/en/jobs?query=${encodeURIComponent(query)}&refinementList%5Boffices.country_code%5D%5B%5D=FR&refinementList%5Boffices.country_code%5D%5B%5D=DE&refinementList%5Boffices.country_code%5D%5B%5D=GB&refinementList%5Boffices.country_code%5D%5B%5D=NL&refinementList%5Boffices.country_code%5D%5B%5D=ES`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_500);
      continue;
    }

    const $ = cheerio.load(html);

    // Try to extract __NEXT_DATA__ or embedded JSON for job listings
    $('script[id="__NEXT_DATA__"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? "");
        const hits =
          data?.props?.pageProps?.initialResults?.hits ||
          data?.props?.pageProps?.results?.hits ||
          [];

        for (const hit of hits) {
          const title = hit?.name || hit?.title;
          if (!title || !titleMatchesCreativeLeadership(title)) continue;

          const slug = hit?.slug || hit?.reference;
          const orgSlug =
            hit?.organization?.slug || hit?.company?.slug;
          const company =
            hit?.organization?.name || hit?.company?.name || "See listing";
          const loc =
            hit?.office?.city ||
            hit?.offices?.[0]?.city ||
            "Europe";

          const link = slug && orgSlug
            ? `https://www.welcometothejungle.com/en/companies/${orgSlug}/jobs/${slug}`
            : `https://www.welcometothejungle.com/en/jobs?query=${encodeURIComponent(query)}`;

          if (seenLinks.has(link)) continue;
          seenLinks.add(link);

          jobs.push({
            title,
            company,
            location: loc,
            link,
            source: "Welcome to the Jungle",
            postedAt: hit?.published_at
              ? new Date(hit.published_at)
              : undefined,
          });
        }
      } catch {
        // malformed data
      }
    });

    // Fallback: HTML job cards
    $(
      "[class*='job-card'], [class*='JobCard'], article, [data-testid*='job']",
    ).each((_, el) => {
      const $el = $(el);
      const $link = $el
        .find("a[href*='/jobs/']")
        .first();
      const href = $link.attr("href") || $el.find("a").first().attr("href");
      const title =
        $link.text().trim() ||
        $el.find("h3, h4, [class*='title']").text().trim();
      const company = $el
        .find("[class*='company'], [class*='organization']")
        .text()
        .trim();
      const loc = $el
        .find("[class*='location'], [class*='city']")
        .text()
        .trim();

      if (!title || !href) return;
      if (!titleMatchesCreativeLeadership(title)) return;

      const fullLink = href.startsWith("http")
        ? href
        : `https://www.welcometothejungle.com${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: company || "See listing",
        location: loc || "Europe",
        link: fullLink,
        source: "Welcome to the Jungle",
      });
    });

    await sleep(2_500);
  }

  return jobs;
}
