ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "two_factor_enabled" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "twoFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"verified" boolean NOT NULL DEFAULT false,
	"failed_verification_count" integer NOT NULL DEFAULT 0,
	"locked_until" timestamp
);
