CREATE TYPE "public"."workflow_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "workflow_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_name" varchar(100) NOT NULL,
	"workflow_id" varchar(255),
	"status" "workflow_status" DEFAULT 'pending' NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"result" jsonb,
	"error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
