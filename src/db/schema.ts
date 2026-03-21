import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Industries
// ---------------------------------------------------------------------------
export const industries = pgTable(
  "industries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [uniqueIndex("industries_slug_idx").on(t.slug)]
);

export const industriesRelations = relations(industries, ({ many }) => ({
  jobs: many(jobs),
  roleTaxonomies: many(roleTaxonomies),
}));

// ---------------------------------------------------------------------------
// Role Taxonomies
// ---------------------------------------------------------------------------
export const roleTaxonomies = pgTable(
  "role_taxonomies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    canonicalTitle: text("canonical_title").notNull(),
    relatedTitles: jsonb("related_titles").$type<string[]>().default([]),
    titlePatterns: jsonb("title_patterns").$type<string[]>().default([]),
    industryId: uuid("industry_id").references(() => industries.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    uniqueIndex("role_taxonomies_slug_idx").on(t.slug),
    index("role_taxonomies_industry_idx").on(t.industryId),
  ]
);

export const roleTaxonomiesRelations = relations(
  roleTaxonomies,
  ({ one, many }) => ({
    industry: one(industries, {
      fields: [roleTaxonomies.industryId],
      references: [industries.id],
    }),
    jobs: many(jobs),
  })
);

// ---------------------------------------------------------------------------
// Employers
// ---------------------------------------------------------------------------
export const employers = pgTable(
  "employers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    companyName: text("company_name"),
    companyUrl: text("company_url"),
    logoUrl: text("logo_url"),
    stripeCustomerId: text("stripe_customer_id"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("employers_email_idx").on(t.email)]
);

export const employersRelations = relations(employers, ({ many }) => ({
  jobs: many(jobs),
  featuredListings: many(featuredListings),
}));

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    location: text("location"),
    link: text("link"),
    source: text("source"),
    industryId: uuid("industry_id").references(() => industries.id, {
      onDelete: "set null",
    }),
    taxonomyId: uuid("taxonomy_id").references(() => roleTaxonomies.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    salary: text("salary"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: text("salary_currency"),
    isRemote: boolean("is_remote").notNull().default(false),
    region: text("region"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    scannedAt: timestamp("scanned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    featuredUntil: timestamp("featured_until", { withTimezone: true }),
    employerId: uuid("employer_id").references(() => employers.id, {
      onDelete: "set null",
    }),
    dedupKey: text("dedup_key").notNull(),
    serveCount: integer("serve_count").notNull().default(0),
  },
  (t) => [
    uniqueIndex("jobs_dedup_key_idx").on(t.dedupKey),
    index("jobs_industry_idx").on(t.industryId),
    index("jobs_taxonomy_idx").on(t.taxonomyId),
    index("jobs_employer_idx").on(t.employerId),
    index("jobs_is_active_idx").on(t.isActive),
    index("jobs_posted_at_idx").on(t.postedAt),
    index("jobs_is_featured_idx").on(t.isFeatured),
    index("jobs_region_idx").on(t.region),
  ]
);

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  industry: one(industries, {
    fields: [jobs.industryId],
    references: [industries.id],
  }),
  taxonomy: one(roleTaxonomies, {
    fields: [jobs.taxonomyId],
    references: [roleTaxonomies.id],
  }),
  employer: one(employers, {
    fields: [jobs.employerId],
    references: [employers.id],
  }),
  apiServes: many(apiServes),
  featuredListings: many(featuredListings),
}));

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    key: text("key").notNull(),
    keyHash: text("key_hash").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    name: text("name"),
    ownerId: uuid("owner_id"),
    tier: text("tier").notNull().default("free"),
    rateLimit: integer("rate_limit").notNull().default(100),
    requestCount: integer("request_count").notNull().default(0),
    monthlyLimit: integer("monthly_limit").notNull().default(100),
    isActive: boolean("is_active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("api_keys_hash_idx").on(t.keyHash),
    uniqueIndex("api_keys_key_idx").on(t.key),
    index("api_keys_prefix_idx").on(t.keyPrefix),
    index("api_keys_email_idx").on(t.email),
  ]
);

// ---------------------------------------------------------------------------
// Featured Listings
// ---------------------------------------------------------------------------
export const featuredListings = pgTable(
  "featured_listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => employers.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    amountPaid: integer("amount_paid").notNull(),
    stripePaymentId: text("stripe_payment_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("featured_listings_employer_idx").on(t.employerId),
    index("featured_listings_job_idx").on(t.jobId),
  ]
);

export const featuredListingsRelations = relations(
  featuredListings,
  ({ one }) => ({
    employer: one(employers, {
      fields: [featuredListings.employerId],
      references: [employers.id],
    }),
    job: one(jobs, {
      fields: [featuredListings.jobId],
      references: [jobs.id],
    }),
  })
);

// ---------------------------------------------------------------------------
// API Serves (analytics)
// ---------------------------------------------------------------------------
export const apiServes = pgTable(
  "api_serves",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    serveCount: integer("serve_count").notNull().default(0),
    uniqueConsumers: integer("unique_consumers").notNull().default(0),
  },
  (t) => [
    index("api_serves_job_idx").on(t.jobId),
    index("api_serves_date_idx").on(t.date),
    uniqueIndex("api_serves_job_date_idx").on(t.jobId, t.date),
  ]
);

export const apiServesRelations = relations(apiServes, ({ one }) => ({
  job: one(jobs, {
    fields: [apiServes.jobId],
    references: [jobs.id],
  }),
}));

// ---------------------------------------------------------------------------
// Scan Runs (scanner tracking)
// ---------------------------------------------------------------------------
export const scanRuns = pgTable(
  "scan_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    totalFound: integer("total_found").notNull().default(0),
    newJobs: integer("new_jobs").notNull().default(0),
    sourceBreakdown: jsonb("source_breakdown")
      .$type<Record<string, number>>()
      .default({}),
    errors: jsonb("errors").$type<Array<{ source: string; message: string }>>().default([]),
    status: text("status").notNull().default("running"),
  },
  (t) => [index("scan_runs_status_idx").on(t.status)]
);

// ---------------------------------------------------------------------------
// Saved Searches (email alerts)
// ---------------------------------------------------------------------------
export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name"), // optional label like "My Crypto CD Search"
    query: text("query"), // search term
    industrySlug: text("industry_slug"),
    taxonomySlug: text("taxonomy_slug"),
    region: text("region"),
    isRemote: boolean("is_remote"),
    salaryMin: integer("salary_min"),
    frequency: text("frequency").notNull().default("daily"), // "daily" | "weekly" | "instant"
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("saved_searches_email_idx").on(t.email),
    index("saved_searches_active_idx").on(t.isActive),
  ]
);
