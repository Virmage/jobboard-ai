CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"name" text,
	"owner_id" uuid,
	"tier" text DEFAULT 'free' NOT NULL,
	"rate_limit" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_serves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"date" date NOT NULL,
	"serve_count" integer DEFAULT 0 NOT NULL,
	"unique_consumers" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"company_name" text,
	"company_url" text,
	"logo_url" text,
	"stripe_customer_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"amount_paid" integer NOT NULL,
	"stripe_payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"location" text,
	"link" text,
	"source" text,
	"industry_id" uuid,
	"taxonomy_id" uuid,
	"description" text,
	"salary" text,
	"is_remote" boolean DEFAULT false NOT NULL,
	"region" text,
	"posted_at" timestamp with time zone,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_until" timestamp with time zone,
	"employer_id" uuid,
	"dedup_key" text NOT NULL,
	"serve_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_taxonomies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"canonical_title" text NOT NULL,
	"related_titles" jsonb DEFAULT '[]'::jsonb,
	"title_patterns" jsonb DEFAULT '[]'::jsonb,
	"industry_id" uuid
);
--> statement-breakpoint
CREATE TABLE "scan_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"total_found" integer DEFAULT 0 NOT NULL,
	"new_jobs" integer DEFAULT 0 NOT NULL,
	"source_breakdown" jsonb DEFAULT '{}'::jsonb,
	"errors" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'running' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_serves" ADD CONSTRAINT "api_serves_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_listings" ADD CONSTRAINT "featured_listings_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_listings" ADD CONSTRAINT "featured_listings_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_taxonomy_id_role_taxonomies_id_fk" FOREIGN KEY ("taxonomy_id") REFERENCES "public"."role_taxonomies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_taxonomies" ADD CONSTRAINT "role_taxonomies_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_hash_idx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_prefix_idx" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "api_serves_job_idx" ON "api_serves" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "api_serves_date_idx" ON "api_serves" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "api_serves_job_date_idx" ON "api_serves" USING btree ("job_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "employers_email_idx" ON "employers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "featured_listings_employer_idx" ON "featured_listings" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "featured_listings_job_idx" ON "featured_listings" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "industries_slug_idx" ON "industries" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_dedup_key_idx" ON "jobs" USING btree ("dedup_key");--> statement-breakpoint
CREATE INDEX "jobs_industry_idx" ON "jobs" USING btree ("industry_id");--> statement-breakpoint
CREATE INDEX "jobs_taxonomy_idx" ON "jobs" USING btree ("taxonomy_id");--> statement-breakpoint
CREATE INDEX "jobs_employer_idx" ON "jobs" USING btree ("employer_id");--> statement-breakpoint
CREATE INDEX "jobs_is_active_idx" ON "jobs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "jobs_posted_at_idx" ON "jobs" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX "jobs_is_featured_idx" ON "jobs" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "jobs_region_idx" ON "jobs" USING btree ("region");--> statement-breakpoint
CREATE UNIQUE INDEX "role_taxonomies_slug_idx" ON "role_taxonomies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "role_taxonomies_industry_idx" ON "role_taxonomies" USING btree ("industry_id");--> statement-breakpoint
CREATE INDEX "scan_runs_status_idx" ON "scan_runs" USING btree ("status");