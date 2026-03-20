"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

interface AnalyticsData {
  overview: {
    total_jobs: number;
    total_serves: number;
    serves_today: number;
    serves_this_week: number;
    active_alerts: number;
  };
  top_jobs: { title: string; company: string; serves: number }[];
  serves_by_day: { date: string; serves: number }[];
  jobs_by_source: { source: string; count: number }[];
  jobs_by_industry: { name: string; count: number }[];
  jobs_by_region: { region: string; count: number }[];
  last_scan: {
    started_at: string;
    completed_at: string | null;
    total_found: number;
    new_jobs: number;
    status: string;
  } | null;
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <p className="text-sm text-text-tertiary">{label}</p>
      <p className="mt-2 text-3xl font-bold text-text-primary">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function BarChart({
  data,
}: {
  data: { date: string; serves: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-tertiary">
        No serve data yet
      </p>
    );
  }
  const max = Math.max(...data.map((d) => d.serves), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 200 }}>
      {data.map((d) => {
        const pct = (d.serves / max) * 100;
        return (
          <div
            key={d.date}
            className="group relative flex-1"
            style={{ height: "100%" }}
          >
            <div
              className="absolute bottom-0 w-full rounded-t bg-accent transition-all group-hover:opacity-80"
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-surface-hover px-2 py-1 text-xs text-text-primary group-hover:block">
              {d.date}: {d.serves}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DataTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-tertiary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-6 py-8 text-center text-text-tertiary"
                >
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 transition-colors hover:bg-surface-hover"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-6 py-3 text-text-secondary">
                      {typeof cell === "number" ? cell.toLocaleString() : cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Nav />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-24">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-text-primary">
            Platform Analytics
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Real-time performance metrics for the job board
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-10">
            {/* Overview cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Active Jobs" value={data.overview.total_jobs} />
              <StatCard
                label="Total Serves"
                value={data.overview.total_serves}
              />
              <StatCard
                label="Serves Today"
                value={data.overview.serves_today}
              />
              <StatCard
                label="Serves This Week"
                value={data.overview.serves_this_week}
              />
              <StatCard
                label="Active Alerts"
                value={data.overview.active_alerts}
              />
            </div>

            {/* Serves chart */}
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="mb-4 text-sm font-semibold text-text-primary">
                Serves per Day (Last 30 Days)
              </h3>
              <BarChart data={data.serves_by_day} />
              {data.serves_by_day.length > 0 && (
                <div className="mt-3 flex justify-between text-xs text-text-tertiary">
                  <span>{data.serves_by_day[0]?.date}</span>
                  <span>
                    {data.serves_by_day[data.serves_by_day.length - 1]?.date}
                  </span>
                </div>
              )}
            </div>

            {/* Top jobs */}
            <DataTable
              title="Top 10 Most-Served Jobs"
              headers={["Title", "Company", "Serves"]}
              rows={data.top_jobs.map((j) => [j.title, j.company, j.serves])}
            />

            {/* Breakdowns grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              <DataTable
                title="Jobs by Source"
                headers={["Source", "Count"]}
                rows={data.jobs_by_source.map((s) => [s.source, s.count])}
              />
              <DataTable
                title="Jobs by Industry"
                headers={["Industry", "Count"]}
                rows={data.jobs_by_industry.map((i) => [i.name, i.count])}
              />
              <DataTable
                title="Jobs by Region"
                headers={["Region", "Count"]}
                rows={data.jobs_by_region.map((r) => [r.region, r.count])}
              />
            </div>

            {/* Last scan info */}
            {data.last_scan && (
              <div className="rounded-xl border border-border bg-surface p-6">
                <h3 className="mb-4 text-sm font-semibold text-text-primary">
                  Last Scan Run
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <p className="text-xs text-text-tertiary">Status</p>
                    <p className="mt-1 text-sm font-medium text-text-primary">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                          data.last_scan.status === "completed"
                            ? "bg-green-500/10 text-green-400"
                            : data.last_scan.status === "running"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {data.last_scan.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">Started</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {new Date(data.last_scan.started_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">Completed</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {data.last_scan.completed_at
                        ? new Date(
                            data.last_scan.completed_at
                          ).toLocaleString()
                        : "In progress"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">Total Found</p>
                    <p className="mt-1 text-sm font-medium text-text-primary">
                      {data.last_scan.total_found.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">New Jobs</p>
                    <p className="mt-1 text-sm font-medium text-text-primary">
                      {data.last_scan.new_jobs.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
