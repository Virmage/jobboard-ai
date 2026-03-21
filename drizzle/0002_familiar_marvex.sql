ALTER TABLE "api_keys" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "request_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "monthly_limit" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_idx" ON "api_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX "api_keys_email_idx" ON "api_keys" USING btree ("email");