CREATE TABLE "claims" (
	"id" serial PRIMARY KEY,
	"item_id" integer NOT NULL,
	"claimant_name" text NOT NULL,
	"reg_number" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"proof" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "secret_details" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "claims_status_idx" ON "claims" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "claims_item_reg_idx" ON "claims" ("item_id","reg_number");--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_item_id_items_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE;