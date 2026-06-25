CREATE TYPE "public"."package_type" AS ENUM('PACKAGE', 'PROMOTION', 'SPECIAL');--> statement-breakpoint
ALTER TYPE "public"."entity_type" ADD VALUE 'PACKAGE';--> statement-breakpoint
CREATE TABLE "package_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"package_id" integer NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_base64" text,
	"price" numeric(10, 2) NOT NULL,
	"duration_days" integer NOT NULL,
	"type" "package_type" DEFAULT 'PACKAGE' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_movements" DROP CONSTRAINT "cash_movements_cash_session_id_cash_register_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "class_bookings" DROP CONSTRAINT "class_bookings_class_schedule_id_class_schedules_id_fk";
--> statement-breakpoint
ALTER TABLE "class_schedules" DROP CONSTRAINT "class_schedules_class_id_classes_id_fk";
--> statement-breakpoint
ALTER TABLE "purchase_items" DROP CONSTRAINT "purchase_items_purchase_id_purchases_id_fk";
--> statement-breakpoint
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_sale_id_sales_id_fk";
--> statement-breakpoint
ALTER TABLE "trainer_assignments" DROP CONSTRAINT "trainer_assignments_trainer_id_trainer_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "trainer_availability" DROP CONSTRAINT "trainer_availability_trainer_id_trainer_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cash_session_id_cash_register_sessions_id_fk" FOREIGN KEY ("cash_session_id") REFERENCES "public"."cash_register_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_class_schedule_id_class_schedules_id_fk" FOREIGN KEY ("class_schedule_id") REFERENCES "public"."class_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_assignments" ADD CONSTRAINT "trainer_assignments_trainer_id_trainer_profiles_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_availability" ADD CONSTRAINT "trainer_availability_trainer_id_trainer_profiles_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_freezes" ADD CONSTRAINT "membership_freezes_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_freezes" ADD CONSTRAINT "membership_freezes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "branches_is_active_idx" ON "branches" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "class_bookings_class_schedule_id_idx" ON "class_bookings" USING btree ("class_schedule_id");--> statement-breakpoint
CREATE INDEX "class_bookings_member_id_idx" ON "class_bookings" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "class_schedules_class_id_idx" ON "class_schedules" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "purchase_items_purchase_id_idx" ON "purchase_items" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "purchase_items_product_id_idx" ON "purchase_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "purchases_supplier_id_idx" ON "purchases" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "purchases_created_by_user_id_idx" ON "purchases" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_items_product_id_idx" ON "sale_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "trainer_assignments_trainer_id_idx" ON "trainer_assignments" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "trainer_assignments_member_id_idx" ON "trainer_assignments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "trainer_availability_trainer_id_idx" ON "trainer_availability" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "trainer_profiles_user_id_idx" ON "trainer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "membership_freezes_subscription_id_idx" ON "membership_freezes" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "membership_freezes_member_id_idx" ON "membership_freezes" USING btree ("member_id");--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_single_row" CHECK ("settings"."id" = 1);