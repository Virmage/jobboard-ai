import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
                J
              </span>
              JobBoard AI
            </div>
            <p className="mt-3 text-sm text-text-tertiary leading-relaxed">
              The job board built for AI agents. Structured data, real-time
              scanning, universal access.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary">Product</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/jobs"
                  className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  Search Jobs
                </Link>
              </li>
              <li>
                <Link
                  href="/roles"
                  className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  Role Explorer
                </Link>
              </li>
              <li>
                <Link
                  href="/widget"
                  className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  Embeddable Widget
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              Developers
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/docs"
                  className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  API Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/docs#mcp"
                  className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  MCP Server
                </Link>
              </li>
              <li>
                <Link
                  href="/docs#chatgpt"
                  className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  ChatGPT Plugin
                </Link>
              </li>
              <li>
                <Link
                  href="/docs#authentication"
                  className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  API Keys
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              Employers
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  Employer Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing#employers"
                  className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  Featured Listings
                </Link>
              </li>
              <li>
                <Link
                  href="/docs#analytics"
                  className="text-sm text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  Analytics
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} JobBoard AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-xs text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-xs text-text-tertiary transition-colors hover:text-text-secondary"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
