CREATE TYPE "public"."action_type" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'PRINT', 'RENEW', 'FREEZE', 'RESUME');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('MEMBER', 'SUBSCRIPTION', 'PLAN', 'PAYMENT', 'PRODUCT', 'CATEGORY', 'SUPPLIER', 'PURCHASE', 'SALE', 'CHECK_IN', 'CASH_REGISTER', 'INVENTORY', 'USER', 'SETTING', 'CLASS', 'SCHEDULE', 'BOOKING', 'TRAINER', 'NOTIFICATION', 'FREEZE', 'BRANCH', 'PACKAGE');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('CONFIRMED', 'CANCELLED', 'ATTENDED');--> statement-breakpoint
CREATE TYPE "public"."cash_movement_type" AS ENUM('INCOME', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "public"."cash_session_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."cash_source_type" AS ENUM('MEMBERSHIP_PAYMENT', 'SALE', 'MANUAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."check_in_result" AS ENUM('ALLOWED', 'DENIED_EXPIRED', 'DENIED_INACTIVE', 'DENIED_SUSPENDED', 'DENIED_SCHEDULE');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_type" AS ENUM('PURCHASE', 'SALE', 'MANUAL_ADJUSTMENT', 'RETURN', 'LOSS', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."package_type" AS ENUM('PACKAGE', 'PROMOTION', 'SPECIAL', 'DAILY_PASS');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'QR', 'TRANSFER', 'CARD');--> statement-breakpoint
CREATE TYPE "public"."renewal_type" AS ENUM('MANUAL', 'AUTO');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('COMPLETED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."guest_pass_status" AS ENUM('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
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
CREATE TABLE "class_waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_schedule_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "class_waitlist_unique" UNIQUE("class_schedule_id","member_id")
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
	"branch_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"capacity" integer DEFAULT 20 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "corporate_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"tax_id" text,
	"address" text,
	"phone" text,
	"email" text,
	"contact_person" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"branch_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"clock_in" timestamp NOT NULL,
	"clock_out" timestamp,
	"status" text DEFAULT 'PRESENT' NOT NULL,
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_bonuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"amount" text DEFAULT '0' NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"type" text DEFAULT 'OTHER' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'APPROVED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"contract_type" text DEFAULT 'INDEFINITE' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"position" text DEFAULT '' NOT NULL,
	"salary" text DEFAULT '0',
	"working_hours" text DEFAULT '',
	"benefits" text DEFAULT '',
	"terms" text DEFAULT '',
	"file_url" text DEFAULT '',
	"file_name" text DEFAULT '',
	"is_active" boolean DEFAULT true,
	"signed_by_employee" boolean DEFAULT false,
	"signed_by_employer" boolean DEFAULT false,
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'OTHER' NOT NULL,
	"description" text DEFAULT '',
	"file_url" text DEFAULT '',
	"file_name" text DEFAULT '',
	"file_size" text DEFAULT '',
	"uploaded_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"evaluated_by_id" text,
	"evaluation_date" timestamp DEFAULT now() NOT NULL,
	"rating" integer DEFAULT 3,
	"punctuality" integer DEFAULT 3,
	"teamwork" integer DEFAULT 3,
	"productivity" integer DEFAULT 3,
	"attitude" integer DEFAULT 3,
	"communication" integer DEFAULT 3,
	"strengths" text DEFAULT '',
	"improvements" text DEFAULT '',
	"comments" text DEFAULT '',
	"recommendation" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"schedule_type" text DEFAULT 'REGULAR' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_vacations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"days_count" integer NOT NULL,
	"year" integer NOT NULL,
	"reason" text DEFAULT '',
	"status" text DEFAULT 'PENDING' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"rejection_reason" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"branch_id" uuid,
	"employee_code" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text,
	"document_number" text,
	"position" text NOT NULL,
	"department" text DEFAULT '',
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"hire_date" timestamp NOT NULL,
	"termination_date" timestamp,
	"base_salary" text DEFAULT '0',
	"payment_frequency" text DEFAULT 'MONTHLY',
	"bank_name" text DEFAULT '',
	"bank_account_number" text DEFAULT '',
	"emergency_contact_name" text DEFAULT '',
	"emergency_contact_phone" text DEFAULT '',
	"emergency_contact_relation" text DEFAULT '',
	"notes" text DEFAULT '',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_employee_code_unique" UNIQUE("employee_code")
);
--> statement-breakpoint
CREATE TABLE "family_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"primary_member_id" uuid NOT NULL,
	"discount_percent" integer DEFAULT 10 NOT NULL,
	"branch_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_group_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"relationship" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"guest_name" text NOT NULL,
	"guest_phone" text,
	"guest_document" text,
	"status" "guest_pass_status" DEFAULT 'ACTIVE' NOT NULL,
	"used_at" timestamp,
	"used_by_user_id" text,
	"expires_at" timestamp,
	"notes" text,
	"branch_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
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
	"corporate_account_id" uuid,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"qr_code" text,
	"photo_url" text,
	"physical_restrictions" text,
	"medical_notes" text,
	"contract_signature" text,
	"status" "member_status" DEFAULT 'ACTIVE' NOT NULL,
	"referral_code" text,
	"referred_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"package_id" uuid,
	"total_amount" numeric(10, 2),
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
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"stock_current" integer DEFAULT 0 NOT NULL,
	"stock_minimum" integer DEFAULT 0 NOT NULL,
	"expiry_date" timestamp,
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
	"branch_id" uuid,
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
	"batch_number" text,
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
	"resend_api_key" text DEFAULT '',
	"email_from" text DEFAULT '',
	"twilio_account_sid" text DEFAULT '',
	"twilio_auth_token" text DEFAULT '',
	"twilio_whatsapp_number" text DEFAULT '',
	"twilio_sms_number" text DEFAULT '',
	"wa_template_expiration_sid" text DEFAULT '',
	"wa_template_expired_sid" text DEFAULT '',
	"wa_template_birthday_sid" text DEFAULT '',
	"wa_template_inactive_sid" text DEFAULT '',
	"wa_template_class_reminder_sid" text DEFAULT '',
	"firebase_api_key" text DEFAULT '',
	"firebase_auth_domain" text DEFAULT '',
	"firebase_project_id" text DEFAULT '',
	"firebase_messaging_sender_id" text DEFAULT '',
	"firebase_app_id" text DEFAULT '',
	"firebase_vapid_key" text DEFAULT '',
	"firebase_service_account" text DEFAULT '',
	"company_tax_id" text DEFAULT '',
	"company_legal_name" text DEFAULT '',
	"invoice_footer" text DEFAULT '',
	"auto_renew_secret_key" text DEFAULT '',
	"stripe_secret_key" text DEFAULT '',
	"stripe_publishable_key" text DEFAULT '',
	"stripe_webhook_secret" text DEFAULT '',
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
CREATE TABLE "trainer_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
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
CREATE TABLE "package_allowed_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text,
	"end_time" text
);
--> statement-breakpoint
CREATE TABLE "package_benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"benefit_key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "package_benefits_package_id_benefit_key_unique" UNIQUE("package_id","benefit_key")
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
	"renewal_type" "renewal_type" DEFAULT 'MANUAL',
	"grace_days" integer DEFAULT 0 NOT NULL,
	"max_freezes" integer DEFAULT 0 NOT NULL,
	"max_freeze_days" integer DEFAULT 0 NOT NULL,
	"allowed_start_time" text,
	"allowed_end_time" text,
	"daily_access_limit" integer,
	"color" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"title" text NOT NULL,
	"goal" text,
	"target_calories" integer,
	"protein_grams" numeric(6, 1),
	"carbs_grams" numeric(6, 1),
	"fat_grams" numeric(6, 1),
	"meals_per_day" integer DEFAULT 4,
	"plan_content" text,
	"is_ai_generated" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weight_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"height_cm" numeric(5, 1),
	"body_fat_percent" numeric(5, 2),
	"muscle_mass_kg" numeric(5, 2),
	"photo_url" text,
	"notes" text,
	"recorded_by_user_id" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text DEFAULT '🏆' NOT NULL,
	"requirement" jsonb DEFAULT '{"type":"CHECK_IN_COUNT","target":1}'::jsonb NOT NULL,
	"reward_points" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"rewarded" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"target" integer NOT NULL,
	"reward_points" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"sale_id" uuid,
	"member_id" uuid,
	"discount_applied" integer NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"discount_fixed" integer,
	"min_purchase" integer DEFAULT 0 NOT NULL,
	"max_uses" integer DEFAULT 0 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "loyalty_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"balance" integer NOT NULL,
	"source" text NOT NULL,
	"reference_id" uuid,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"min_points" integer DEFAULT 0 NOT NULL,
	"color" text DEFAULT '#94a3b8' NOT NULL,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"benefits" jsonb DEFAULT '[]',
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_tiers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "member_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'DISCOUNT' NOT NULL,
	"discount_percent" integer DEFAULT 0,
	"reward_points" integer DEFAULT 0,
	"conditions" jsonb DEFAULT '{}'::jsonb,
	"start_date" timestamp,
	"end_date" timestamp,
	"auto_apply" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"year" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid NOT NULL,
	"member_id" uuid,
	"customer_name" text,
	"customer_doc_number" text,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"notes" text,
	"status" text DEFAULT 'ISSUED' NOT NULL,
	"branch_id" uuid,
	"created_by_user_id" text,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"device_info" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"base_salary" text DEFAULT '0' NOT NULL,
	"bonuses_total" text DEFAULT '0' NOT NULL,
	"deductions_total" text DEFAULT '0' NOT NULL,
	"net_salary" text DEFAULT '0' NOT NULL,
	"bonuses" jsonb DEFAULT '[]'::jsonb,
	"deductions" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"payment_date" timestamp,
	"payment_method" text DEFAULT 'BANK_TRANSFER',
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_branches_member_id_branch_id_unique" UNIQUE("member_id","branch_id")
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'Dispositivo desconocido' NOT NULL,
	"browser" text DEFAULT '',
	"os" text DEFAULT '',
	"device_type" text DEFAULT 'desktop',
	"ip_address" text DEFAULT '',
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"is_trusted" boolean DEFAULT false,
	"is_current" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"stripe_customer_id" text DEFAULT '',
	"stripe_payment_method_id" text NOT NULL,
	"card_brand" text DEFAULT '' NOT NULL,
	"card_last4" text DEFAULT '' NOT NULL,
	"card_exp_month" text DEFAULT '',
	"card_exp_year" text DEFAULT '',
	"is_default" boolean DEFAULT false,
	"auto_pay" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tv_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tv_ticker_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "class_waitlist" ADD CONSTRAINT "class_waitlist_class_schedule_id_class_schedules_id_fk" FOREIGN KEY ("class_schedule_id") REFERENCES "public"."class_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_waitlist" ADD CONSTRAINT "class_waitlist_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_class_schedule_id_class_schedules_id_fk" FOREIGN KEY ("class_schedule_id") REFERENCES "public"."class_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "corporate_accounts" ADD CONSTRAINT "corporate_accounts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_attendance" ADD CONSTRAINT "employee_attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_bonuses" ADD CONSTRAINT "employee_bonuses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_performance" ADD CONSTRAINT "employee_performance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_performance" ADD CONSTRAINT "employee_performance_evaluated_by_id_user_id_fk" FOREIGN KEY ("evaluated_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_schedules" ADD CONSTRAINT "employee_schedules_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_vacations" ADD CONSTRAINT "employee_vacations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_groups" ADD CONSTRAINT "family_groups_primary_member_id_members_id_fk" FOREIGN KEY ("primary_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_groups" ADD CONSTRAINT "family_groups_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_group_id_family_groups_id_fk" FOREIGN KEY ("family_group_id") REFERENCES "public"."family_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_passes" ADD CONSTRAINT "guest_passes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_passes" ADD CONSTRAINT "guest_passes_used_by_user_id_user_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_corporate_account_id_corporate_accounts_id_fk" FOREIGN KEY ("corporate_account_id") REFERENCES "public"."corporate_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "trainer_observations" ADD CONSTRAINT "trainer_observations_trainer_id_trainer_profiles_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_observations" ADD CONSTRAINT "trainer_observations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_profiles" ADD CONSTRAINT "trainer_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_freezes" ADD CONSTRAINT "membership_freezes_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_freezes" ADD CONSTRAINT "membership_freezes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_allowed_days" ADD CONSTRAINT "package_allowed_days_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_benefits" ADD CONSTRAINT "package_benefits_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_items" ADD CONSTRAINT "package_items_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_history" ADD CONSTRAINT "weight_history_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_history" ADD CONSTRAINT "weight_history_recorded_by_user_id_user_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_evaluations" ADD CONSTRAINT "member_evaluations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_evaluations" ADD CONSTRAINT "member_evaluations_evaluated_by_id_user_id_fk" FOREIGN KEY ("evaluated_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_progress" ADD CONSTRAINT "challenge_progress_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_progress" ADD CONSTRAINT "challenge_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_points" ADD CONSTRAINT "loyalty_points_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_badges" ADD CONSTRAINT "member_badges_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_badges" ADD CONSTRAINT "member_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_sequences" ADD CONSTRAINT "invoice_sequences_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_branches" ADD CONSTRAINT "member_branches_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_branches" ADD CONSTRAINT "member_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_payment_methods" ADD CONSTRAINT "member_payment_methods_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "branches_is_active_idx" ON "branches" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "check_ins_member_id_idx" ON "check_ins" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "check_ins_registered_by_user_id_idx" ON "check_ins" USING btree ("registered_by_user_id");--> statement-breakpoint
CREATE INDEX "check_ins_checked_in_at_idx" ON "check_ins" USING btree ("checked_in_at");--> statement-breakpoint
CREATE INDEX "class_waitlist_schedule_id_idx" ON "class_waitlist" USING btree ("class_schedule_id");--> statement-breakpoint
CREATE INDEX "class_waitlist_member_id_idx" ON "class_waitlist" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "class_bookings_class_schedule_id_idx" ON "class_bookings" USING btree ("class_schedule_id");--> statement-breakpoint
CREATE INDEX "class_bookings_member_id_idx" ON "class_bookings" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "class_schedules_class_id_idx" ON "class_schedules" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "attendance_employee_date_idx" ON "employee_attendance" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "attendance_date_idx" ON "employee_attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "bonuses_employee_id_idx" ON "employee_bonuses" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "bonuses_status_idx" ON "employee_bonuses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bonuses_date_idx" ON "employee_bonuses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "employee_contracts_employee_id_idx" ON "employee_contracts" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_documents_employee_id_idx" ON "employee_documents" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_performance_employee_id_idx" ON "employee_performance" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_performance_date_idx" ON "employee_performance" USING btree ("evaluation_date");--> statement-breakpoint
CREATE INDEX "emp_schedules_employee_id_idx" ON "employee_schedules" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "emp_schedules_day_idx" ON "employee_schedules" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "vacations_employee_id_idx" ON "employee_vacations" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "vacations_year_idx" ON "employee_vacations" USING btree ("year");--> statement-breakpoint
CREATE INDEX "vacations_status_idx" ON "employee_vacations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employees_branch_id_idx" ON "employees" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "employees_status_idx" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "guest_passes_member_id_idx" ON "guest_passes" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "guest_passes_status_idx" ON "guest_passes" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "members_document_number_idx" ON "members" USING btree ("document_number");--> statement-breakpoint
CREATE UNIQUE INDEX "members_qr_code_idx" ON "members" USING btree ("qr_code");--> statement-breakpoint
CREATE UNIQUE INDEX "members_referral_code_idx" ON "members" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "subscriptions_member_id_idx" ON "subscriptions" USING btree ("member_id");--> statement-breakpoint
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
CREATE UNIQUE INDEX "product_stock_product_branch_idx" ON "product_stock" USING btree ("product_id","branch_id");--> statement-breakpoint
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
CREATE INDEX "trainer_observations_trainer_id_idx" ON "trainer_observations" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "trainer_observations_member_id_idx" ON "trainer_observations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "trainer_profiles_user_id_idx" ON "trainer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "membership_freezes_subscription_id_idx" ON "membership_freezes" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "membership_freezes_member_id_idx" ON "membership_freezes" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "nutrition_plans_member_id_idx" ON "nutrition_plans" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "nutrition_plans_is_active_idx" ON "nutrition_plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "weight_history_member_id_idx" ON "weight_history" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "weight_history_recorded_at_idx" ON "weight_history" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "member_evaluations_member_id_idx" ON "member_evaluations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_evaluations_date_idx" ON "member_evaluations" USING btree ("evaluation_date");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_progress_unique" ON "challenge_progress" USING btree ("challenge_id","member_id");--> statement-breakpoint
CREATE INDEX "coupon_usage_coupon_id_idx" ON "coupon_usage" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "loyalty_points_member_id_idx" ON "loyalty_points" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "loyalty_points_created_at_idx" ON "loyalty_points" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "member_badges_unique" ON "member_badges" USING btree ("member_id","badge_id");--> statement-breakpoint
CREATE INDEX "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_source_idx" ON "invoices" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "invoices_member_id_idx" ON "invoices" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "invoices_branch_id_idx" ON "invoices" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "invoices_issued_at_idx" ON "invoices" USING btree ("issued_at");--> statement-breakpoint
CREATE INDEX "invoices_created_at_idx" ON "invoices" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "push_subscriptions_token_idx" ON "push_subscriptions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "payroll_employee_id_idx" ON "payroll" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payroll_status_idx" ON "payroll" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payroll_period_idx" ON "payroll" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "user_devices_user_id_idx" ON "user_devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "member_payment_methods_member_id_idx" ON "member_payment_methods" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_payment_methods_stripe_pm_id_idx" ON "member_payment_methods" USING btree ("stripe_payment_method_id");