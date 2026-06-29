ALTER TABLE "classes" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "trainer_profiles" ADD COLUMN "branch_id" uuid;