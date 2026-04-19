const HL = "https://api.hyperliquid.xyz/info";

interface HLMetaAsset {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
}

interface HLCandle {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
}

async function hlPost<T>(body: unknown): Promise<T> {
  const res = await fetch(HL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Hyperliquid ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export async function listHyperliquidPerps(): Promise<HLMetaAsset[]> {
  const data = await hlPost<{ universe: HLMetaAsset[] }>({ type: "meta" });
  return data.universe.filter((a) => !a.isDelisted);
}

export function findHyperliquidSymbol(
  assets: HLMetaAsset[],
  ticker: string,
): HLMetaAsset | undefined {
  const upper = ticker.toUpperCase();
  return (
    assets.find((a) => a.name.toUpperCase() === upper) ??
    assets.find((a) => a.name.toUpperCase() === `k${upper}`) ??
    assets.find((a) => a.name.toUpperCase() === `1000${upper}`)
  );
}

export async function fetchHlCandles(
  symbol: string,
  interval: string,
  startMs: number,
  endMs: number,
): Promise<HLCandle[]> {
  const data = await hlPost<HLCandle[]>({
    type: "candleSnapshot",
    req: {
      coin: symbol,
      interval,
      startTime: startMs,
      endTime: endMs,
    },
  });
  return Array.isArray(data) ? data : [];
}

export async function priceAtHl(
  symbol: string,
  tsMs: number,
): Promise<number | null> {
  const windowMs = 15 * 60 * 1000;
  const candles = await fetchHlCandles(
    symbol,
    "1m",
    tsMs - windowMs,
    tsMs + windowMs,
  );
  if (candles.length === 0) return null;
  let best = candles[0];
  let bestDiff = Math.abs(best.t - tsMs);
  for (const c of candles) {
    const diff = Math.abs(c.t - tsMs);
    if (diff < bestDiff) {
      best = c;
      bestDiff = diff;
    }
  }
  return Number(best.c);
}

export async function hasHlDataAt(
  symbol: string,
  tsMs: number,
): Promise<boolean> {
  const price = await priceAtHl(symbol, tsMs);
  return price != null;
}
