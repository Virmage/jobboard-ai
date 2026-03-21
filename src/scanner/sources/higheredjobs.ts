import type { RawJob } from "../types";
import { fetchText, sleep, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * HigherEdJobs RSS feed URLs by category.
 */
const FEEDS = [
  "https://www.higheredjobs.com/rss/categoryFeed.cfm?catID=102", // Administrative
  "https://www.higheredjobs.com/rss/categoryFeed.cfm?catID=64",  // Computing / IT
  "https://www.higheredjobs.com/rss/categoryFeed.cfm?catID=65",  // Engineering
  "https://www.higheredjobs.com/rss/categoryFeed.cfm?catID=80",  // Finance
  "https://www.higheredjobs.com/rss/categoryFeed.cfm?catID=73",  // Human Resources
  "https://www.higheredjobs.com/rss/categoryFeed.cfm?catID=85",  // Marketing / Communications
  "https://www.higheredjobs.com/rss/categoryFeed.cfm?catID=66",  // Research
  "https://www.higheredjobs.com/rss/categoryFeed.cfm?catID=105", // Executive
  "https://www.higheredjobs.com/rss/categoryFeed.cfm?catID=99",  // Data / Analytics
  "https://www.higheredjobs.com/rss/categoryFeed.cfm?catID=76",  // Legal
];

/**
 * Parse RSS XML into structured items.
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
 * Extract institution/company from HigherEdJobs title.
 * Titles often follow: "Job Title - Institution Name"
 */
function extractInstitution(title: string): { jobTitle: string; institution: string } {
  const dashIdx = title.lastIndexOf(" - ");
  if (dashIdx > 0) {
    return {
      jobTitle: title.substring(0, dashIdx).trim(),
      institution: title.substring(dashIdx + 3).trim(),
    };
  }
  return { jobTitle: title.trim(), institution: "See listing" };
}

/**
 * Scan HigherEdJobs RSS feeds for higher education roles.
 *
 * RSS: https://www.higheredjobs.com/rss/ (various feeds by category)
 * No auth needed.
 * Market: US, Categories: higher education.
 */
export async function scanHigherEdJobs(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  for (const feedUrl of FEEDS) {
    const xml = await fetchText(feedUrl);

    if (!xml) {
      await sleep(1_000);
      continue;
    }

    const items = parseRSSItems(xml);

    for (const item of items) {
      if (!item.link || seenLinks.has(item.link)) continue;
      if (!item.title) continue;

      const { jobTitle, institution } = extractInstitution(item.title);


      // Date filter
      const postedDate = item.pubDate ? new Date(item.pubDate) : null;
      if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

      seenLinks.add(item.link);

      // Extract location from description if possible
      const locMatch = item.description
        ?.replace(/<[^>]*>/g, "")
        ?.match(/(?:Location|City|State):\s*([^,\n]+(?:,\s*[A-Z]{2})?)/i);

      jobs.push({
        title: jobTitle,
        company: institution,
        location: locMatch?.[1]?.trim() || "United States",
        link: item.link,
        source: "HigherEdJobs",
        description: item.description
          ?.replace(/<[^>]*>/g, "")
          ?.slice(0, 500),
        postedAt: postedDate ?? undefined,
      });
    }

    await sleep(1_000);
  }

  return jobs;
}
