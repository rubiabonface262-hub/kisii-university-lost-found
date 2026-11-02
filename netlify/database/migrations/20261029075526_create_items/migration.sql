CREATE TABLE "items" (
	"id" serial PRIMARY KEY,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"location" text NOT NULL,
	"event_date" date NOT NULL,
	"contact_name" text NOT NULL,
	"contact_phone" text DEFAULT '' NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"image_key" text,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_note" text,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "items_status_kind_idx" ON "items" ("status","kind");--> statement-breakpoint
CREATE INDEX "items_created_idx" ON "items" ("created_at");