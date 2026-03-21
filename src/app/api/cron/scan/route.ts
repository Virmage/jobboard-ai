import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { runFullScan } from "@/scanner/index";
import type { CareerProject } from "@/scanner/types";

export const maxDuration = 300; // 5 minutes (Vercel Pro limit)

export async function GET(req: NextRequest) {
  // Verify request is from Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Load career projects from DB (same logic as scan-job worker)
    let careerProjects: CareerProject[] = [];
    try {
      const rows = await db.execute<{
        id: string;
        name: string;
        symbol: string;
        rank: number;
        homepage: string;
        career_url: string | null;
        ats_type: string | null;
        ats_id: string | null;
      }>(
        {
          sql: "SELECT id, name, symbol, rank, homepage, career_url, ats_type, ats_id FROM career_projects WHERE career_url IS NOT NULL",
          params: [],
        } as any,
      );

      if (Array.isArray(rows)) {
        careerProjects = rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          symbol: r.symbol,
          rank: r.rank,
          homepage: r.homepage,
          careerUrl: r.career_url,
          atsType: r.ats_type as CareerProject["atsType"],
          atsId: r.ats_id,
        }));
      }
    } catch (err) {
      console.warn(
        "[cron/scan] Could not load career_projects table:",
        (err as Error).message,
      );
    }

    console.log(
      `[cron/scan] Starting scan with ${careerProjects.length} career projects`,
    );

    const stats = await runFullScan(db, careerProjects);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(
      `[cron/scan] Completed in ${elapsed}s — ${stats.totalFound} total, ${stats.newJobs} new, ${stats.errors.length} errors`,
    );

    return NextResponse.json({
      ok: true,
      durationSeconds: parseFloat(elapsed),
      totalFound: stats.totalFound,
      newJobs: stats.newJobs,
      errorCount: stats.errors.length,
      errors: stats.errors.slice(0, 10), // cap error detail in response
    });
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[cron/scan] Fatal error after ${elapsed}s:`, err);

    return NextResponse.json(
      {
        ok: false,
        error: (err as Error).message,
        durationSeconds: parseFloat(elapsed),
      },
      { status: 500 },
    );
  }
}
