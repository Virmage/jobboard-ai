import type { RawJob } from "../types";
import { fetchText, sleep, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Remotive RSS category feeds.
 */
const FEEDS = [
  "https://remotive.com/remote-jobs/feed",
  "https://remotive.com/remote-jobs/software-dev/feed",
  "https://remotive.com/remote-jobs/design/feed",
  "https://remotive.com/remote-jobs/product/feed",
  "https://remotive.com/remote-jobs/customer-support/feed",
  "https://remotive.com/remote-jobs/marketing/feed",
  "https://remotive.com/remote-jobs/sales/feed",
  "https://remotive.com/remote-jobs/hr/feed",
  "https://remotive.com/remote-jobs/finance-legal/feed",
  "https://remotive.com/remote-jobs/data/feed",
  "https://remotive.com/remote-jobs/devops/feed",
  "https://remotive.com/remote-jobs/qa/feed",
  "https://remotive.com/remote-jobs/writing/feed",
  "https://remotive.com/remote-jobs/business/feed",
];

/**
 * Simple RSS item parser.
 */
function parseRSSItems(xml: string): Array<{
  title: string;
  link: string;
  pubDate: string;
  description: string;
}> {
  const items: Array<{
    title: string;
    link: string;
    pubDate: string;
    description: string;
  }> = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1]
      || block.match(/<title>(.*?)<\/title>/)?.[1]
      || "";
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] || "";
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
    const description = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1]
      || block.match(/<description>([\s\S]*?)<\/description>/)?.[1]
      || "";

    items.push({ title, link, pubDate, description });
  }

  return items;
}

/**
 * Extract company name from Remotive RSS title or description.
 * Remotive titles are sometimes "Job Title at Company" or description contains company info.
 */
function extractCompany(title: string, description: string): string {
  // Pattern: "Title at Company"
  const atMatch = title.match(/\bat\s+(.+)$/i);
  if (atMatch) return atMatch[1].trim();

  // Try to find company in description (often first bold text or link)
  const companyMatch = description.match(/<strong>(.*?)<\/strong>/);
  if (companyMatch) return companyMatch[1].trim();

  return "See listing";
}

/**
 * Scan Remotive RSS feeds for remote jobs.
 *
 * RSS feed: https://remotive.com/remote-jobs/feed (+ category feeds)
 * No auth needed.
 * Market: global remote.
 */
export async function scanRemotive(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  for (const feedUrl of FEEDS) {
    const xml = await fetchText(feedUrl);

    if (!xml) {
      await sleep(800);
      continue;
    }

    const items = parseRSSItems(xml);

    for (const item of items) {
      if (!item.link || seenLinks.has(item.link)) continue;
      if (!item.title) continue;

      // Clean title (remove "at Company" suffix for matching)
      const cleanTitle = item.title.replace(/\s+at\s+.+$/i, "").trim();


      // Date filter
      const postedDate = item.pubDate ? new Date(item.pubDate) : null;
      if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

      seenLinks.add(item.link);

      const company = extractCompany(item.title, item.description);

      jobs.push({
        title: cleanTitle,
        company,
        location: "Remote",
        link: item.link,
        source: "Remotive",
        description: item.description
          ?.replace(/<[^>]*>/g, "")
          ?.slice(0, 500),
        postedAt: postedDate ?? undefined,
      });
    }

    await sleep(800);
  }

  return jobs;
}
