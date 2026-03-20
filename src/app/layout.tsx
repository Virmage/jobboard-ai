import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobBoard AI — The Job Board for AI Agents",
  description:
    "Structured, real-time job data for Claude, ChatGPT, and every AI agent. 400+ company career pages scanned every 6 hours.",
  openGraph: {
    title: "JobBoard AI — The Job Board for AI Agents",
    description:
      "Structured, real-time job data for Claude, ChatGPT, and every AI agent. 400+ company career pages scanned every 6 hours.",
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
          title="JobBoard AI — Latest Jobs"
          href="/api/feeds"
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0a] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
