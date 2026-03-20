// ---------------------------------------------------------------------------
// Salary parser — normalizes raw salary strings into structured data
// ---------------------------------------------------------------------------

export interface ParsedSalary {
  min: number | null;
  max: number | null;
  currency: string;
}

const HOURLY_MULTIPLIER = 2080; // 40 hrs/week × 52 weeks

/**
 * Detect currency from a raw salary string.
 * Returns the ISO currency code and the string with the currency symbol stripped.
 */
function detectCurrency(raw: string): { currency: string; cleaned: string } {
  // Order matters — check multi-char prefixes before single-char "$"
  if (/AU\$/i.test(raw) || /A\$/i.test(raw)) {
    return {
      currency: "AUD",
      cleaned: raw.replace(/AU?\$/gi, ""),
    };
  }
  if (/S\$/i.test(raw) || /SGD/i.test(raw)) {
    return {
      currency: "SGD",
      cleaned: raw.replace(/S\$|SGD/gi, ""),
    };
  }
  if (/C\$/i.test(raw) || /CAD/i.test(raw)) {
    return {
      currency: "CAD",
      cleaned: raw.replace(/C\$|CAD/gi, ""),
    };
  }
  if (raw.includes("£")) {
    return { currency: "GBP", cleaned: raw.replace(/£/g, "") };
  }
  if (raw.includes("€")) {
    return { currency: "EUR", cleaned: raw.replace(/€/g, "") };
  }
  if (raw.includes("¥")) {
    return { currency: "JPY", cleaned: raw.replace(/¥/g, "") };
  }
  if (raw.includes("$")) {
    return { currency: "USD", cleaned: raw.replace(/\$/g, "") };
  }

  // Trailing currency code: "120000 USD"
  const trailingMatch = raw.match(/\b(USD|GBP|EUR|AUD|SGD|CAD|JPY)\b/i);
  if (trailingMatch) {
    return {
      currency: trailingMatch[1].toUpperCase(),
      cleaned: raw.replace(/\b(USD|GBP|EUR|AUD|SGD|CAD|JPY)\b/gi, ""),
    };
  }

  return { currency: "USD", cleaned: raw };
}

/**
 * Parse a single numeric token like "120,000" or "120k" into an integer.
 */
function parseNumber(token: string): number | null {
  let s = token.trim().replace(/,/g, "");
  if (!s) return null;

  const kMatch = s.match(/^([\d.]+)\s*[kK]$/);
  if (kMatch) {
    const val = parseFloat(kMatch[1]);
    return isNaN(val) ? null : Math.round(val * 1000);
  }

  const val = parseFloat(s);
  return isNaN(val) ? null : Math.round(val);
}

/**
 * Parse a raw salary string into structured min/max/currency.
 *
 * Handles formats like:
 *   "$120,000", "$120k", "$120k - $150k", "£90,000",
 *   "$50/hr" (×2080), "120000 - 150000 USD", etc.
 */
export function parseSalary(raw: string | null | undefined): ParsedSalary {
  if (!raw || !raw.trim()) {
    return { min: null, max: null, currency: "USD" };
  }

  const { currency, cleaned } = detectCurrency(raw);

  // Strip rate suffixes — detect hourly first
  const isHourly = /\/(hr|hour)\b|per\s*hour/i.test(cleaned);
  const stripped = cleaned
    .replace(/\/(yr|year|hr|hour|mo|month|week|annum)\b/gi, "")
    .replace(/\b(per\s*(year|annum|hour|month|week))\b/gi, "")
    .replace(/\bpa\b/gi, "")
    .replace(/\bp\.a\.\b/gi, "")
    .trim();

  // Try to find a range: two numbers separated by a dash or "to"
  const rangeMatch = stripped.match(
    /([\d,]+(?:\.\d+)?\s*[kK]?)\s*[-–—to]+\s*([\d,]+(?:\.\d+)?\s*[kK]?)/
  );

  let min: number | null = null;
  let max: number | null = null;

  if (rangeMatch) {
    min = parseNumber(rangeMatch[1]);
    max = parseNumber(rangeMatch[2]);
  } else {
    // Single number
    const singleMatch = stripped.match(/([\d,]+(?:\.\d+)?\s*[kK]?)/);
    if (singleMatch) {
      min = parseNumber(singleMatch[1]);
    }
  }

  // Apply hourly multiplier
  if (isHourly) {
    if (min !== null) min = Math.round(min * HOURLY_MULTIPLIER);
    if (max !== null) max = Math.round(max * HOURLY_MULTIPLIER);
  }

  return { min, max, currency };
}
