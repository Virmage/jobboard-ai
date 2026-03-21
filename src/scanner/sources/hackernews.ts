import type { RawJob } from "../types";
import { fetchJSON, sleep } from "../utils";

const HN_API = "https://hacker-news.firebaseio.com/v0";

/**
 * HN API item shape (simplified).
 */
interface HNItem {
  id: number;
  type: string;
  by?: string;
  time?: number;
  text?: string;
  title?: string;
  kids?: number[];
  parent?: number;
  url?: string;
}

/**
 * HN search API result for finding "Who is Hiring" threads.
 */
interface HNSearchResponse {
  hits: Array<{
    objectID: string;
    title: string;
    created_at: string;
    num_comments: number;
  }>;
}

/**
 * Parse a single HN comment into job details.
 * HN hiring comments typically follow the format:
 * "Company Name | Role Title | Location | Salary | Remote/Onsite"
 * The first line is the "header", rest is description.
 */
function parseHiringComment(text: string): {
  title: string;
  company: string;
  location: string;
  description: string;
  link: string;
  salary?: string;
} | null {
  if (!text) return null;

  // Strip HTML tags but preserve line breaks
  const clean = text
    .replace(/<p>/g, "\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<a\s+href="([^"]*)"[^>]*>[^<]*<\/a>/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();

  if (!clean) return null;

  const lines = clean.split("\n").filter((l) => l.trim());
  if (!lines.length) return null;

  const header = lines[0];

  // Split header by pipe delimiter
  const parts = header.split("|").map((p) => p.trim());

  if (parts.length < 2) {
    // Not a structured job posting, maybe just a comment
    return null;
  }

  const company = parts[0] || "Unknown";
  const title = parts[1] || "See listing";
  const location = parts.length > 2 ? parts[2] : "See listing";

  // Look for salary info
  let salary: string | undefined;
  for (const part of parts) {
    if (/\$[\d,]+/i.test(part) || /\d+k\s*[-–]\s*\d+k/i.test(part)) {
      salary = part.trim();
      break;
    }
  }

  // Extract first URL from clean text as apply link
  const urlMatch = clean.match(/https?:\/\/[^\s<>"]+/);
  const link = urlMatch ? urlMatch[0] : "";

  const description = lines.slice(1).join("\n").slice(0, 500);

  return { title, company, location, description, link, salary };
}

/**
 * Scan Hacker News monthly "Who is Hiring?" threads for job posts.
 *
 * Uses HN Firebase API: https://hacker-news.firebaseio.com/v0/
 * Finds the latest "Who is hiring?" thread, parses top-level comments.
 * Market: global (US-heavy tech/startup).
 */
export async function scanHackerNews(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seenIds = new Set<number>();

  // Step 1: Find the latest "Who is hiring?" thread via Algolia HN search
  const searchData = await fetchJSON<HNSearchResponse>(
    `https://hn.algolia.com/api/v1/search?query=%22who%20is%20hiring%22&tags=story,ask_hn&hitsPerPage=5`,
    20_000,
  );

  if (!searchData?.hits?.length) {
    console.warn("  [HN] Could not find 'Who is Hiring' thread");
    return [];
  }

  // Get the most recent thread
  const latestThread = searchData.hits
    .filter((h) => /who is hiring/i.test(h.title))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

  if (!latestThread) {
    console.warn("  [HN] No matching 'Who is Hiring' thread found");
    return [];
  }

  // Step 2: Fetch the thread item to get comment IDs
  const threadId = latestThread.objectID;
  const thread = await fetchJSON<HNItem>(
    `${HN_API}/item/${threadId}.json`,
  );

  if (!thread?.kids?.length) {
    console.warn("  [HN] Thread has no comments");
    return [];
  }

  // Step 3: Fetch top-level comments (these are the job postings)
  // Limit to first 200 comments to avoid excessive requests
  const commentIds = thread.kids.slice(0, 200);
  const batchSize = 20;

  for (let i = 0; i < commentIds.length; i += batchSize) {
    const batch = commentIds.slice(i, i + batchSize);

    const comments = await Promise.all(
      batch.map((id) => fetchJSON<HNItem>(`${HN_API}/item/${id}.json`)),
    );

    for (const comment of comments) {
      if (!comment || !comment.text || comment.type !== "comment") continue;
      if (seenIds.has(comment.id)) continue;

      const parsed = parseHiringComment(comment.text);
      if (!parsed || !parsed.title) continue;

      // Check title relevance


      seenIds.add(comment.id);

      // Build HN permalink as fallback link
      const hnLink = `https://news.ycombinator.com/item?id=${comment.id}`;

      jobs.push({
        title: parsed.title,
        company: parsed.company,
        location: parsed.location || "See listing",
        link: parsed.link || hnLink,
        source: "HackerNews",
        description: parsed.description,
        salary: parsed.salary,
        postedAt: comment.time
          ? new Date(comment.time * 1000)
          : undefined,
      });
    }

    await sleep(500);
  }

  return jobs;
}
