import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText } from "../utils";

const BASE_URL = "https://www.campaignbrief.com/jobs/";

const CREATIVE_ROLES = /creative director|head of creative|executive creative|group creative|chief creative|ecd|gcd|head of brand|brand director|vp creative|head of design|design director|creative lead|copywriter|copy director|art director|creative strategist|head of marketing|marketing director|content director/i;

/**
 * Scrape Campaign Brief Australia job board.
 * Australian advertising industry — strong source for creative leadership roles.
 */
export async function scanCampaignBriefAU(): Promise<RawJob[]> {
  const html = await fetchText(BASE_URL);
  if (!html) return [];

  const $ = cheerio.load(html);
  const jobs: RawJob[] = [];

  // Campaign Brief job cards — each job is typically in an article or div with title + company
  $("article, .job-listing, .job, .post, .entry").each((_, el) => {
    const $el = $(el);

    const titleEl = $el.find("h2, h3, h4, .job-title, .entry-title").first();
    const title = titleEl.text().trim();
    if (!title || !CREATIVE_ROLES.test(title)) return;

    const linkEl = titleEl.find("a").first().length
      ? titleEl.find("a").first()
      : $el.find("a").first();
    const href = linkEl.attr("href") ?? "";
    const link = href.startsWith("http") ? href : `https://www.campaignbrief.com${href}`;

    const company = $el.find(".company, .employer, .job-company, .meta-author").first().text().trim()
      || $el.find("p").first().text().trim().slice(0, 60)
      || "Unknown";

    const location = $el.find(".location, .job-location, .meta-location").first().text().trim()
      || "Australia";

    if (!link || link === BASE_URL) return;

    jobs.push({
      title,
      company,
      location: location || "Australia",
      link,
      source: "Campaign Brief AU",
    });
  });

  // Fallback: look for any links with creative role keywords
  if (jobs.length === 0) {
    $("a").each((_, el) => {
      const text = $(el).text().trim();
      if (!text || !CREATIVE_ROLES.test(text)) return;
      const href = $(el).attr("href") ?? "";
      if (!href || href === "#") return;
      const link = href.startsWith("http") ? href : `https://www.campaignbrief.com${href}`;

      jobs.push({
        title: text,
        company: "Unknown",
        location: "Australia",
        link,
        source: "Campaign Brief AU",
      });
    });
  }

  return jobs;
}
