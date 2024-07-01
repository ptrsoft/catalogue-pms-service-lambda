CREATE TABLE IF NOT EXISTS "usecases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"arn" varchar(255) NOT NULL,
	"usecase" jsonb,
	"project_id" uuid,
	"workflow_id" uuid,
	"assignee_id" uuid
);
--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "arn" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "start_date";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "end_date";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usecases" ADD CONSTRAINT "usecases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usecases" ADD CONSTRAINT "usecases_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usecases" ADD CONSTRAINT "usecases_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
