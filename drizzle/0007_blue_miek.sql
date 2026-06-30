CREATE TABLE "product_stock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"stock_current" integer DEFAULT 0 NOT NULL,
	"stock_minimum" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_stock" ADD CONSTRAINT "product_stock_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_stock_product_branch_idx" ON "product_stock" USING btree ("product_id","branch_id");--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "stock_current";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "stock_minimum";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "branch_id";