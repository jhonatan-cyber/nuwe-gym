CREATE TABLE "branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text DEFAULT '',
	"phone" text DEFAULT '',
	"email" text DEFAULT '',
	"is_active" boolean DEFAULT true,
	"opening_time" text DEFAULT '08:00',
	"closing_time" text DEFAULT '22:00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"branch_id" integer NOT NULL,
	"is_default" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "cash_register_sessions" ADD COLUMN "branch_id" integer;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "branch_id" integer;--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "branch_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "branch_id" integer;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "branch_id" integer;--> statement-breakpoint
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;