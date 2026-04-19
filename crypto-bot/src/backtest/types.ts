export interface KnownCall {
  id: string;
  tweet_ts: string;
  tweet_url?: string;
  project_name: string;
  ticker?: string;
  chain?: string;
  contract_address?: string;
  severity?: number;
  notes?: string;
}

export type Venue =
  | "binance_perp"
  | "hyperliquid_perp"
  | "dex"
  | "unavailable";

export interface TradeResult {
  call: KnownCall;
  venue: Venue;
  symbol_or_pool: string | null;
  entry_ts: number;
  entry_price: number | null;
  exit_prices: Record<string, number | null>;
  returns_short: Record<string, number | null>;
  perps_available_at_tweet: boolean;
  skipped_reason?: string;
}

export const HORIZONS_MS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "5d": 5 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};
