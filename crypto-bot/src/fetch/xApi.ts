import type { Tweet } from "../types";

const BASE = "https://api.twitter.com/2";

interface XUser {
  id: string;
  username: string;
}

interface XTweet {
  id: string;
  text: string;
  created_at: string;
  in_reply_to_user_id?: string;
  referenced_tweets?: Array<{ type: string; id: string }>;
}

async function xGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`X API ${res.status} on ${path}: ${body}`);
  }
  return (await res.json()) as T;
}

async function resolveUserId(username: string, token: string): Promise<string> {
  const data = await xGet<{ data: XUser }>(
    `/users/by/username/${username}`,
    token,
  );
  return data.data.id;
}

export async function fetchUserTweets(
  username: string,
  opts: { token?: string; max?: number } = {},
): Promise<Tweet[]> {
  const token = opts.token ?? process.env.X_BEARER_TOKEN;
  if (!token) {
    throw new Error(
      "X_BEARER_TOKEN env var required (or pass token explicitly). " +
        "Alternatively, provide a fixture JSON via --input.",
    );
  }
  const max = opts.max ?? 100;
  const userId = await resolveUserId(username, token);

  const collected: Tweet[] = [];
  let paginationToken: string | undefined;

  while (collected.length < max) {
    const remaining = max - collected.length;
    const pageSize = Math.min(100, Math.max(5, remaining));
    const params = new URLSearchParams({
      max_results: String(pageSize),
      "tweet.fields": "created_at,in_reply_to_user_id,referenced_tweets",
      exclude: "retweets",
    });
    if (paginationToken) params.set("pagination_token", paginationToken);

    const page = await xGet<{
      data?: XTweet[];
      meta?: { next_token?: string };
    }>(`/users/${userId}/tweets?${params.toString()}`, token);

    if (!page.data || page.data.length === 0) break;

    for (const t of page.data) {
      collected.push({
        id: t.id,
        author: username,
        created_at: t.created_at,
        text: t.text,
        url: `https://x.com/${username}/status/${t.id}`,
        is_reply: Boolean(t.in_reply_to_user_id),
      });
    }

    paginationToken = page.meta?.next_token;
    if (!paginationToken) break;
  }

  return collected.slice(0, max);
}
