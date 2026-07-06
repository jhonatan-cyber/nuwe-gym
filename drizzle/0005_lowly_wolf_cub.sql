CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"name" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"module" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_name" text NOT NULL,
	"permission_name" text NOT NULL,
	CONSTRAINT "role_permissions_role_name_permission_name_pk" PRIMARY KEY("role_name","permission_name")
);
--> statement-breakpoint
ALTER TABLE "loyalty_tiers" ALTER COLUMN "benefits" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "role_id" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_name_roles_name_fk" FOREIGN KEY ("role_name") REFERENCES "public"."roles"("name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_name_permissions_name_fk" FOREIGN KEY ("permission_name") REFERENCES "public"."permissions"("name") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_role_id_roles_name_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("name") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;