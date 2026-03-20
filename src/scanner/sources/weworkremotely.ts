import type { RawJob } from "../types";
import { fetchText, sleep, titleMatchesCreativeLeadership, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * WeWorkRemotely RSS categories.
 */
const CATEGORIES = [
  "programming",
  "design",
  "marketing",
  "customer-support",
  "devops-sysadmin",
  "product",
  "business-exec",
  "finance-legal",
  "human-resources",
];

/**
 * Simple RSS item parser for WWR feeds.
 * Extracts title, link, pubDate, and description from <item> blocks.
 */
function parseRSSItems(xml: string): Array<{
  title: string;
  link: string;
  pubDate: string;
  description: string;
  company: string;
}> {
  const items: Array<{
    title: string;
    link: string;
    pubDate: string;
    description: string;
    company: string;
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

    // WWR titles usually in format "Company: Job Title"
    const colonIdx = title.indexOf(":");
    const company = colonIdx > 0 ? title.substring(0, colonIdx).trim() : "";
    const jobTitle = colonIdx > 0 ? title.substring(colonIdx + 1).trim() : title.trim();

    items.push({
      title: jobTitle,
      link,
      pubDate,
      description,
      company,
    });
  }

  return items;
}

/**
 * Scan We Work Remotely RSS feeds for remote jobs.
 *
 * RSS: https://weworkremotely.com/categories/remote-{category}-jobs.rss
 * No auth needed. Parses XML/RSS.
 * Market: global remote.
 */
export async function scanWeWorkRemotely(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenLinks = new Set<string>();

  for (const category of CATEGORIES) {
    const xml = await fetchText(
      `https://weworkremotely.com/categories/remote-${category}-jobs.rss`,
    );

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

      jobs.push({
        title: item.title,
        company: item.company || "See listing",
        location: "Remote",
        link: item.link,
        source: "WeWorkRemotely",
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
