import { NextRequest } from "next/server";
import { z } from "zod";
import { suggestRoles, listTaxonomies } from "@/db/queries";
import { apiSuccess, apiError, apiCorsOptions } from "@/lib/api-helpers";

// ---------------------------------------------------------------------------
// Hardcoded role taxonomy fallback — the KEY differentiator
// Used when DB taxonomies don't cover a query, or to enrich results.
// ---------------------------------------------------------------------------
const ROLE_TAXONOMY: Record<string, string[]> = {
  "creative director": [
    "Creative Director",
    "Head of Creative",
    "Chief Creative Officer",
    "VP Creative",
    "Executive Creative Director",
    "Associate Creative Director",
    "Group Creative Director",
    "Senior Creative Director",
    "Digital Creative Director",
  ],
  "head of brand": [
    "Head of Brand",
    "Brand Director",
    "VP Brand",
    "Director of Brand",
    "Brand Lead",
    "Chief Brand Officer",
    "Senior Brand Manager",
    "Brand Strategy Director",
    "Global Brand Director",
  ],
  "head of social": [
    "Head of Social",
    "Social Media Director",
    "Social Lead",
    "Director of Social Media",
    "VP Social",
    "Social Media Manager",
    "Head of Social Media",
    "Social Strategy Director",
    "Senior Social Media Manager",
  ],
  "head of marketing": [
    "Head of Marketing",
    "Marketing Director",
    "VP Marketing",
    "CMO",
    "Chief Marketing Officer",
    "Director of Marketing",
    "Senior Marketing Director",
    "Growth Marketing Director",
    "Head of Growth",
  ],
  "head of content": [
    "Head of Content",
    "Content Director",
    "VP Content",
    "Director of Content",
    "Content Lead",
    "Chief Content Officer",
    "Editorial Director",
    "Content Strategy Director",
    "Senior Content Manager",
  ],
  "head of product": [
    "Head of Product",
    "VP Product",
    "Chief Product Officer",
    "Director of Product",
    "Product Lead",
    "Senior Product Manager",
    "Group Product Manager",
    "Principal Product Manager",
  ],
  "head of design": [
    "Head of Design",
    "Design Director",
    "VP Design",
    "Chief Design Officer",
    "Director of Design",
    "Design Lead",
    "Senior Design Director",
    "Principal Designer",
  ],
  "head of engineering": [
    "Head of Engineering",
    "VP Engineering",
    "Director of Engineering",
    "Engineering Lead",
    "CTO",
    "Chief Technology Officer",
    "Principal Engineer",
    "Staff Engineer",
    "Engineering Manager",
  ],
  "data scientist": [
    "Data Scientist",
    "Senior Data Scientist",
    "Lead Data Scientist",
    "Principal Data Scientist",
    "Head of Data Science",
    "ML Engineer",
    "Machine Learning Engineer",
    "AI Engineer",
    "Applied Scientist",
  ],
  "product manager": [
    "Product Manager",
    "Senior Product Manager",
    "Lead Product Manager",
    "Principal Product Manager",
    "Group Product Manager",
    "Associate Product Manager",
    "Technical Product Manager",
    "Staff Product Manager",
  ],
  "software engineer": [
    "Software Engineer",
    "Senior Software Engineer",
    "Staff Software Engineer",
    "Principal Software Engineer",
    "Lead Software Engineer",
    "Full Stack Engineer",
    "Backend Engineer",
    "Frontend Engineer",
    "Platform Engineer",
  ],
  "ux designer": [
    "UX Designer",
    "Senior UX Designer",
    "Lead UX Designer",
    "UX/UI Designer",
    "Product Designer",
    "Senior Product Designer",
    "Interaction Designer",
    "UX Researcher",
  ],
  "head of growth": [
    "Head of Growth",
    "VP Growth",
    "Growth Director",
    "Director of Growth",
    "Growth Lead",
    "Growth Marketing Manager",
    "Head of Acquisition",
    "Performance Marketing Director",
  ],
  "head of partnerships": [
    "Head of Partnerships",
    "VP Partnerships",
    "Director of Partnerships",
    "Partnership Lead",
    "Business Development Director",
    "Head of BD",
    "Strategic Partnerships Manager",
    "VP Business Development",
  ],
  "head of communications": [
    "Head of Communications",
    "VP Communications",
    "Director of Communications",
    "Communications Lead",
    "Head of PR",
    "PR Director",
    "Chief Communications Officer",
    "Corporate Communications Director",
  ],
  "head of people": [
    "Head of People",
    "VP People",
    "Chief People Officer",
    "Head of HR",
    "VP Human Resources",
    "Director of People",
    "People Lead",
    "Head of Talent",
    "CHRO",
  ],
  "account director": [
    "Account Director",
    "Senior Account Director",
    "Group Account Director",
    "Client Partner",
    "Client Director",
    "VP Client Services",
    "Head of Client Services",
    "Account Lead",
  ],
  "copywriter": [
    "Copywriter",
    "Senior Copywriter",
    "Lead Copywriter",
    "Creative Copywriter",
    "Copy Chief",
    "Head of Copy",
    "Content Writer",
    "Brand Copywriter",
    "Conceptual Copywriter",
  ],
  "art director": [
    "Art Director",
    "Senior Art Director",
    "Associate Art Director",
    "Group Art Director",
    "Visual Director",
    "Design Director",
    "Creative Art Director",
  ],
  "strategist": [
    "Strategist",
    "Senior Strategist",
    "Lead Strategist",
    "Brand Strategist",
    "Digital Strategist",
    "Content Strategist",
    "Head of Strategy",
    "VP Strategy",
    "Chief Strategy Officer",
    "Planning Director",
  ],
  "community manager": [
    "Community Manager",
    "Senior Community Manager",
    "Head of Community",
    "Community Lead",
    "Community Director",
    "VP Community",
    "Developer Relations",
    "DevRel",
    "Developer Advocate",
  ],
};

// ---------------------------------------------------------------------------
// Query schema
// ---------------------------------------------------------------------------
const querySchema = z.object({
  q: z.string().min(1, "q is required").max(200),
});

// ---------------------------------------------------------------------------
// GET /api/roles?q=creative+director
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const raw: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      raw[key] = value;
    }

    const parsed = querySchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return apiError("Validation error", 400, issues);
    }

    const query = parsed.data.q.toLowerCase().trim();

    // 1. Check hardcoded taxonomy first for instant results
    const hardcodedResults: Array<{
      input: string;
      related_titles: string[];
      source: "taxonomy";
    }> = [];

    for (const [key, titles] of Object.entries(ROLE_TAXONOMY)) {
      // Exact match or partial match
      if (key.includes(query) || query.includes(key)) {
        hardcodedResults.push({
          input: key,
          related_titles: titles,
          source: "taxonomy",
        });
      }
    }

    // 2. Also check DB taxonomies
    const dbMatches = await suggestRoles(parsed.data.q);

    const dbResults = dbMatches.map((m) => ({
      id: m.id,
      slug: m.slug,
      canonical_title: m.canonicalTitle,
      related_titles: (m.relatedTitles ?? []) as string[],
      industry: m.industry
        ? { id: m.industry.id, slug: m.industry.slug, name: m.industry.name }
        : null,
      score: m.score,
      source: "database" as const,
    }));

    // 3. Merge: if DB has results, prefer those enriched with hardcoded data
    // If no DB results, fall back to hardcoded
    const mergedTitles = new Set<string>();
    const finalRelatedTitles: string[] = [];

    // Add from DB matches
    for (const match of dbResults) {
      for (const title of match.related_titles) {
        if (!mergedTitles.has(title.toLowerCase())) {
          mergedTitles.add(title.toLowerCase());
          finalRelatedTitles.push(title);
        }
      }
      if (!mergedTitles.has(match.canonical_title.toLowerCase())) {
        mergedTitles.add(match.canonical_title.toLowerCase());
        finalRelatedTitles.push(match.canonical_title);
      }
    }

    // Add from hardcoded
    for (const hc of hardcodedResults) {
      for (const title of hc.related_titles) {
        if (!mergedTitles.has(title.toLowerCase())) {
          mergedTitles.add(title.toLowerCase());
          finalRelatedTitles.push(title);
        }
      }
    }

    return apiSuccess({
      query: parsed.data.q,
      related_titles: finalRelatedTitles,
      db_matches: dbResults,
      taxonomy_matches: hardcodedResults.length,
    });
  } catch (err) {
    console.error("GET /api/roles error:", err);
    return apiError("Internal server error", 500);
  }
}

export function OPTIONS() {
  return apiCorsOptions();
}
