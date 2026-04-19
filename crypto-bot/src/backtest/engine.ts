import {
  listPerpSymbols,
  findPerpSymbol,
  priceAt as binancePriceAt,
  type PerpSymbolInfo,
} from "../prices/binance";
import {
  listHyperliquidPerps,
  findHyperliquidSymbol,
  priceAtHl,
} from "../prices/hyperliquid";
import { findTopPool, priceAtDex } from "../prices/geckoterminal";
import {
  HORIZONS_MS,
  type KnownCall,
  type TradeResult,
  type Venue,
} from "./types";

type HLAsset = Awaited<ReturnType<typeof listHyperliquidPerps>>[number];

const DEFAULT_ENTRY_DELAY_MS = 5 * 60 * 1000;

export interface RunOptions {
  entryDelayMs?: number;
  onProgress?: (done: number, total: number, call: KnownCall) => void;
}

export async function runBacktest(
  calls: KnownCall[],
  opts: RunOptions = {},
): Promise<TradeResult[]> {
  const entryDelay = opts.entryDelayMs ?? DEFAULT_ENTRY_DELAY_MS;
  const [perpSymbols, hlSymbols] = await Promise.all([
    listPerpSymbols(),
    safeListHl(),
  ]);
  const results: TradeResult[] = [];
  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    results.push(await backtestOne(call, perpSymbols, hlSymbols, entryDelay));
    opts.onProgress?.(i + 1, calls.length, call);
  }
  return results;
}

async function safeListHl(): Promise<HLAsset[]> {
  try {
    return await listHyperliquidPerps();
  } catch (e) {
    console.warn(
      `Hyperliquid listing unavailable: ${e instanceof Error ? e.message : e}`,
    );
    return [];
  }
}

async function backtestOne(
  call: KnownCall,
  perpSymbols: PerpSymbolInfo[],
  hlSymbols: HLAsset[],
  entryDelayMs: number,
): Promise<TradeResult> {
  const tweetMs = Date.parse(call.tweet_ts);
  const entryMs = tweetMs + entryDelayMs;

  if (Number.isNaN(tweetMs)) {
    return emptyResult(call, entryMs, "unavailable", {
      skipped_reason: "invalid tweet_ts",
    });
  }

  if (call.ticker) {
    const perp = findPerpSymbol(perpSymbols, call.ticker);
    if (perp && perp.onboardDate <= tweetMs) {
      return await backtestBinance(call, perp, tweetMs, entryMs);
    }

    const hl = findHyperliquidSymbol(hlSymbols, call.ticker);
    if (hl) {
      const result = await backtestHl(call, hl.name, entryMs);
      if (result.entry_price != null) return result;
    }
  }

  return await tryDex(call, entryMs, { perps_available_at_tweet: false });
}

async function backtestHl(
  call: KnownCall,
  symbol: string,
  entryMs: number,
): Promise<TradeResult> {
  const entryPrice = await priceAtHl(symbol, entryMs);
  if (entryPrice == null) {
    return emptyResult(call, entryMs, "hyperliquid_perp", {
      symbol_or_pool: symbol,
      perps_available_at_tweet: false,
      skipped_reason: "no Hyperliquid data at entry (not listed yet, or delisted)",
    });
  }
  const exit_prices: Record<string, number | null> = {};
  const returns_short: Record<string, number | null> = {};
  for (const [label, delta] of Object.entries(HORIZONS_MS)) {
    const px = await priceAtHl(symbol, entryMs + delta);
    exit_prices[label] = px;
    returns_short[label] = px == null ? null : (entryPrice - px) / entryPrice;
  }
  return {
    call,
    venue: "hyperliquid_perp",
    symbol_or_pool: symbol,
    entry_ts: entryMs,
    entry_price: entryPrice,
    exit_prices,
    returns_short,
    perps_available_at_tweet: true,
  };
}

async function backtestBinance(
  call: KnownCall,
  perp: PerpSymbolInfo,
  tweetMs: number,
  entryMs: number,
): Promise<TradeResult> {
  const entryPrice = await binancePriceAt(perp.symbol, entryMs);
  if (entryPrice == null) {
    return emptyResult(call, entryMs, "binance_perp", {
      symbol_or_pool: perp.symbol,
      perps_available_at_tweet: perp.onboardDate <= tweetMs,
      skipped_reason: "no entry price on Binance",
    });
  }
  const exit_prices: Record<string, number | null> = {};
  const returns_short: Record<string, number | null> = {};
  for (const [label, delta] of Object.entries(HORIZONS_MS)) {
    const px = await binancePriceAt(perp.symbol, entryMs + delta);
    exit_prices[label] = px;
    returns_short[label] = px == null ? null : (entryPrice - px) / entryPrice;
  }
  return {
    call,
    venue: "binance_perp",
    symbol_or_pool: perp.symbol,
    entry_ts: entryMs,
    entry_price: entryPrice,
    exit_prices,
    returns_short,
    perps_available_at_tweet: perp.onboardDate <= tweetMs,
  };
}

async function tryDex(
  call: KnownCall,
  entryMs: number,
  base: Partial<TradeResult> & { perps_available_at_tweet: boolean },
): Promise<TradeResult> {
  if (!call.chain || !call.contract_address) {
    return emptyResult(call, entryMs, "unavailable", {
      ...base,
      skipped_reason: "no chain+contract to look up DEX pool",
    });
  }
  const network = normalizeChain(call.chain);
  const pool = await findTopPool(network, call.contract_address);
  if (!pool) {
    return emptyResult(call, entryMs, "unavailable", {
      ...base,
      skipped_reason: `no GeckoTerminal pool for ${network}/${call.contract_address}`,
    });
  }
  const entryPrice = await priceAtDex(network, pool.address, entryMs);
  if (entryPrice == null) {
    return emptyResult(call, entryMs, "dex", {
      ...base,
      symbol_or_pool: pool.address,
      skipped_reason: "no DEX price at entry",
    });
  }
  const exit_prices: Record<string, number | null> = {};
  const returns_short: Record<string, number | null> = {};
  for (const [label, delta] of Object.entries(HORIZONS_MS)) {
    const px = await priceAtDex(network, pool.address, entryMs + delta);
    exit_prices[label] = px;
    returns_short[label] = px == null ? null : (entryPrice - px) / entryPrice;
  }
  return {
    call,
    venue: "dex",
    symbol_or_pool: pool.address,
    entry_ts: entryMs,
    entry_price: entryPrice,
    exit_prices,
    returns_short,
    perps_available_at_tweet: base.perps_available_at_tweet,
  };
}

function normalizeChain(chain: string): string {
  const c = chain.toLowerCase();
  const map: Record<string, string> = {
    eth: "eth",
    ethereum: "eth",
    sol: "solana",
    solana: "solana",
    base: "base",
    arb: "arbitrum",
    arbitrum: "arbitrum",
    bsc: "bsc",
    bnb: "bsc",
    polygon: "polygon_pos",
    matic: "polygon_pos",
    avax: "avax",
    avalanche: "avax",
  };
  return map[c] ?? c;
}

function emptyResult(
  call: KnownCall,
  entry_ts: number,
  venue: Venue,
  extras: Partial<TradeResult>,
): TradeResult {
  return {
    call,
    venue,
    symbol_or_pool: null,
    entry_ts,
    entry_price: null,
    exit_prices: {},
    returns_short: {},
    perps_available_at_tweet: false,
    ...extras,
  };
}
