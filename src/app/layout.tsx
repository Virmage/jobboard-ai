import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentJobs — The Job Search Tool for AI Agents",
  description:
    "Search 14,000+ jobs across every industry. Works with Claude, ChatGPT, and any AI assistant via REST API, MCP, or ChatGPT Actions.",
  openGraph: {
    title: "AgentJobs — The Job Search Tool for AI Agents",
    description:
      "Search 14,000+ jobs across every industry. Works with Claude, ChatGPT, and any AI assistant via REST API, MCP, or ChatGPT Actions.",
    type: "website",
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
