CREATE TABLE "mountain_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mountain_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" bigint,
	"created_by" text DEFAULT 'admin' NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "mountains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"osm_id" bigint,
	"name" varchar(250) NOT NULL,
	"name_ascii" varchar(250),
	"alt_name" varchar(250),
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"elevation" double precision,
	"province" varchar(100),
	"description" text,
	"image_url" text,
	"created_at" bigint,
	"created_by" text DEFAULT 'admin' NOT NULL,
	"updated_by" text,
	CONSTRAINT "mountains_osm_id_unique" UNIQUE("osm_id")
);
--> statement-breakpoint
ALTER TABLE "mountain_images" ADD CONSTRAINT "mountain_images_mountain_id_mountains_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountains"("id") ON DELETE cascade ON UPDATE no action;