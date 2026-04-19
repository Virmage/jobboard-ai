const GT = "https://api.geckoterminal.com/api/v2";

export interface DexPool {
  address: string;
  network: string;
  baseTokenPrice: number;
  quoteTokenSymbol: string;
  liquidityUsd: number;
  volume24hUsd: number;
}

export interface DexOhlcv {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeUsd: number;
}

async function gtGet<T>(path: string): Promise<T> {
  const res = await fetch(`${GT}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(
      `GeckoTerminal ${res.status} on ${path}: ${await res.text()}`,
    );
  }
  return (await res.json()) as T;
}

export async function findTopPool(
  network: string,
  tokenAddress: string,
): Promise<DexPool | null> {
  try {
    const data = await gtGet<{
      data: Array<{
        attributes: {
          address: string;
          base_token_price_usd: string;
          reserve_in_usd: string;
          volume_usd: { h24: string };
        };
        relationships: {
          quote_token: { data: { id: string } };
        };
      }>;
    }>(`/networks/${network}/tokens/${tokenAddress}/pools?page=1`);

    if (!data.data || data.data.length === 0) return null;
    const top = data.data[0];
    const quoteId = top.relationships.quote_token.data.id;
    return {
      address: top.attributes.address,
      network,
      baseTokenPrice: Number(top.attributes.base_token_price_usd),
      quoteTokenSymbol: quoteId.split("_").slice(-1)[0],
      liquidityUsd: Number(top.attributes.reserve_in_usd),
      volume24hUsd: Number(top.attributes.volume_usd.h24),
    };
  } catch {
    return null;
  }
}

export async function fetchPoolOhlcv(
  network: string,
  poolAddress: string,
  timeframe: "minute" | "hour" | "day",
  aggregate: number,
  beforeTimestamp: number,
  limit = 1000,
): Promise<DexOhlcv[]> {
  const params = new URLSearchParams({
    aggregate: String(aggregate),
    before_timestamp: String(Math.floor(beforeTimestamp / 1000)),
    limit: String(limit),
    currency: "usd",
  });
  const data = await gtGet<{
    data: { attributes: { ohlcv_list: number[][] } };
  }>(
    `/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}?${params.toString()}`,
  );
  const list = data.data?.attributes?.ohlcv_list ?? [];
  return list.map((r) => ({
    timestamp: r[0] * 1000,
    open: r[1],
    high: r[2],
    low: r[3],
    close: r[4],
    volumeUsd: r[5],
  }));
}

export async function priceAtDex(
  network: string,
  poolAddress: string,
  tsMs: number,
): Promise<number | null> {
  const candles = await fetchPoolOhlcv(
    network,
    poolAddress,
    "hour",
    1,
    tsMs + 6 * 3600 * 1000,
    12,
  );
  if (candles.length === 0) return null;
  let best = candles[0];
  let bestDiff = Math.abs(best.timestamp - tsMs);
  for (const c of candles) {
    const diff = Math.abs(c.timestamp - tsMs);
    if (diff < bestDiff) {
      best = c;
      bestDiff = diff;
    }
  }
  return best.close;
}
