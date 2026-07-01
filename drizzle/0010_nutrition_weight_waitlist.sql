-- ============================================================
-- Migration 0010: nutrition_plans, weight_history, class_waitlist
--                 + DAILY_PASS in package_type enum
-- ============================================================

-- 1. Add DAILY_PASS to package_type enum
ALTER TYPE "public"."package_type" ADD VALUE IF NOT EXISTS 'DAILY_PASS';

-- 2. nutrition_plans
CREATE TABLE IF NOT EXISTS "nutrition_plans" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "member_id"         uuid NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
  "title"             text NOT NULL,
  "goal"              text,
  "target_calories"   integer,
  "protein_grams"     numeric(6, 1),
  "carbs_grams"       numeric(6, 1),
  "fat_grams"         numeric(6, 1),
  "meals_per_day"     integer DEFAULT 4,
  "plan_content"      text,
  "is_ai_generated"   boolean DEFAULT false,
  "is_active"         boolean DEFAULT true,
  "created_by_user_id" text REFERENCES "user"("id"),
  "created_at"        timestamp DEFAULT now() NOT NULL,
  "updated_at"        timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "nutrition_plans_member_id_idx" ON "nutrition_plans" ("member_id");
CREATE INDEX IF NOT EXISTS "nutrition_plans_is_active_idx" ON "nutrition_plans" ("is_active");

-- 3. weight_history
CREATE TABLE IF NOT EXISTS "weight_history" (
  "id"                    uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "member_id"             uuid NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
  "weight_kg"             numeric(5, 2) NOT NULL,
  "height_cm"             numeric(5, 1),
  "body_fat_percent"      numeric(5, 2),
  "muscle_mass_kg"        numeric(5, 2),
  "photo_url"             text,
  "notes"                 text,
  "recorded_by_user_id"   text REFERENCES "user"("id"),
  "recorded_at"           timestamp DEFAULT now() NOT NULL,
  "created_at"            timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "weight_history_member_id_idx" ON "weight_history" ("member_id");
CREATE INDEX IF NOT EXISTS "weight_history_recorded_at_idx" ON "weight_history" ("recorded_at");

-- 4. class_waitlist
CREATE TABLE IF NOT EXISTS "class_waitlist" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "class_schedule_id"  uuid NOT NULL REFERENCES "class_schedules"("id") ON DELETE CASCADE,
  "member_id"          uuid NOT NULL REFERENCES "members"("id") ON DELETE CASCADE,
  "added_at"           timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "class_waitlist_unique" UNIQUE ("class_schedule_id", "member_id")
);
CREATE INDEX IF NOT EXISTS "class_waitlist_schedule_id_idx" ON "class_waitlist" ("class_schedule_id");
CREATE INDEX IF NOT EXISTS "class_waitlist_member_id_idx" ON "class_waitlist" ("member_id");
