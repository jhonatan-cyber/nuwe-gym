CREATE TABLE "trainer_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_stock" ADD COLUMN "expiry_date" timestamp;--> statement-breakpoint
ALTER TABLE "trainer_observations" ADD CONSTRAINT "trainer_observations_trainer_id_trainer_profiles_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_observations" ADD CONSTRAINT "trainer_observations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trainer_observations_trainer_id_idx" ON "trainer_observations" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "trainer_observations_member_id_idx" ON "trainer_observations" USING btree ("member_id");