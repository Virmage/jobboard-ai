"use client";

import { useState } from "react";

export function AlertsButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    // Convert comma-separated keywords → pipe-separated (backend splits on |)
    const keywordTerms = keywords.split(",").map((k) => k.trim()).filter(Boolean).join("|");
    // Convert comma-separated locations → location: prefix format
    const locationTerms = location.split(",").map((l) => l.trim()).filter(Boolean).join(",");
    const query = locationTerms
      ? `location:${locationTerms}${keywordTerms ? `|${keywordTerms}` : ""}`
      : keywordTerms || undefined;

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          query,
          frequency,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-white/10 px-6 py-4 text-base font-medium text-white/55 transition-all hover:border-white/20 hover:text-white/80"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Get job alerts
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-white/30 hover:text-white/70 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {status === "success" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10a37f]/15 text-xl text-[#10a37f]">✓</div>
                <p className="text-base font-semibold text-white">You&apos;re on the list</p>
                <p className="text-sm text-white/50">
                  We&apos;ll email you {frequency === "daily" ? "daily" : "weekly"} with new matching roles.
                </p>
                <button onClick={() => setOpen(false)} className="mt-2 text-sm text-white/40 hover:text-white/70">
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="mb-1 text-lg font-bold text-white">Get job alerts</h3>
                <p className="mb-5 text-sm text-white/45">New roles from 43,000+ jobs delivered to your inbox.</p>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#10a37f]/50 focus:outline-none focus:ring-1 focus:ring-[#10a37f]/50"
                  />
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Role / keywords (e.g. engineer, designer)"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#10a37f]/50 focus:outline-none focus:ring-1 focus:ring-[#10a37f]/50"
                  />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (e.g. London, Sydney, Remote)"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#10a37f]/50 focus:outline-none focus:ring-1 focus:ring-[#10a37f]/50"
                  />

                  <div className="flex items-center gap-3">
                    <div className="flex rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                      {(["daily", "weekly"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFrequency(f)}
                          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                            frequency === f ? "bg-[#10a37f]/20 text-[#10a37f]" : "text-white/40 hover:text-white/70"
                          }`}
                        >
                          {f === "daily" ? "Daily" : "Weekly"}
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={status === "loading" || !email}
                      className="flex-1 rounded-xl bg-[#10a37f] py-2.5 px-4 text-sm font-semibold text-white transition-all hover:bg-[#0d9270] disabled:opacity-50"
                    >
                      {status === "loading" ? "Subscribing…" : "Subscribe"}
                    </button>
                  </div>

                  {status === "error" && (
                    <p className="text-center text-xs text-red-400">Something went wrong — try again.</p>
                  )}
                  <p className="text-center text-xs text-white/25">Free · Unsubscribe any time</p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
