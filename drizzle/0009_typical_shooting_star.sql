CREATE TABLE "roles" (
	"name" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "settings" DROP CONSTRAINT "settings_single_row";--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "entity_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text USING role::text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'TRAINER';--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "user_branches" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user_branches" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "user_branches" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cash_movements" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cash_movements" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "cash_movements" ALTER COLUMN "cash_session_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cash_movements" ALTER COLUMN "source_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cash_register_sessions" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cash_register_sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "cash_register_sessions" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "member_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "class_bookings" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "class_bookings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "class_bookings" ALTER COLUMN "class_schedule_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "class_bookings" ALTER COLUMN "member_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "class_schedules" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "class_schedules" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "class_schedules" ALTER COLUMN "class_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "members" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "membership_plans" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "membership_plans" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "member_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "package_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "membership_payments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "membership_payments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "membership_payments" ALTER COLUMN "member_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "membership_payments" ALTER COLUMN "subscription_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "membership_payments" ALTER COLUMN "cash_session_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "product_categories" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "product_categories" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "category_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "suppliers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "purchase_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "purchase_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "purchase_items" ALTER COLUMN "purchase_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "purchase_items" ALTER COLUMN "product_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "supplier_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sale_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sale_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "sale_items" ALTER COLUMN "sale_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sale_items" ALTER COLUMN "product_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "member_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "cash_session_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "branch_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "inventory_movements" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "inventory_movements" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "inventory_movements" ALTER COLUMN "product_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "inventory_movements" ALTER COLUMN "reference_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "id" SET DEFAULT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
ALTER TABLE "trainer_assignments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "trainer_assignments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "trainer_assignments" ALTER COLUMN "trainer_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "trainer_assignments" ALTER COLUMN "member_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "trainer_availability" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "trainer_availability" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "trainer_availability" ALTER COLUMN "trainer_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "trainer_profiles" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "trainer_profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "membership_freezes" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "membership_freezes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "membership_freezes" ALTER COLUMN "subscription_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "membership_freezes" ALTER COLUMN "member_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "membership_freezes" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "reference_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "package_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "package_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "package_items" ALTER COLUMN "package_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "packages" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "packages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_roles_name_fk" FOREIGN KEY ("role") REFERENCES "public"."roles"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_single_row" CHECK ("settings"."id" = '00000000-0000-0000-0000-000000000000'::uuid);--> statement-breakpoint
DROP TYPE "public"."user_role";