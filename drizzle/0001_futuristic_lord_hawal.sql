ALTER TABLE "settings" ADD COLUMN "logo_base64" text;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "opening_time" text DEFAULT '08:00';
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "closing_time" text DEFAULT '22:00';
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "monday_open" boolean DEFAULT true;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "tuesday_open" boolean DEFAULT true;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "wednesday_open" boolean DEFAULT true;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "thursday_open" boolean DEFAULT true;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "friday_open" boolean DEFAULT true;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "saturday_open" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "sunday_open" boolean DEFAULT false;
