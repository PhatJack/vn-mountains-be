ALTER TABLE "mountain_images" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mountains" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mountain_images" ADD COLUMN "updated_at" bigint;--> statement-breakpoint
ALTER TABLE "mountains" ADD COLUMN "updated_at" bigint;