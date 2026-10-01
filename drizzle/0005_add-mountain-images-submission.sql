CREATE TYPE "public"."mountain_image_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."mountain_image_submitter_role" AS ENUM('anonymous', 'user', 'admin');--> statement-breakpoint
ALTER TABLE "mountains" RENAME COLUMN "image" TO "image_url";--> statement-breakpoint
ALTER TABLE "mountain_images" ADD COLUMN "status" "mountain_image_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "mountain_images" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "mountain_images" ADD COLUMN "submitted_name" text;--> statement-breakpoint
ALTER TABLE "mountain_images" ADD COLUMN "submitted_at" bigint NOT NULL;