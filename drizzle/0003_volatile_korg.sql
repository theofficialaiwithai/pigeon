ALTER TABLE "cohorts" ALTER COLUMN "cohort_start_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cohorts" ALTER COLUMN "cart_open_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cohorts" ALTER COLUMN "cart_close_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "sequence_type" text DEFAULT 'launch';