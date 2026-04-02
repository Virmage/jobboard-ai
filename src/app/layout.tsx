import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AgentJobs — Your AI Recruiter for Jobs at OpenAI, Anthropic, Stripe & More",
    template: "%s | AgentJobs",
  },
  description:
    "AgentJobs is your AI recruiter. Searches 43,000+ jobs at OpenAI, Anthropic, Stripe, Coinbase and 100+ top companies — just tell ChatGPT what you want.",
  keywords: [
    "AI recruiter", "job search", "AI jobs", "tech jobs", "crypto jobs",
    "ChatGPT job search", "OpenAI jobs", "Anthropic jobs", "remote jobs", "startup jobs",
  ],
  authors: [{ name: "AgentJobs" }],
  openGraph: {
    title: "AgentJobs — Find Jobs at OpenAI, Anthropic, Stripe & 100+ Top Companies",
    description:
      "Search 14,000+ jobs at the world's best companies. Ask ChatGPT to find your next job.",
    type: "website",
    siteName: "AgentJobs",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentJobs — Find Jobs at OpenAI, Anthropic, Stripe & 100+ Top Companies",
    description: "Search 14,000+ jobs at top companies. Ask ChatGPT to find your next job.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="AgentJobs — Latest Jobs"
          href="/api/feeds"
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0a] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
