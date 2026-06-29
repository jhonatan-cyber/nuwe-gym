CREATE TYPE "public"."renewal_type" AS ENUM('MANUAL', 'AUTO');--> statement-breakpoint
CREATE TABLE "package_allowed_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text,
	"end_time" text
);
--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "renewal_type" "renewal_type" DEFAULT 'MANUAL';--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "grace_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "max_freezes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "max_freeze_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "allowed_start_time" text;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "allowed_end_time" text;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "daily_access_limit" integer;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "package_allowed_days" ADD CONSTRAINT "package_allowed_days_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;