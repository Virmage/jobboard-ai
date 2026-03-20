"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/roles", label: "Roles" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/analytics", label: "Analytics" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text-primary"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
            J
          </span>
          JobBoard AI
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 text-sm text-text-secondary md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-text-primary ${
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-text-primary"
                  : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/docs#authentication"
            className="hidden rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:inline-flex"
          >
            Get API Key
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-[#0a0a0a] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-hover ${
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-text-primary bg-surface"
                    : "text-text-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/docs#authentication"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-lg bg-accent px-3.5 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Get API Key
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
