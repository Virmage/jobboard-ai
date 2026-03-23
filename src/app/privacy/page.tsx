import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AgentJobs",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-zinc-300">
      <h1 className="mb-8 text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mb-4 text-sm text-zinc-500">Last updated: March 23, 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">1. What We Collect</h2>
          <p>When you use the AgentJobs API or website, we may collect:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>Email address (when registering for an API key)</li>
            <li>API usage data (request counts, search queries)</li>
            <li>Standard web analytics (page views, referrers)</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">2. How We Use It</h2>
          <p>We use collected data to:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>Provide and improve the AgentJobs service</li>
            <li>Enforce rate limits and prevent abuse</li>
            <li>Send service-related communications</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">3. Data Sharing</h2>
          <p>We do not sell your personal data. We may share anonymized, aggregated usage statistics (e.g., "10,000 searches for engineering jobs this week"). We use Stripe for payment processing — their privacy policy applies to payment data.</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">4. Job Data</h2>
          <p>Job listings displayed through AgentJobs are sourced from publicly available career pages and job boards. We do not store personal information about job applicants. Apply links redirect to the original job posting.</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">5. Cookies</h2>
          <p>We use essential cookies only for site functionality. No third-party tracking cookies are used.</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">6. Data Retention</h2>
          <p>API keys and associated email addresses are retained while your account is active. You can request deletion by contacting us.</p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-white">7. Contact</h2>
          <p>For privacy questions, contact us at <a href="mailto:hello@agentjobs.com" className="text-blue-400 hover:underline">hello@agentjobs.com</a>.</p>
        </div>
      </section>
    </main>
  );
}
