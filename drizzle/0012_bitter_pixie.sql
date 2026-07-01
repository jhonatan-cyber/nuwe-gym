CREATE TABLE "member_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"evaluated_by_id" text NOT NULL,
	"evaluation_date" timestamp DEFAULT now() NOT NULL,
	"weight_kg" numeric(5, 2),
	"chest_cm" numeric(5, 1),
	"waist_cm" numeric(5, 1),
	"hips_cm" numeric(5, 1),
	"left_arm_cm" numeric(5, 1),
	"right_arm_cm" numeric(5, 1),
	"left_thigh_cm" numeric(5, 1),
	"right_thigh_cm" numeric(5, 1),
	"push_ups" numeric(5, 0),
	"sit_ups" numeric(5, 0),
	"pull_ups" numeric(5, 0),
	"run_minutes" numeric(5, 2),
	"flexibility_cm" numeric(5, 1),
	"plank_seconds" numeric(5, 0),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_evaluations" ADD CONSTRAINT "member_evaluations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_evaluations" ADD CONSTRAINT "member_evaluations_evaluated_by_id_user_id_fk" FOREIGN KEY ("evaluated_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_evaluations_member_id_idx" ON "member_evaluations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_evaluations_date_idx" ON "member_evaluations" USING btree ("evaluation_date");