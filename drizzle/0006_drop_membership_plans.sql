ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_plan_id_membership_plans_id_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "subscriptions_plan_id_idx";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "plan_id";--> statement-breakpoint
DROP TABLE "membership_plans";--> statement-breakpoint
