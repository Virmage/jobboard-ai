// ---------------------------------------------------------------------------
// RSS 2.0 Feed Generator
// ---------------------------------------------------------------------------

interface RSSJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  link: string | null;
  description: string | null;
  salary: string | null;
  postedAt: Date | null;
  source: string | null;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRFC2822(date: Date): string {
  return date.toUTCString();
}

export function generateRSS(opts: {
  title: string;
  description: string;
  link: string;
  jobs: RSSJob[];
}): string {
  const { title, description, link, jobs } = opts;

  const items = jobs
    .map((job) => {
      const itemTitle = escapeXml(`${job.title} at ${job.company}`);

      const descParts: string[] = [];
      if (job.description) descParts.push(job.description);
      if (job.location) descParts.push(`Location: ${job.location}`);
      if (job.salary) descParts.push(`Salary: ${job.salary}`);
      if (job.source) descParts.push(`Source: ${job.source}`);
      const itemDesc = escapeXml(descParts.join(" | "));

      const itemLink = escapeXml(`${link}/jobs/${job.id}`);
      const pubDate = job.postedAt ? `<pubDate>${toRFC2822(job.postedAt)}</pubDate>` : "";

      return `    <item>
      <title>${itemTitle}</title>
      <description>${itemDesc}</description>
      <link>${itemLink}</link>
      <guid isPermaLink="false">${escapeXml(job.id)}</guid>
      ${pubDate}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <description>${escapeXml(description)}</description>
    <link>${escapeXml(link)}</link>
    <lastBuildDate>${toRFC2822(new Date())}</lastBuildDate>
    <language>en-us</language>
${items}
  </channel>
</rss>`;
}
