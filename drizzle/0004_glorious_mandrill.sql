ALTER TYPE "public"."entity_type" ADD VALUE 'BRANCH';--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "backup_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "backup_frequency" text DEFAULT 'weekly';