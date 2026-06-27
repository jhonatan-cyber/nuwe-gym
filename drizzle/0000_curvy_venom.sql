CREATE TYPE "public"."action_type" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'PRINT', 'RENEW', 'FREEZE', 'RESUME');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('MEMBER', 'SUBSCRIPTION', 'PLAN', 'PAYMENT', 'PRODUCT', 'CATEGORY', 'SUPPLIER', 'PURCHASE', 'SALE', 'CHECK_IN', 'CASH_REGISTER', 'INVENTORY', 'USER', 'SETTING', 'CLASS', 'SCHEDULE', 'BOOKING', 'TRAINER', 'NOTIFICATION', 'FREEZE', 'BRANCH', 'PACKAGE');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('CONFIRMED', 'CANCELLED', 'ATTENDED');--> statement-breakpoint
CREATE TYPE "public"."cash_movement_type" AS ENUM('INCOME', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "public"."cash_session_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."cash_source_type" AS ENUM('MEMBERSHIP_PAYMENT', 'SALE', 'MANUAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."check_in_result" AS ENUM('ALLOWED', 'DENIED_EXPIRED', 'DENIED_INACTIVE', 'DENIED_SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_type" AS ENUM('PURCHASE', 'SALE', 'MANUAL_ADJUSTMENT', 'RETURN', 'LOSS');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."package_type" AS ENUM('PACKAGE', 'PROMOTION', 'SPECIAL');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'QR', 'TRANSFER', 'CARD');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('COMPLETED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('EXPIRATION', 'LOW_STOCK', 'RENEWAL', 'PAYMENT', 'SYSTEM');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"user_name" text,
	"user_role" text,
	"action" "action_type" NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" text,
	"description" text NOT NULL,
	"details" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"banned" boolean,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"role" text DEFAULT 'TRAINER' NOT NULL,
	"document_number" text,
	"phone" text,
	"address" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "cash_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cash_session_id" uuid NOT NULL,
	"movement_type" "cash_movement_type" NOT NULL,
	"source_type" "cash_source_type" NOT NULL,
	"source_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_register_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opened_by_user_id" text NOT NULL,
	"closed_by_user_id" text,
	"opening_amount" numeric(10, 2) NOT NULL,
	"expected_closing_amount" numeric(10, 2),
	"actual_closing_amount" numeric(10, 2),
	"difference" numeric(10, 2),
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"status" "cash_session_status" DEFAULT 'OPEN' NOT NULL,
	"notes" text,
	"branch_id" uuid
);
--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	"registered_by_user_id" text NOT NULL,
	"result_status" "check_in_result" NOT NULL,
	"notes" text,
	"branch_id" uuid
);
--> statement-breakpoint
CREATE TABLE "class_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_schedule_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"booked_at" timestamp DEFAULT now() NOT NULL,
	"status" "booking_status" DEFAULT 'CONFIRMED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"room" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"capacity" integer DEFAULT 20 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"name" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"document_number" text,
	"phone" text,
	"email" text,
	"birth_date" timestamp,
	"gender" text,
	"address" text,
	"branch_id" uuid,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"qr_code" text,
	"photo_url" text,
	"status" "member_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration_days" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"plan_id" uuid,
	"package_id" uuid,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" "subscription_status" DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"cash_session_id" uuid,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"barcode" text,
	"name" text NOT NULL,
	"description" text,
	"category_id" uuid NOT NULL,
	"purchase_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"sale_price" numeric(10, 2) NOT NULL,
	"stock_current" integer DEFAULT 0 NOT NULL,
	"stock_minimum" integer DEFAULT 0 NOT NULL,
	"image_url" text,
	"branch_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"purchase_number" text NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"notes" text,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_number" text NOT NULL,
	"member_id" uuid,
	"customer_name" text,
	"user_id" text NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"payment_method" "payment_method",
	"status" "sale_status" DEFAULT 'COMPLETED' NOT NULL,
	"sold_at" timestamp DEFAULT now() NOT NULL,
	"cash_session_id" uuid,
	"branch_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"movement_type" "inventory_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"notes" text,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL,
	"gym_name" text DEFAULT 'Mi Gimnasio' NOT NULL,
	"gym_address" text DEFAULT '',
	"gym_phone" text DEFAULT '',
	"gym_email" text DEFAULT '',
	"tax_rate" numeric(5, 2) DEFAULT '0.00',
	"currency_symbol" text DEFAULT '$',
	"currency_code" text DEFAULT 'ARS',
	"decimal_places" integer DEFAULT 2,
	"low_stock_threshold" integer DEFAULT 5,
	"membership_reminder_days" integer DEFAULT 7,
	"check_in_window_minutes" integer DEFAULT 60,
	"enable_auto_renew" boolean DEFAULT false,
	"logo_base64" text,
	"backup_enabled" boolean DEFAULT false,
	"backup_frequency" text DEFAULT 'weekly',
	"opening_time" text DEFAULT '08:00',
	"closing_time" text DEFAULT '22:00',
	"monday_open" boolean DEFAULT true,
	"tuesday_open" boolean DEFAULT true,
	"wednesday_open" boolean DEFAULT true,
	"thursday_open" boolean DEFAULT true,
	"friday_open" boolean DEFAULT true,
	"saturday_open" boolean DEFAULT false,
	"sunday_open" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_single_row" CHECK ("settings"."id" = '00000000-0000-0000-0000-000000000000'::uuid)
);
--> statement-breakpoint
CREATE TABLE "trainer_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "trainer_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"specialty" text DEFAULT '',
	"bio" text DEFAULT '',
	"commission_rate" numeric(5, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_freezes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"reason" text DEFAULT '',
	"resumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"reference_id" uuid,
	"reference_type" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "package_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_roles_name_fk" FOREIGN KEY ("role") REFERENCES "public"."roles"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cash_session_id_cash_register_sessions_id_fk" FOREIGN KEY ("cash_session_id") REFERENCES "public"."cash_register_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "cash_register_sessions_opened_by_user_id_user_id_fk" FOREIGN KEY ("opened_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_register_sessions" ADD CONSTRAINT "cash_register_sessions_closed_by_user_id_user_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_registered_by_user_id_user_id_fk" FOREIGN KEY ("registered_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_class_schedule_id_class_schedules_id_fk" FOREIGN KEY ("class_schedule_id") REFERENCES "public"."class_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_membership_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_assignments" ADD CONSTRAINT "trainer_assignments_trainer_id_trainer_profiles_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_assignments" ADD CONSTRAINT "trainer_assignments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_availability" ADD CONSTRAINT "trainer_availability_trainer_id_trainer_profiles_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_profiles" ADD CONSTRAINT "trainer_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_freezes" ADD CONSTRAINT "membership_freezes_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_freezes" ADD CONSTRAINT "membership_freezes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "branches_is_active_idx" ON "branches" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "check_ins_member_id_idx" ON "check_ins" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "check_ins_registered_by_user_id_idx" ON "check_ins" USING btree ("registered_by_user_id");--> statement-breakpoint
CREATE INDEX "check_ins_checked_in_at_idx" ON "check_ins" USING btree ("checked_in_at");--> statement-breakpoint
CREATE INDEX "class_bookings_class_schedule_id_idx" ON "class_bookings" USING btree ("class_schedule_id");--> statement-breakpoint
CREATE INDEX "class_bookings_member_id_idx" ON "class_bookings" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "class_schedules_class_id_idx" ON "class_schedules" USING btree ("class_id");--> statement-breakpoint
CREATE UNIQUE INDEX "members_document_number_idx" ON "members" USING btree ("document_number");--> statement-breakpoint
CREATE UNIQUE INDEX "members_qr_code_idx" ON "members" USING btree ("qr_code");--> statement-breakpoint
CREATE INDEX "subscriptions_member_id_idx" ON "subscriptions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "subscriptions_package_id_idx" ON "subscriptions" USING btree ("package_id");--> statement-breakpoint
CREATE INDEX "subscriptions_start_date_idx" ON "subscriptions" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "subscriptions_end_date_idx" ON "subscriptions" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "subscriptions_created_at_idx" ON "subscriptions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "subscriptions_updated_at_idx" ON "subscriptions" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "membership_payments_member_id_idx" ON "membership_payments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "membership_payments_subscription_id_idx" ON "membership_payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "membership_payments_cash_session_id_idx" ON "membership_payments" USING btree ("cash_session_id");--> statement-breakpoint
CREATE INDEX "membership_payments_created_by_user_id_idx" ON "membership_payments" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "membership_payments_payment_date_idx" ON "membership_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "membership_payments_created_at_idx" ON "membership_payments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_name_idx" ON "product_categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "purchase_items_purchase_id_idx" ON "purchase_items" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "purchase_items_product_id_idx" ON "purchase_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "purchases_supplier_id_idx" ON "purchases" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "purchases_created_by_user_id_idx" ON "purchases" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_items_product_id_idx" ON "sale_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sales_member_id_idx" ON "sales" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "sales_user_id_idx" ON "sales" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sales_cash_session_id_idx" ON "sales" USING btree ("cash_session_id");--> statement-breakpoint
CREATE INDEX "sales_sold_at_idx" ON "sales" USING btree ("sold_at");--> statement-breakpoint
CREATE INDEX "sales_created_at_idx" ON "sales" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inventory_movements_product_id_idx" ON "inventory_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_movements_created_by_user_id_idx" ON "inventory_movements" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "inventory_movements_created_at_idx" ON "inventory_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "trainer_assignments_trainer_id_idx" ON "trainer_assignments" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "trainer_assignments_member_id_idx" ON "trainer_assignments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "trainer_availability_trainer_id_idx" ON "trainer_availability" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "trainer_profiles_user_id_idx" ON "trainer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "membership_freezes_subscription_id_idx" ON "membership_freezes" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "membership_freezes_member_id_idx" ON "membership_freezes" USING btree ("member_id");--> statement-breakpoint
INSERT INTO "roles" ("name", "label", "description") VALUES
  ('ADMIN', 'Administrador', 'Acceso total al sistema'),
  ('RECEPTIONIST', 'Recepcionista', 'Gestión de clientes y accesos'),
  ('TRAINER', 'Entrenador', 'Gestión de clases y alumnos')
ON CONFLICT ("name") DO NOTHING;