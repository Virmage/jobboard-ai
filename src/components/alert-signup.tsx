"use client";

import { useState } from "react";

export function AlertSignup() {
  const [email, setEmail] = useState("");
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          query: keywords || undefined,
          region: location || undefined,
          frequency,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10a37f]/15 text-2xl">
          ✓
        </div>
        <p className="text-base font-semibold text-white">You&apos;re on the list</p>
        <p className="text-sm text-white/50">
          We&apos;ll email you {frequency === "daily" ? "every day" : "every week"} with new matching roles.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-3">
      {/* Email */}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#10a37f]/50 focus:outline-none focus:ring-1 focus:ring-[#10a37f]/50 transition-colors"
      />

      {/* Keywords + Location row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Role / keywords (e.g. product manager)"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#10a37f]/50 focus:outline-none focus:ring-1 focus:ring-[#10a37f]/50 transition-colors"
        />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (e.g. London, Remote)"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#10a37f]/50 focus:outline-none focus:ring-1 focus:ring-[#10a37f]/50 transition-colors"
        />
      </div>

      {/* Frequency + Submit row */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-xl border border-white/10 bg-white/5 overflow-hidden flex-shrink-0">
          {(["daily", "weekly"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                frequency === f
                  ? "bg-[#10a37f]/20 text-[#10a37f]"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {f === "daily" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !email}
          className="flex-1 rounded-xl bg-[#10a37f] py-3 px-6 text-sm font-semibold text-white shadow-lg shadow-[#10a37f]/20 transition-all hover:bg-[#0d9270] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Subscribing…" : "Get job alerts"}
        </button>
      </div>

      {status === "error" && (
        <p className="text-center text-xs text-red-400">{errorMsg}</p>
      )}

      <p className="text-center text-xs text-white/25">
        Free · Unsubscribe any time · No spam
      </p>
    </form>
  );
}
