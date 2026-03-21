import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, sleep } from "../utils";

/**
 * Scan campaignlive.co.uk/jobs for UK advertising/marketing leadership roles.
 *
 * Campaign is the leading UK advertising trade publication.
 * Their jobs section lists senior marketing and creative roles.
 */
export async function scanCampaignJobs(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  const SEARCH_QUERIES = [
    "creative director",
    "head of brand",
    "marketing director",
    "head of creative",
    "brand director",
    "head of marketing",
    "account director",
    "strategy director",
    "media planner",
    "media buyer",
    "copywriter",
    "art director",
    "head of content",
    "head of social",
    "campaign manager",
    "product marketing",
    "growth manager",
    "performance marketing",
    "digital marketing",
    "head of design",
    "social media manager",
    "communications director",
  ];

  for (const query of SEARCH_QUERIES) {
    const url = `https://www.campaignlive.co.uk/jobs/results?keywords=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    if (!html) {
      await sleep(2_000);
      continue;
    }

    const $ = cheerio.load(html);

    // Campaign job listing cards
    $(
      ".job-result, .job-listing, article, [class*='job-card'], .search-result",
    ).each((_, el) => {
      const $el = $(el);
      const $link = $el
        .find("a[href*='/job/'], a[href*='/jobs/']")
        .first();
      const href = $link.attr("href") || $el.find("a").first().attr("href");
      const title =
        $link.text().trim() ||
        $el.find("h2, h3, .title, [class*='title']").text().trim();
      const company = $el
        .find(
          ".company, .employer, [class*='company'], [class*='employer'], .recruiter",
        )
        .text()
        .trim();
      const loc = $el
        .find(".location, [class*='location']")
        .text()
        .trim();
      const salary = $el
        .find(".salary, [class*='salary']")
        .text()
        .trim();

      if (!title || !href) return;


      const fullLink = href.startsWith("http")
        ? href
        : `https://www.campaignlive.co.uk${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: company || "See listing",
        location: loc || "United Kingdom",
        link: fullLink,
        source: "Campaign",
        salary: salary || undefined,
      });
    });

    // Fallback
    $("a[href*='/job/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      const title = $el.text().trim();

      if (!title || !href || title.length < 10 || title.length > 120) return;


      const fullLink = href.startsWith("http")
        ? href
        : `https://www.campaignlive.co.uk${href}`;
      if (seenLinks.has(fullLink)) return;

      seenLinks.add(fullLink);
      jobs.push({
        title,
        company: "See listing",
        location: "United Kingdom",
        link: fullLink,
        source: "Campaign",
      });
    });

    await sleep(2_000);
  }

  return jobs;
}
