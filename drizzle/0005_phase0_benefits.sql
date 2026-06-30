CREATE TABLE "package_benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" uuid NOT NULL,
	"benefit_key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "package_benefits_package_id_benefit_key_unique" UNIQUE("package_id","benefit_key")
);
--> statement-breakpoint
ALTER TABLE "package_benefits" ADD CONSTRAINT "package_benefits_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;