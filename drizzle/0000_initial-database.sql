CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE "public"."difficulty" AS ENUM('easy', 'moderate', 'hard', 'extreme');--> statement-breakpoint
CREATE TYPE "public"."photo_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'approved', 'rejected', 'duplicate');--> statement-breakpoint
CREATE TABLE "mountain_photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"mountain_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"caption" text,
	"taken_at" timestamp with time zone,
	"status" "photo_status" DEFAULT 'pending' NOT NULL,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL,
	"updated_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL,
	CONSTRAINT "mountain_photos_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "mountain_provinces" (
	"mountain_id" uuid NOT NULL,
	"province_id" uuid NOT NULL,
	CONSTRAINT "mountain_provinces_mountain_id_province_id_pk" PRIMARY KEY("mountain_id","province_id")
);
--> statement-breakpoint
CREATE TABLE "mountain_ranges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "mountain_ranges_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "mountain_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"elevation_m" integer,
	"province_id" uuid,
	"note" text,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"reject_reason" text,
	"mountain_id" uuid,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL,
	"updated_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mountains" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_vi" text,
	"elevation_m" integer,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"description" text,
	"difficulty" "difficulty",
	"range_id" uuid,
	"osm_id" text,
	"wikidata_id" text,
	"created_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL,
	"updated_at" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint NOT NULL,
	CONSTRAINT "mountains_slug_unique" UNIQUE("slug"),
	CONSTRAINT "mountains_osm_id_unique" UNIQUE("osm_id"),
	CONSTRAINT "mountains_wikidata_id_unique" UNIQUE("wikidata_id"),
	CONSTRAINT "mountains_lat_check" CHECK ("mountains"."latitude" BETWEEN -90 AND 90),
	CONSTRAINT "mountains_lng_check" CHECK ("mountains"."longitude" BETWEEN -180 AND 180),
	CONSTRAINT "mountains_elevation_check" CHECK ("mountains"."elevation_m" IS NULL OR "mountains"."elevation_m" > 0)
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "provinces_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "mountain_photos" ADD CONSTRAINT "mountain_photos_mountain_id_mountains_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_provinces" ADD CONSTRAINT "mountain_provinces_mountain_id_mountains_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_provinces" ADD CONSTRAINT "mountain_provinces_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_requests" ADD CONSTRAINT "mountain_requests_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_requests" ADD CONSTRAINT "mountain_requests_mountain_id_mountains_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountains" ADD CONSTRAINT "mountains_range_id_mountain_ranges_id_fk" FOREIGN KEY ("range_id") REFERENCES "public"."mountain_ranges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photos_mountain_status_idx" ON "mountain_photos" USING btree ("mountain_id","status");--> statement-breakpoint
CREATE INDEX "requests_status_idx" ON "mountain_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "mountains_coords_idx" ON "mountains" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "mountains_elevation_idx" ON "mountains" USING btree ("elevation_m");--> statement-breakpoint
CREATE INDEX "mountains_name_trgm_idx" ON "mountains" USING gin ("name" gin_trgm_ops);