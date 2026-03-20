import * as cheerio from "cheerio";
import type { RawJob } from "../types";
import { fetchText, isWithinCutoff } from "../utils";

const CUTOFF_DAYS = 14;

/**
 * Scan remote3.co via its RSS feed.
 *
 * The site itself is a client-rendered SPA, so we use the RSS endpoint
 * which returns XML with <item> elements including pubDate.
 */
export async function scanRemote3(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const xml = await fetchText("https://remote3.co/api/rss");
  if (!xml) return jobs;

  const $ = cheerio.load(xml, { xmlMode: true });
  $("item").each((_, el) => {
    const $el = $(el);
    const title = $el.find("title").text().trim();
    const link = $el.find("link").text().trim();
    const desc = $el.find("description").text().trim();
    const creator = $el.find("dc\\:creator, creator").text().trim();
    const company = creator || desc.split(/\s*[-\u2013|]\s*/)[0] || "";

    // Filter by pubDate
    const pubDate = $el.find("pubDate").text().trim();
    if (pubDate && !isWithinCutoff(new Date(pubDate), CUTOFF_DAYS)) return;

    if (title) {
      jobs.push({
        title,
        company: company || "Unknown",
        location: "Remote",
        link: link || "https://remote3.co",
        source: "remote3.co",
        postedAt: pubDate ? new Date(pubDate) : undefined,
      });
    }
  });

  return jobs;
}
