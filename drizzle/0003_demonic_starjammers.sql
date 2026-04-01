CREATE TABLE "career_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"rank" integer NOT NULL,
	"homepage" text NOT NULL,
	"career_url" text,
	"ats_type" text,
	"ats_id" text,
	"job_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "career_projects_rank_idx" ON "career_projects" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "career_projects_ats_type_idx" ON "career_projects" USING btree ("ats_type");