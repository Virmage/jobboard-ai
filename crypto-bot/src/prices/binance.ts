export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface PerpSymbolInfo {
  symbol: string;
  onboardDate: number;
  status: string;
}

const FAPI = "https://fapi.binance.com";

async function fapiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${FAPI}${path}`);
  if (!res.ok) {
    throw new Error(`Binance ${res.status} on ${path}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export async function listPerpSymbols(): Promise<PerpSymbolInfo[]> {
  const data = await fapiGet<{
    symbols: Array<{
      symbol: string;
      contractType: string;
      status: string;
      onboardDate: number;
    }>;
  }>("/fapi/v1/exchangeInfo");
  return data.symbols
    .filter((s) => s.contractType === "PERPETUAL")
    .map((s) => ({
      symbol: s.symbol,
      onboardDate: s.onboardDate,
      status: s.status,
    }));
}

export function findPerpSymbol(
  symbols: PerpSymbolInfo[],
  ticker: string,
): PerpSymbolInfo | undefined {
  const upper = ticker.toUpperCase();
  const candidates = [
    `${upper}USDT`,
    `${upper}USDC`,
    `${upper}BUSD`,
    `1000${upper}USDT`,
    `${upper}USD_PERP`,
  ];
  for (const c of candidates) {
    const found = symbols.find((s) => s.symbol === c);
    if (found) return found;
  }
  return undefined;
}

export async function fetchKlines(
  symbol: string,
  interval: string,
  startMs: number,
  endMs: number,
  limit = 1500,
): Promise<Kline[]> {
  const params = new URLSearchParams({
    symbol,
    interval,
    startTime: String(startMs),
    endTime: String(endMs),
    limit: String(limit),
  });
  const raw = await fapiGet<unknown[][]>(`/fapi/v1/klines?${params.toString()}`);
  return raw.map((k) => ({
    openTime: Number(k[0]),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
    closeTime: Number(k[6]),
  }));
}

export async function priceAt(
  symbol: string,
  tsMs: number,
): Promise<number | null> {
  const windowMs = 5 * 60 * 1000;
  const klines = await fetchKlines(
    symbol,
    "1m",
    tsMs - windowMs,
    tsMs + windowMs,
    20,
  );
  if (klines.length === 0) return null;
  let best = klines[0];
  let bestDiff = Math.abs(best.openTime - tsMs);
  for (const k of klines) {
    const diff = Math.abs(k.openTime - tsMs);
    if (diff < bestDiff) {
      best = k;
      bestDiff = diff;
    }
  }
  return best.close;
}
