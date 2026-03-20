CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"query" text,
	"industry_slug" text,
	"taxonomy_slug" text,
	"region" text,
	"is_remote" boolean,
	"salary_min" integer,
	"frequency" text DEFAULT 'daily' NOT NULL,
	"last_notified_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_min" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_max" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_currency" text;--> statement-breakpoint
CREATE INDEX "saved_searches_email_idx" ON "saved_searches" USING btree ("email");--> statement-breakpoint
CREATE INDEX "saved_searches_active_idx" ON "saved_searches" USING btree ("is_active");