"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  plan: "pro" | "enterprise";
  highlight: boolean;
  label: string;
}

export function CheckoutButton({ plan, highlight, label }: CheckoutButtonProps) {
  const [email, setEmail] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!showInput) {
      setShowInput(true);
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-2">
      {showInput && (
        <input
          type="email"
          placeholder="Email linked to your API key"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />
      )}

      {error && <p className="text-xs text-red">{error}</p>}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full rounded-lg py-2.5 text-center text-sm font-medium transition-colors disabled:opacity-50 ${
          highlight
            ? "bg-accent text-white hover:bg-accent-hover"
            : "border border-border bg-surface-hover text-text-primary hover:border-border-hover"
        }`}
      >
        {loading ? "Redirecting..." : label}
      </button>
    </div>
  );
}
