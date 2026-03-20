import type { RawJob } from "../types";
import { fetchText, sleep, titleMatchesCreativeLeadership, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * jobs.ac.uk RSS feeds by subject area.
 * Feed URLs from https://www.jobs.ac.uk/feeds/
 */
const FEEDS = [
  "https://www.jobs.ac.uk/feeds/rss.aspx?keyword=&subject=7",   // Computing & IT
  "https://www.jobs.ac.uk/feeds/rss.aspx?keyword=&subject=3",   // Engineering
  "https://www.jobs.ac.uk/feeds/rss.aspx?keyword=&subject=19",  // Management
  "https://www.jobs.ac.uk/feeds/rss.aspx?keyword=&subject=10",  // Finance
  "https://www.jobs.ac.uk/feeds/rss.aspx?keyword=&subject=1",   // Science
  "https://www.jobs.ac.uk/feeds/rss.aspx?keyword=&subject=13",  // Marketing & Communications
  "https://www.jobs.ac.uk/feeds/rss.aspx?keyword=&subject=12",  // Human Resources
  "https://www.jobs.ac.uk/feeds/rss.aspx?keyword=&subject=14",  // Legal
  "https://www.jobs.ac.uk/feeds/rss.aspx?keyword=&subject=16",  // Research
  "https://www.jobs.ac.uk/feeds/rss.aspx?keyword=&subject=2",   // Data & Analytics
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
 * Extract employer and location from jobs.ac.uk description.
 * Description often contains "Employer: University of X" and "Location: City, Country"
 */
function extractDetails(description: string): { employer: string; location: string } {
  const clean = description.replace(/<[^>]*>/g, "");

  const employerMatch = clean.match(/(?:Employer|Institution|Organisation):\s*([^\n,]+)/i);
  const locationMatch = clean.match(/(?:Location|Based (?:in|at)):\s*([^\n]+)/i);

  return {
    employer: employerMatch?.[1]?.trim() || "See listing",
    location: locationMatch?.[1]?.trim() || "United Kingdom",
  };
}

/**
 * Scan jobs.ac.uk RSS feeds for academic/research roles.
 *
 * RSS feeds by subject: https://www.jobs.ac.uk/feeds/
 * No auth needed.
 * Market: UK/international, Categories: academic/research.
 */
export async function scanJobsAcUk(): Promise<RawJob[]> {
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
      if (!titleMatchesCreativeLeadership(item.title)) continue;

      // Date filter
      const postedDate = item.pubDate ? new Date(item.pubDate) : null;
      if (postedDate && !isWithinCutoff(postedDate, CUTOFF_DAYS)) continue;

      seenLinks.add(item.link);

      const { employer, location } = extractDetails(item.description);

      // Extract salary from description
      const salaryMatch = item.description
        ?.replace(/<[^>]*>/g, "")
        ?.match(/(?:Salary|Grade|Pay):\s*([^\n]+)/i);

      jobs.push({
        title: item.title,
        company: employer,
        location,
        link: item.link,
        source: "jobs.ac.uk",
        description: item.description
          ?.replace(/<[^>]*>/g, "")
          ?.slice(0, 500),
        salary: salaryMatch?.[1]?.trim(),
        postedAt: postedDate ?? undefined,
      });
    }

    await sleep(1_000);
  }

  return jobs;
}
