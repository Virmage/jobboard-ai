import type { Tweet } from "../types";

const SYND_BASE = "https://cdn.syndication.twimg.com";

interface SyndTweet {
  id_str: string;
  text?: string;
  full_text?: string;
  created_at: string;
  user?: { screen_name: string };
  in_reply_to_screen_name?: string | null;
  in_reply_to_status_id_str?: string | null;
}

interface SyndTimelineResponse {
  body?: string;
  props?: {
    pageProps?: {
      timeline?: {
        entries?: Array<{
          content?: {
            tweet?: SyndTweet;
            itemContent?: { tweet?: SyndTweet };
          };
        }>;
      };
    };
  };
  timeline?: { tweets?: SyndTweet[] };
  tweets?: SyndTweet[];
}

function extractTweets(data: SyndTimelineResponse): SyndTweet[] {
  if (Array.isArray(data.tweets)) return data.tweets;
  if (Array.isArray(data.timeline?.tweets)) return data.timeline!.tweets!;
  const entries = data.props?.pageProps?.timeline?.entries ?? [];
  const tweets: SyndTweet[] = [];
  for (const entry of entries) {
    const t = entry.content?.tweet ?? entry.content?.itemContent?.tweet;
    if (t) tweets.push(t);
  }
  return tweets;
}

async function fetchSyndicationJson(
  username: string,
): Promise<SyndTimelineResponse | null> {
  const url = `${SYND_BASE}/timeline/profile?screen_name=${encodeURIComponent(username)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0",
    },
  });
  if (!res.ok) {
    throw new Error(`syndication ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as SyndTimelineResponse;
}

async function fetchEmbedTimelineHtml(username: string): Promise<string> {
  const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${encodeURIComponent(username)}?showReplies=false`;
  const res = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0",
    },
  });
  if (!res.ok) {
    throw new Error(`timeline-profile ${res.status}: ${await res.text()}`);
  }
  return await res.text();
}

function parseNextData(html: string): SyndTimelineResponse | null {
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as SyndTimelineResponse;
  } catch {
    return null;
  }
}

function normalize(raw: SyndTweet, username: string): Tweet {
  const text = raw.full_text ?? raw.text ?? "";
  return {
    id: raw.id_str,
    author: raw.user?.screen_name ?? username,
    created_at: new Date(raw.created_at).toISOString(),
    text,
    url: `https://x.com/${raw.user?.screen_name ?? username}/status/${raw.id_str}`,
    is_reply:
      Boolean(raw.in_reply_to_screen_name) ||
      Boolean(raw.in_reply_to_status_id_str),
    reply_to: raw.in_reply_to_screen_name ?? undefined,
  };
}

export async function fetchRecentTweetsViaSyndication(
  username: string,
): Promise<Tweet[]> {
  const errors: string[] = [];
  try {
    const json = await fetchSyndicationJson(username);
    if (json) {
      const tweets = extractTweets(json);
      if (tweets.length > 0) return tweets.map((t) => normalize(t, username));
      errors.push("cdn.syndication.twimg.com returned no tweets");
    }
  } catch (e) {
    errors.push(`cdn.syndication.twimg.com: ${e instanceof Error ? e.message : e}`);
  }

  try {
    const html = await fetchEmbedTimelineHtml(username);
    const data = parseNextData(html);
    if (data) {
      const tweets = extractTweets(data);
      if (tweets.length > 0) return tweets.map((t) => normalize(t, username));
      errors.push("timeline-profile had no tweets in __NEXT_DATA__");
    } else {
      errors.push("timeline-profile HTML had no __NEXT_DATA__ block");
    }
  } catch (e) {
    errors.push(`timeline-profile: ${e instanceof Error ? e.message : e}`);
  }

  throw new Error(
    `syndication fetcher failed for @${username}:\n  - ${errors.join("\n  - ")}`,
  );
}
