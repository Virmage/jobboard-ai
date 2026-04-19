import type { Tweet } from "../types";

const NITTER_INSTANCES = [
  "https://xcancel.com",
  "https://nitter.privacyredirect.com",
  "https://nitter.poast.org",
  "https://nitter.net",
];

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  guid: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/;
  const linkRegex = /<link>([\s\S]*?)<\/link>/;
  const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;
  const guidRegex = /<guid[^>]*>([\s\S]*?)<\/guid>/;

  let m;
  while ((m = itemRegex.exec(xml))) {
    const body = m[1];
    const title = titleRegex.exec(body)?.[1] ?? "";
    const link = linkRegex.exec(body)?.[1] ?? "";
    const pubDate = pubDateRegex.exec(body)?.[1] ?? "";
    const guid = guidRegex.exec(body)?.[1] ?? link;
    items.push({
      title: decodeEntities(title.trim()),
      link: link.trim(),
      pubDate: pubDate.trim(),
      guid: guid.trim(),
    });
  }
  return items;
}

function extractTweetId(link: string): string | null {
  const m = link.match(/\/status\/(\d+)/);
  return m ? m[1] : null;
}

async function fetchNitterRss(instance: string, username: string): Promise<Tweet[]> {
  const url = `${instance}/${encodeURIComponent(username)}/rss`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0",
    },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  const items = parseRss(xml);
  const tweets: Tweet[] = [];
  for (const item of items) {
    const id = extractTweetId(item.link);
    if (!id) continue;
    tweets.push({
      id,
      author: username,
      created_at: new Date(item.pubDate).toISOString(),
      text: item.title,
      url: `https://x.com/${username}/status/${id}`,
      is_reply: item.title.startsWith("R to @") || item.title.startsWith("RT "),
    });
  }
  return tweets;
}

export async function fetchRecentTweetsViaNitter(
  username: string,
): Promise<Tweet[]> {
  const errors: string[] = [];
  for (const instance of NITTER_INSTANCES) {
    try {
      const tweets = await fetchNitterRss(instance, username);
      if (tweets.length > 0) return tweets;
      errors.push(`${instance}: 0 items`);
    } catch (e) {
      errors.push(`${instance}: ${e instanceof Error ? e.message : e}`);
    }
  }
  throw new Error(
    `Nitter fetcher failed for @${username}:\n  - ${errors.join("\n  - ")}`,
  );
}
