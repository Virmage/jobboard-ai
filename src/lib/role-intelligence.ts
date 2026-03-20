import {
  APAC_KEYWORDS,
  US_KEYWORDS,
  EU_KEYWORDS,
  LATAM_KEYWORDS,
} from "./constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TaxonomyRecord {
  id: string;
  slug: string;
  canonicalTitle: string;
  relatedTitles: string[] | null;
  titlePatterns: string[] | null;
}

export interface CompiledTaxonomy {
  id: string;
  slug: string;
  canonicalTitle: string;
  relatedTitles: string[];
  patterns: RegExp[];
}

export interface TaxonomyMatch {
  taxonomy: CompiledTaxonomy;
  score: number;
  matchedBy: "pattern" | "related" | "canonical";
}

export type Region = "APAC" | "US" | "EU" | "LATAM" | "Global";

// ---------------------------------------------------------------------------
// compileTaxonomyPatterns — convert string patterns from DB to RegExp[]
// ---------------------------------------------------------------------------
export function compileTaxonomyPatterns(
  taxonomies: TaxonomyRecord[]
): CompiledTaxonomy[] {
  return taxonomies.map((tax) => {
    const patterns: RegExp[] = [];
    for (const p of tax.titlePatterns ?? []) {
      try {
        patterns.push(new RegExp(p, "i"));
      } catch {
        // Skip invalid regex patterns silently
      }
    }

    return {
      id: tax.id,
      slug: tax.slug,
      canonicalTitle: tax.canonicalTitle,
      relatedTitles: (tax.relatedTitles ?? []) as string[],
      patterns,
    };
  });
}

// ---------------------------------------------------------------------------
// matchTitle — find the best matching taxonomy for a job title
// ---------------------------------------------------------------------------
export function matchTitle(
  title: string,
  compiledTaxonomies: CompiledTaxonomy[]
): TaxonomyMatch | null {
  const normalizedTitle = title.trim();
  let bestMatch: TaxonomyMatch | null = null;

  for (const tax of compiledTaxonomies) {
    let score = 0;
    let matchedBy: TaxonomyMatch["matchedBy"] = "pattern";

    // 1. Exact canonical match (highest priority)
    if (normalizedTitle.toLowerCase() === tax.canonicalTitle.toLowerCase()) {
      score = 100;
      matchedBy = "canonical";
    }

    // 2. Canonical contains
    if (
      score < 100 &&
      normalizedTitle.toLowerCase().includes(tax.canonicalTitle.toLowerCase())
    ) {
      score = Math.max(score, 50);
      matchedBy = "canonical";
    }

    // 3. Exact related title match
    for (const related of tax.relatedTitles) {
      if (normalizedTitle.toLowerCase() === related.toLowerCase()) {
        score = Math.max(score, 90);
        matchedBy = "related";
        break;
      }
    }

    // 4. Related title contains
    if (score < 90) {
      for (const related of tax.relatedTitles) {
        if (normalizedTitle.toLowerCase().includes(related.toLowerCase())) {
          score = Math.max(score, 40);
          matchedBy = "related";
          break;
        }
      }
    }

    // 5. Regex pattern match
    for (const pattern of tax.patterns) {
      if (pattern.test(normalizedTitle)) {
        score = Math.max(score, 70);
        matchedBy = "pattern";
        break;
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { taxonomy: tax, score, matchedBy };
    }
  }

  return bestMatch;
}

// ---------------------------------------------------------------------------
// suggestRolesFromText — score all taxonomies against free-text input
// ---------------------------------------------------------------------------
export function suggestRolesFromText(
  text: string,
  compiledTaxonomies: CompiledTaxonomy[]
): TaxonomyMatch[] {
  const lowerText = text.toLowerCase().trim();
  const matches: TaxonomyMatch[] = [];

  for (const tax of compiledTaxonomies) {
    let score = 0;
    let matchedBy: TaxonomyMatch["matchedBy"] = "pattern";

    // Check canonical title
    if (lowerText.includes(tax.canonicalTitle.toLowerCase())) {
      score += 15;
      matchedBy = "canonical";
    }

    // Check each word in text against canonical title
    const words = lowerText.split(/\s+/);
    const canonicalWords = tax.canonicalTitle.toLowerCase().split(/\s+/);
    let wordOverlap = 0;
    for (const word of words) {
      if (word.length < 3) continue;
      if (canonicalWords.includes(word)) {
        wordOverlap++;
      }
    }
    if (wordOverlap > 0) {
      score += wordOverlap * 3;
    }

    // Check related titles
    for (const related of tax.relatedTitles) {
      if (lowerText.includes(related.toLowerCase())) {
        score += 10;
        matchedBy = "related";
        break;
      }
    }

    // Check regex patterns
    for (const pattern of tax.patterns) {
      if (pattern.test(text)) {
        score += 12;
        matchedBy = "pattern";
        break;
      }
    }

    // Partial keyword matching — check if key terms appear
    const slugTerms = tax.slug.split("-");
    for (const term of slugTerms) {
      if (term.length >= 3 && lowerText.includes(term)) {
        score += 2;
      }
    }

    if (score > 0) {
      matches.push({ taxonomy: tax, score, matchedBy });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// detectRegion — determine region from location string
// ---------------------------------------------------------------------------
export function detectRegion(location: string | null | undefined): Region {
  if (!location) return "Global";

  const lower = location.toLowerCase().trim();

  // Check for explicit "remote" with no region
  if (lower === "remote" || lower === "remote - global") {
    return "Global";
  }

  // Check each region's keywords
  for (const kw of APAC_KEYWORDS) {
    if (lower.includes(kw)) return "APAC";
  }

  for (const kw of US_KEYWORDS) {
    // For short state abbreviations, require word boundaries
    if (kw.length <= 2) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(location)) return "US";
    } else if (lower.includes(kw)) {
      return "US";
    }
  }

  for (const kw of EU_KEYWORDS) {
    if (kw.length <= 2) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(location)) return "EU";
    } else if (lower.includes(kw)) {
      return "EU";
    }
  }

  for (const kw of LATAM_KEYWORDS) {
    if (lower.includes(kw)) return "LATAM";
  }

  return "Global";
}
