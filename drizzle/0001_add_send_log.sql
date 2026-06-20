-- Add kill-switch column to cohorts
ALTER TABLE "cohorts" ADD COLUMN "send_status" text DEFAULT 'active';
--> statement-breakpoint

-- Create audit-log table
CREATE TABLE "send_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_id" uuid NOT NULL,
	"email_id" uuid,
	"sequence_position" integer,
	"esp" text NOT NULL,
	"status" text NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "send_log"
  ADD CONSTRAINT "send_log_cohort_id_cohorts_id_fk"
  FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "send_log"
  ADD CONSTRAINT "send_log_email_id_emails_id_fk"
  FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX "send_log_cohort_id_idx" ON "send_log" USING btree ("cohort_id");
